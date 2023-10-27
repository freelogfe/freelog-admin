<!-- 标的物名称（资源、展品、节点、链接） -->
<template>
  <div class="subject-name-wrapper text-btn" @click="toOtherPage()">{{ nameToShow }}</div>
</template>

<script lang="ts">
import { reactive, toRefs } from "@vue/runtime-core";
import { useMyRouter } from "@/utils/hooks";
import { computed } from "vue";

export default {
  props: ["type", "name", "id"],

  setup(props: { type: 1 | 2 | 3 | 4; name: string; id?: string }) {
    const { switchPage, openPage } = useMyRouter();
    const data = reactive({
      userName: "",
      subjectName: "",
    });

    const nameToShow = computed(() => {
      const { type, name } = props;
      if (type !== 3) return name;

      const domain = process.env.VUE_APP_BASE_API || "";
      return domain.replace("qi", name);
    });

    const methods = {
      /** 跳转其他页面 */
      toOtherPage() {
        const { type, id, name } = props;
        if (type === 1) {
          switchPage("/resource/resource-management", { resourceId: id });
        } else if (type === 2) {
          switchPage("/node/exhibit-management", { presentableId: id });
        } else if (type === 3) {
          const domain = process.env.VUE_APP_BASE_API || "";
          const url = domain.replace("qi", name);
          openPage(url);
        } else if (type === 4) {
          openPage(name);
        }
      },
    };

    return {
      ...props,
      ...toRefs(data),
      nameToShow,
      ...methods,
    };
  },
};
</script>

<style lang="scss" scoped>
.subject-name-wrapper {
  word-break: break-all;
}
</style>
