<!-- 头部 -->
<template>
  <div class="header-wrapper">
    <div class="page-title">{{ pageTitle }}</div>

    <div class="user-avatar" @mouseover="userBoxShow = true" @mouseleave="userBoxShow = false" v-if="userData">
      <img class="avatar" :src="userData.headImage" :alt="userData.username" />

      <transition name="slide-down-scale">
        <div class="user-box" v-if="userBoxShow">
          <div class="user-box-body">
            <img class="box-avatar" :src="userData.headImage" />
            <div class="box-username">{{ userData.username }}</div>
            <div class="mobile">{{ userData.mobile }}</div>
            <div class="btn" @click="callLoginOut()">登出</div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import { useMyRouter } from "@/utils/hooks";
import { RouteRecordRaw } from "vue-router";
import { useStore } from "vuex";
import { PassportService } from "@/api/request";
import Cookie from "@/utils/cookie";
import { reactive, toRefs, watch } from "vue";

export default {
  name: "my-header",

  setup() {
    const store = useStore();
    const { router, switchPage } = useMyRouter();

    const data = reactive({
      pageTitle: "",
      userBoxShow: false,
    });

    const methods = {
      // 登出
      async callLoginOut() {
        const result = await PassportService.logout();
        if (result.data.errcode === 0) toLogin();
      },
    };

    // 跳转登录页面
    const toLogin = (redirect = "") => {
      if (process.env.NODE_ENV === "development") Cookie.clear(["uid", "authInfo"]);
      store.commit("setData", { key: "userData", value: null });
      switchPage("/login", { redirect });
    };

    // 切换路由时，找到对应页面名称并显示
    const changeRouter = () => {
      const { path } = router.currentRoute.value;
      const { routes } = router.options;
      const pathArr = path.split("/");
      pathArr.shift();

      let currentRouter: any;
      let pageTitle = "";
      for (let i = 0; i < pathArr.length; i++) {
        if (i === 0) {
          currentRouter = routes.find((item) => item.path === `/${pathArr[i]}`);
        } else {
          currentRouter = currentRouter.children.find((item: RouteRecordRaw) => item.path === pathArr[i]);
        }

        const { title } = currentRouter.meta as any;

        if (i === pathArr.length - 1) {
          pageTitle += title;
          data.pageTitle = pageTitle;
          break;
        } else {
          pageTitle += title + " / ";
        }
        if (!currentRouter || !currentRouter.children) break;
      }
    };

    // 获取当前登录的用户信息
    const getUserData = async () => {
      const result = await PassportService.getUserData();
      const { data, errcode } = result.data;
      if (errcode === 0) store.commit("setData", { key: "userData", value: data });
      else toLogin(router.currentRoute.value.fullPath);
    };

    watch(
      () => router,
      () => {
        data.pageTitle = "";
        changeRouter();
      },
      { immediate: true, deep: true }
    );

    getUserData();

    return {
      ...toRefs(store.state),
      ...toRefs(data),
      ...methods,
    };
  },
};
</script>

<style lang="scss" scoped>
.header-wrapper {
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  box-sizing: border-box;
  background: #fff;
  box-shadow: 0 1px 4px rgb(0 21 41 / 8%);
  z-index: 3;

  .page-title {
    font-size: 20px;
    font-weight: bold;
  }

  .user-avatar {
    position: relative;
    display: flex;
    align-items: center;
    cursor: pointer;
    margin-left: 25px;

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid #d1d1d1;
    }

    .user-box {
      position: absolute;
      right: 0;
      top: 100%;
      padding-top: 10px;
      cursor: default;
      z-index: 100;

      .user-box-body {
        width: 240px;
        background: #ffffff;
        box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.2);
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        align-items: center;

        .box-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 1px solid #d1d1d1;
          margin-top: 20px;
        }

        .box-username {
          font-size: 16px;
          line-height: 22px;
          color: #222222;
          font-weight: bold;
          margin-top: 15px;
        }

        .mobile {
          font-size: 14px;
          color: #222222;
          font-weight: bold;
          line-height: 20px;
          margin-top: 8px;
          margin-bottom: 16px;
        }

        .btn {
          width: 100%;
          height: 50px;
          line-height: 50px;
          font-size: 14px;
          padding-left: 20px;
          box-sizing: border-box;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          cursor: pointer;
          transition: all 0.2s linear;

          &:hover {
            color: #fff;
            background: #409eff;
          }

          &:active {
            opacity: 0.8;
          }

          &:last-child {
            border-radius: 0 0 4px 4px;
          }
        }
      }
    }
  }
}
</style>
