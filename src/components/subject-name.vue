<!-- 标的物名称（资源、展品） -->
<template>
  <div class="subject-name-wrapper text-btn" @click="toOtherPage()">{{ name }}</div>
</template>

<script lang="ts">
import { reactive, toRefs } from "@vue/runtime-core";
import { useMyRouter } from "@/utils/hooks";

export default {
  props: ["type", "name", "id"],

  setup(props: { type: 1 | 2; name: string; id: string }) {
    const { switchPage } = useMyRouter();
    const data = reactive({
      userName: "",
      subjectName: "",
    });

    const methods = {
      /** 跳转其他页面 */
      toOtherPage() {
        const { type, id } = props;
        if (type === 1) {
          switchPage("/resource/resource-management", { resourceId: id });
        } else if (type === 2) {
          switchPage("/node/exhibit-management", { presentableId: id });
        }
      },
    };

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
}
</style>
