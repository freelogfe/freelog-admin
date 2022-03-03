<!-- 系统布局 -->
<template>
  <div class="layout-wrapper">
    <my-side-bar class="side-bar" />

    <div class="body-wrapper">
      <my-header />
      <history-bar />
      <my-main class="main-wrapper" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineAsyncComponent } from "vue";

export default {
  name: "layout",

  components: {
    "my-side-bar": defineAsyncComponent(() => import("./side-bar.vue")),
    "my-header": defineAsyncComponent(() => import("./header.vue")),
    "history-bar": defineAsyncComponent(() => import("./history-bar.vue")),
    "my-main": defineAsyncComponent(() => import("./main.vue")),
  },
};
</script>

<style lang="scss" scoped>
.layout-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;

  .side-bar {
    width: 210px;
    height: 100%;
    flex-shrink: 0;
  }

  .body-wrapper {
    flex: 1;
    width: 0;
    height: 100%;
    background-color: #f0f2f5;
    display: flex;
    flex-direction: column;

    .main-wrapper {
      width: 100%;
      flex: 1;
      height: 0;
    }
  }
}
</style>
