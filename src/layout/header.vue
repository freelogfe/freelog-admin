<!-- 头部 -->
<template>
  <div class="header-wrapper">
    <div class="page-title">{{ pageTitle }}</div>

    <div class="user-avatar" @mouseover="userBoxShow = true" @mouseleave="userBoxShow = false" v-if="isLogin">
      <!-- <img class="avatar" :src="userData.headImage" :alt="userData.username" /> -->
      <img class="avatar" src="https://image.freelog.com/headImage/50060" />
      <div class="username">ZhuC</div>

      <transition name="slide-down-scale">
        <div class="user-box" v-if="userBoxShow">
          <div class="user-box-body">
            <!-- <img class="avatar" :src="userData.headImage" :alt="userData.username" />
            <div class="box-username">{{ userData.username }}</div>
            <div class="box-mobile">{{ userData.mobile }}</div> -->
            <img class="box-avatar" src="https://image.freelog.com/headImage/50060" />
            <div class="box-username">ZhuC</div>
            <div class="mobile">17727491320</div>
            <div class="btn" @click="callLoginOut()">登出</div>
          </div>
        </div>
      </transition>
    </div>

    <div class="user-btns" v-else>
      <div class="btn" @click="callLogin()">登录</div>
      <div class="btn" @click="register()">注册</div>
    </div>
  </div>
</template>

<script lang="ts">
import { useMyRouter } from "@/utils/hooks";
import { reactive, toRefs, watch } from "vue-demi";
import { RouteRecordRaw } from "vue-router";

export default {
  name: "my-header",

  setup() {
    const { router, switchPage } = useMyRouter();

    const data = reactive({
      pageTitle: "",
      isLogin: true,
      userBoxShow: false,
    });

    const methods = {
      // 注册
      register() {
        window.open("http://user.testfreelog.com/logon");
      },
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

        const { title } = currentRouter?.meta as any;

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

    watch(
      () => router,
      () => {
        data.pageTitle = "";
        changeRouter();
      },
      { immediate: true, deep: true }
    );

    return {
      switchPage,
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
  z-index: 2;

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

    .username {
      margin-left: 10px;
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

          &:last-child {
            border-radius: 0 0 4px 4px;
          }
        }
      }
    }
  }

  .user-btns {
    display: flex;
    margin-left: 25px;

    .btn {
      height: 32px;
      padding: 0 15px;
      box-sizing: border-box;
      border-radius: 4px;
      font-size: 14px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
  }
}
</style>
