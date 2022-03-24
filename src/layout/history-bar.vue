<!-- 历史访问条 -->
<template>
  <div ref="bar" class="history-bar-wrapper">
    <div
      :id="item.name"
      class="history-item"
      :class="{ active: router.currentRoute.value.path === item.path }"
      v-for="item in routerHistory"
      :key="item.value"
      @click="switchPage(item.fullPath)"
    >
      <span>{{ item.meta.title }}</span>
      <el-icon class="delete-btn" @click.stop="deleteHistory(item)" v-if="routerHistory.length > 1">
        <close-bold />
      </el-icon>
    </div>
  </div>
</template>

<script lang="ts">
import { useMyRouter } from "@/utils/hooks";
import { toRefs, watch } from "vue-demi";
import { RouteLocationNormalizedLoaded } from "vue-router";
import { useStore } from "vuex";
import { CloseBold } from "@element-plus/icons-vue";
import { nextTick, ref } from "vue";

export default {
  name: "history-bar",

  components: {
    CloseBold,
  },

  setup() {
    const store = useStore();
    const { router, switchPage } = useMyRouter();
    const bar = ref();

    // 添加历史
    const addHistory = (current: RouteLocationNormalizedLoaded) => {
      const { routerHistory } = store.state;
      if (
        !routerHistory.some((item: RouteLocationNormalizedLoaded) => item.path === current.path) &&
        !current.meta.noHistory
      ) {
        // 历史中没有此页面，添加历史
        routerHistory.push(current);
        store.commit("setData", { key: "routerHistory", value: routerHistory });
        nextTick(() => {
          // 历史记录条滚动到最右端
          bar.value.scroll({ left: 10000, behavior: "smooth" });
        });
      } else {
        // 历史中已存在此页面，将对应历史按钮滚动到可视区域
        scrollToView(current);
      }
    };

    // 滚动到可视区域
    const scrollToView = (current: RouteLocationNormalizedLoaded) => {
      const item = document.getElementById(current.name as string);
      if (!item) return;

      const { scrollLeft, clientWidth } = bar.value;
      const startOffset = item.offsetLeft - 210;
      const endOffset = startOffset + item.offsetWidth;
      // 已完全存在于可视区域，不滚动
      if (startOffset > scrollLeft && endOffset < scrollLeft + clientWidth) return;

      if (scrollLeft <= startOffset) {
        // 从左向右滚动
        bar.value.scroll({
          left: endOffset - clientWidth + 5,
          behavior: "smooth",
        });
      } else {
        // 从右向左滚动
        bar.value.scroll({ left: startOffset - 5, behavior: "smooth" });
      }
    };

    // 删除历史
    const deleteHistory = (select: RouteLocationNormalizedLoaded) => {
      const { routerHistory } = store.state;
      const index = routerHistory.findIndex((item: RouteLocationNormalizedLoaded) => item.path === select.path);
      // 当删除的是最后一个历史页面，则自动跳转到上一个历史页面
      if (index === routerHistory.length - 1) switchPage(routerHistory[routerHistory.length - 2].fullPath);
      routerHistory.splice(index, 1);
      store.commit("setData", { key: "routerHistory", value: routerHistory });
    };

    watch(
      () => router,
      (cur) => {
        addHistory(cur.currentRoute.value);
      },
      { immediate: true, deep: true }
    );

    return { ...toRefs(store.state), bar, router, switchPage, deleteHistory };
  },
};
</script>

<style lang="scss" scoped>
.history-bar-wrapper {
  width: 100%;
  height: 40px;
  background: #fff;
  padding: 2px 16px 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  overflow-x: auto;
  border-bottom: 1px solid #f0f2f5;
  z-index: 1;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(144, 147, 153, 0.1);
    border-radius: 4px;

    &:hover {
      background-color: rgba(144, 147, 153, 0.6);
    }
  }

  .history-item {
    flex-shrink: 0;
    width: fit-content;
    height: 26px;
    color: #aaa;
    background-color: #fff;
    border: 1px solid #f0f2f5;
    padding: 0 20px;
    box-sizing: border-box;
    font-size: 14px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s linear;

    & + .history-item {
      margin-left: 8px;
    }

    &:hover {
      background-color: #f0f2f5;
    }

    &.active {
      background-color: #f0f2f5;
      color: #7c7c7c;
      background-image: url(../assets/images/texture.png);
    }

    .delete-btn {
      margin-left: 5px;
      width: 24px;
      height: 24px;
      transition: all 0.2s linear;

      &:hover {
        color: #626262;
      }
    }
  }
}
</style>
