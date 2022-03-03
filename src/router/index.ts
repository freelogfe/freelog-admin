import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Layout from "../layout/index.vue";

const routes: Array<RouteRecordRaw> = [
  // {
  //   path: "/404",
  //   component: () => import("../views/error-page/404.vue"),
  // },
  // {
  //   path: "/401",
  //   component: () => import("../views/error-page/401.vue"),
  // },
  {
    path: "/",
    redirect: "/user",
  },
  {
    path: "/user",
    name: "user",
    redirect: "/user/user-management",
    component: Layout,
    meta: {
      title: "用户",
    },
    children: [
      {
        path: "user-management",
        name: "userManagement",
        component: () => import("../views/user/user-management.vue"),
        meta: {
          title: "用户管理",
        },
      },
      {
        path: "qualification-audit",
        name: "qualificationAudit",
        component: () => import("../views/user/qualification-audit.vue"),
        meta: {
          title: "内测资格审核",
        },
      },
      {
        path: "code-management",
        name: "codeManagement",
        component: () => import("../views/user/code-management.vue"),
        meta: {
          title: "邀请码管理",
        },
      },
    ],
  },
  {
    path: "/utils",
    name: "utils",
    redirect: "/utils/i18n-management",
    component: Layout,
    meta: {
      title: "工具",
    },
    children: [
      {
        path: "i18n-management",
        name: "i18nManagement",
        component: () => import("../views/utils/i18n-management.vue"),
        meta: {
          title: "国际化管理",
        },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
