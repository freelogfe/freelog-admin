<!-- 侧边栏 -->
<template>
  <div class="side-bar-wrapper">
    <div class="logo">freelog admin</div>

    <el-scrollbar>
      <el-menu
        class="menu"
        active-text-color="#409eff"
        background-color="#304156"
        text-color="#bfcbd9"
        unique-opened
        :default-active="router.currentRoute.value.path"
      >
        <el-sub-menu :index="group.title" v-for="group in sideBarMenus" :key="group.title">
          <template #title>
            <el-icon class="item-icon"><component :is="group.icon" /></el-icon>
            <span>{{ group.title }}</span>
          </template>
          <el-menu-item
            :index="item.path"
            v-for="item in group.children"
            :key="item.title"
            @click="switchPage(item.path)"
          >
            {{ item.title }}
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script lang="ts">
import { sideBarMenus } from "../assets/data/data";
import { useMyRouter } from "../utils/hooks";
import * as icons from "@element-plus/icons-vue";

export default {
  name: "side-bar",

  components: { ...icons },

  setup() {
    const { router, switchPage } = useMyRouter();

    return { sideBarMenus, router, switchPage };
  },
};
</script>

<style lang="scss" scoped>
.side-bar-wrapper {
  width: 100%;
  height: 100%;
  background-color: #304156;
  display: flex;
  flex-direction: column;

  .logo {
    width: 100%;
    height: 50px;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: bold;
    font-style: italic;
  }

  .menu {
    width: 100%;
    flex: 1;
    border-right: none;

    .el-menu-item {
      background-color: #1f2d3d;
      &:hover {
        background-color: #001528;
      }
    }

    ::v-deep .el-sub-menu.is-active .el-sub-menu__title {
      color: #fff !important;
    }

    ::v-deep .el-sub-menu__title:hover {
      background-color: #263445 !important;
    }
  }
}
</style>
