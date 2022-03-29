<!-- 侧边栏 -->
<template>
  <div class="side-bar-wrapper">
    <div class="logo-box">
      <img class="logo" src="@/assets/images/logo.png" />
    </div>

    <el-scrollbar>
      <el-menu
        class="menu"
        active-text-color="#7c7c7c"
        background-color="transparent"
        text-color="#ddd"
        unique-opened
        :default-active="router.currentRoute.value.meta.sideBarItem"
      >
        <template v-for="group in router.options.routes" :key="group.name">
          <el-sub-menu :index="group.name" v-if="!group.meta.hidden">
            <template #title>
              <el-icon class="item-icon"><component :is="group.meta.icon" /></el-icon>
              <span>{{ group.meta.title }}</span>
            </template>
            <template v-for="item in group.children" :key="item.name">
              <el-menu-item
                :index="item.meta.sideBarItem"
                @click="switchPage(group.path + '/' + item.path)"
                v-if="!item.meta.hidden"
              >
                {{ item.meta.title }}
              </el-menu-item>
            </template>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script lang="ts">
import { useMyRouter } from "../utils/hooks";
import * as icons from "@element-plus/icons-vue";

export default {
  name: "side-bar",

  components: { ...icons },

  setup() {
    const { router, switchPage } = useMyRouter();

    return { router, switchPage };
  },
};
</script>

<style lang="scss" scoped>
.side-bar-wrapper {
  width: 100%;
  height: 100%;
  background-color: #504b46;
  display: flex;
  flex-direction: column;
  background-image: url(../assets/images/texture.png);
  box-shadow: 0 1px 4px rgb(0 21 41 / 8%);

  .logo-box {
    width: 100%;
    height: 50px;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: bold;
    font-style: italic;

    .logo {
      height: 24px;
    }
  }

  .menu {
    width: 100%;
    flex: 1;
    border-right: none;

    .el-menu-item {
      background-color: #494141;

      &:hover {
        background-color: #3b3737;
      }

      &.is-active {
        background-color: #f0f2f5 !important;
        background-image: url(../assets/images/texture.png);
      }
    }

    :deep .el-sub-menu__title:hover {
      background-color: #3b3737 !important;
    }
  }
}
</style>
