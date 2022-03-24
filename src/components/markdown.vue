<template>
  <div
    ref="contentBody"
    class="markdown-wrapper"
    :class="{ 'normal-text': htmlType !== 'text/markdown' }"
    v-html="htmlContent"
  ></div>
</template>

<script lang="ts">
import showdown from "showdown";
import { reactive, ref, toRefs } from "@vue/reactivity";
import { watch } from "@vue/runtime-core";
import { ResourceService } from "@/api/request";
import { ResourceVersion } from "@/views/resource/resource-management.vue";
import { SetupContext } from "vue";

export default {
  name: "my-markdown",

  props: ["data"],

  emits: ["done"],

  setup(
    props: {
      data: { resourceId: string; activeIndex: number; versionList: ResourceVersion[]; versionPopupShow: true };
    },
    context: SetupContext
  ) {
    const contentBody = ref<any>(null);
    const data = reactive({
      htmlContent: "",
      htmlType: "",
    });
    showdown.setOption("tables", true);
    showdown.setOption("tasklists", true);
    showdown.setOption("simplifiedAutoLink", true);
    showdown.setOption("openLinksInNewWindow", true);
    showdown.setOption("backslashEscapesHTMLTags", true);
    showdown.setOption("emoji", true);

    const getContent = async () => {
      data.htmlContent = "";
      data.htmlType = "";
      const { resourceId, activeIndex, versionList } = props.data;
      const activeItem = versionList[activeIndex];
      if (!activeItem) return;

      const { version, content, mime } = activeItem;
      let html = "";
      if (mime === "text/markdown") {
        // markdown 文件，以 markdown 解析
        const converter = new showdown.Converter();
        html = converter.makeHtml(content);
      } else {
        html = content;
      }
      data.htmlType = mime;

      const result = await ResourceService.getResourceDeps(resourceId, { version });
      const { allDeps, requestDeps } = getDeps(result.data.data);

      if (requestDeps.length) {
        let promiseArr = [] as Promise<any>[];
        requestDeps.forEach((dep: { versionId: string; dependencies: any[] }) => {
          const depContent = ResourceService.getResourceFile(dep.versionId);
          promiseArr.push(depContent);
        });

        await Promise.all(promiseArr).then((res) => {
          // 以摊开的所有依赖为准，一个一个替换依赖资源，否则会有遗漏
          allDeps.forEach((dep) => {
            // 找到对应的依赖文件索引
            const depResultIndex = requestDeps.findIndex((requestDep) => requestDep.versionId === dep.versionId);
            if (depResultIndex === -1) return;

            const depResult = res[depResultIndex];
            const type = depResult.headers["content-type"];
            const isMedia = type.startsWith("image") || type.startsWith("video") || type.startsWith("audio");
            if (isMedia) {
              // 媒体资源
              const regText = "src=['\"]" + `freelog://${requestDeps[depResultIndex].resourceName}` + "['\"]";
              const reg = new RegExp(regText, "g");
              const replaceText = `src="/api/v2/resources/versions/${requestDeps[depResultIndex].versionId}/internalClientDownload"`;
              html = html.replace(reg, replaceText);
            } else if (type.startsWith("text")) {
              // 非媒体资源
              const regText = "{{" + `freelog://${requestDeps[depResultIndex].resourceName}` + "}}";
              const reg = new RegExp(regText, "g");
              const converter = new showdown.Converter();
              const data = converter.makeHtml(depResult.data);
              html = html.replace(reg, data);
            }
          });
        });
      }

      data.htmlContent = html;
      context.emit("done");
    };

    /**
     * 获取所有依赖
     * @param deps 依赖树
     */
    const getDeps = (deps: any[]) => {
      // 摊开的所有依赖
      const allDeps = [] as any[];
      // 摊开的所有依赖（不重复），用作请求依赖文件
      const requestDeps = [] as any[];

      const getSubDeps = (subDeps: any[]) => {
        subDeps.forEach((dep) => {
          allDeps.push(dep);
          const index = requestDeps.findIndex((item) => item.versionId === dep.versionId);
          if (index === -1) requestDeps.push(dep);
          if (dep.dependencies.length) getSubDeps(dep.dependencies);
        });
      };

      getSubDeps(deps);

      return { allDeps, requestDeps };
    };

    watch(
      () => props.data,
      (cur) => {
        if (cur.versionPopupShow) getContent();
      },
      { immediate: true, deep: true }
    );

    return {
      contentBody,
      ...toRefs(data),
    };
  },
};
</script>

<style lang="scss" scoped>
::v-deep.markdown-wrapper {
  width: 100%;
  font-size: 16px;
  color: #222;
  overflow-x: hidden;

  &.normal-text {
    white-space: pre-wrap;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: #222;
    line-height: 1.25;
    margin-top: 24px;
    margin-bottom: 16px;
  }

  h1 {
    font-size: 32px;
    margin-top: 0;
  }

  h2 {
    font-size: 24px;
  }

  h3 {
    font-size: 20px;
  }

  h4 {
    font-size: 16px;
  }

  h5 {
    font-size: 14px;
  }

  h6 {
    font-size: 13.6px;
    color: #6a737d;
  }

  hr {
    height: 4px;
    padding: 0;
    margin: 24px 0;
    background-color: #e1e4e8;
    border: 0;
  }

  p {
    font-weight: normal;
    word-break: break-word;
    line-height: 1.6;
    margin-top: 0;
    margin-bottom: 16px;
  }

  strong {
    font-weight: bold;
  }

  em {
    font-style: italic;
  }

  blockquote {
    color: #6a737d;
    border-left: 3px solid #dfe2e5;
    padding: 4px 0 4px 16px;

    p {
      margin: 4px 0;
    }
  }

  ol,
  ul {
    padding-left: 32px;
    padding-bottom: 16px;
    line-height: 1.7;
  }

  ol {
    list-style-type: decimal;
  }

  ul {
    list-style-type: disc;
  }

  pre {
    padding: 16px;
    overflow-x: auto;
    font-size: 85%;
    line-height: 1.45;
    background-color: #282c34;
    border-radius: 3px;

    code {
      background-color: transparent;
      color: #fff;
    }
  }

  code {
    padding: 2px 4px;
    color: rgba(0, 0, 0, 0.8);
    background-color: #f7f7f9;
    border-radius: 3px;
  }

  a {
    color: #3eaf7c;
    font-weight: 500;
    text-decoration: none;
  }

  img,
  video,
  audio {
    max-width: 100%;
    margin-left: 50%;
    transform: translateX(-50%);
  }

  video {
    width: 100%;
  }

  table {
    display: block;
    word-break: initial;
    width: 100%;
    overflow: auto;

    tr {
      background-color: #fff;
      border-top: 1px solid #c6cbd1;

      td {
        padding: 6px 13px;
        border: 1px solid #dfe2e5;
      }
    }
  }
}
</style>
