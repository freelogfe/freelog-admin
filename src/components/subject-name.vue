<!-- 标的物名称（资源、展品） -->
<template>
  <div class="subject-name-wrapper">
    <span class="text-button" @click="toOtherPage(0)" v-if="type === 1">
      {{ userName }}
    </span>
    <span class="divider" v-if="type === 1">/</span>
    <span class="text-button" @click="toOtherPage(type)">{{ subjectName }}</span>
  </div>
</template>

<script lang="ts">
import { reactive, toRefs, watch } from "@vue/runtime-core";
import { useMyRouter } from "@/utils/hooks";

export default {
  props: ["type", "name"],

  setup(props: { type: 1 | 2; name: string }) {
    const { switchPage } = useMyRouter();
    const data = reactive({
      userName: "",
      subjectName: "",
    });

    const methods = {
      /**
       * 跳转其他页面
       * @param type 跳转类型 0-用户 1-资源 2-展品
       */
      toOtherPage(type: 0 | 1 | 2) {
        if (type === 0) {
          switchPage("/user/user-management", { keywords: data.userName });
        } else if (type === 1) {
          switchPage("/resource/resource-management", { keywords: data.subjectName });
        } else if (type === 2) {
          switchPage("/node/exhibit-management", { keywords: data.subjectName });
        }
      },
    };

    const initData = () => {
      const { type, name } = props;
      if (type === 1) {
        // 资源
        [data.userName, data.subjectName] = name.split("/");
      } else if (type === 2) {
        // 展品
        data.subjectName = name;
      }
    };

    watch(
      () => props,
      () => {
        initData();
      },
      { immediate: true, deep: true }
    );

    return {
      ...props,
      ...toRefs(data),
      ...methods,
    };
  },
};
</script>

<style lang="scss" scoped>
.subject-name-wrapper {
  word-break: break-all;

  .divider {
    margin: 0 3px;
  }
}
</style>
