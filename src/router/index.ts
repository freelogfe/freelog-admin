import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Layout from "../layout/index.vue";
import { clearPending } from "@/api/http";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/error",
    name: "error",
    component: Layout,
    meta: {
      title: "error",
      hidden: true,
    },
    children: [
      {
        path: "404",
        name: "404",
        component: () => import("../views/error/404.vue"),
        meta: {
          title: "404",
          noHistory: true,
        },
      },
    ],
  },

  {
    path: "/:pathMatch(.*)",
    redirect: "/error/404",
    meta: {
      hidden: true,
    },
  },

  {
    path: "/login",
    name: "login",
    component: () => import("../views/login/login.vue"),
    meta: {
      hidden: true,
      noHistory: true,
    },
  },

  {
    path: "/",
    redirect: "/user",
    meta: {
      hidden: true,
    },
  },

  {
    path: "/user",
    name: "user",
    redirect: "/user/user-management",
    component: Layout,
    meta: {
      title: "用户",
      icon: "user",
    },
    children: [
      {
        path: "user-management",
        name: "userManagement",
        component: () => import("../views/user/user-management.vue"),
        meta: {
          title: "用户管理",
          sideBarItem: "userManagement",
        },
      },
      {
        path: "tag-management",
        name: "userTagManagement",
        component: () => import("../views/user/tag-management.vue"),
        meta: {
          title: "用户标签管理",
          sideBarItem: "userManagement",
          hidden: true,
        },
      },
      {
        path: "qualification-audit",
        name: "qualificationAudit",
        component: () => import("../views/user/qualification-audit.vue"),
        meta: {
          title: "内测资格审核",
          sideBarItem: "qualificationAudit",
        },
      },
      {
        path: "code-management",
        name: "codeManagement",
        component: () => import("../views/user/code-management.vue"),
        meta: {
          title: "邀请码管理",
          sideBarItem: "codeManagement",
        },
      },
    ],
  },
  {
    path: "/resource",
    name: "resource",
    redirect: "/resource/resource-management",
    component: Layout,
    meta: {
      title: "资源",
      icon: "document-copy",
    },
    children: [
      {
        path: "resource-management",
        name: "resourceManagement",
        component: () => import("../views/resource/resource-management.vue"),
        meta: {
          title: "资源管理",
          sideBarItem: "resourceManagement",
        },
      },
      {
        path: "tag-management",
        name: "resourceTagManagement",
        component: () => import("../views/resource/tag-management.vue"),
        meta: {
          title: "资源标签管理",
          sideBarItem: "resourceManagement",
          hidden: true,
        },
      },
    ],
  },
  {
    path: "/node",
    name: "node",
    redirect: "/node/node-management",
    component: Layout,
    meta: {
      title: "节点",
      icon: "files",
    },
    children: [
      {
        path: "node-management",
        name: "nodeManagement",
        component: () => import("../views/node/node-management.vue"),
        meta: {
          title: "节点管理",
          sideBarItem: "nodeManagement",
        },
      },
      {
        path: "tag-management",
        name: "nodeTagManagement",
        component: () => import("../views/node/tag-management.vue"),
        meta: {
          title: "节点标签管理",
          sideBarItem: "nodeManagement",
          hidden: true,
        },
      },
      {
        path: "exhibit-management",
        name: "exhibitManagement",
        component: () => import("../views/node/exhibit-management.vue"),
        meta: {
          title: "展品管理",
          sideBarItem: "exhibitManagement",
        },
      },
    ],
  },
  {
    path: "/contract",
    name: "contract",
    redirect: "/contract/contract-management",
    component: Layout,
    meta: {
      title: "合约",
      icon: "reading",
    },
    children: [
      {
        path: "contract-management",
        name: "contractManagement",
        component: () => import("../views/contract/contract-management.vue"),
        meta: {
          title: "合约管理",
          sideBarItem: "contractManagement",
        },
      },
    ],
  },
  {
    path: "/trade",
    name: "trade",
    redirect: "/trade/trade-record-management",
    component: Layout,
    meta: {
      title: "交易",
      icon: "bell",
    },
    children: [
      {
        path: "trade-record-management",
        name: "tradeRecordManagement",
        component: () => import("../views/trade/trade-record-management.vue"),
        meta: {
          title: "交易记录管理",
          sideBarItem: "tradeManagement",
        },
      },
    ],
  },
  {
    path: "/operating",
    name: "operating",
    redirect: "/operating/activity-management",
    component: Layout,
    meta: {
      title: "运营",
      icon: "money",
    },
    children: [
      {
        path: "edit-choiceness",
        name: "editChoiceness",
        component: () => import("../views/operating/edit-choiceness.vue"),
        meta: {
          title: "编辑精选",
          sideBarItem: "editChoiceness",
        },
      },
      {
        path: "activity-management",
        name: "activityManagement",
        component: () => import("../views/operating/activity-management.vue"),
        meta: {
          title: "活动管理",
          sideBarItem: "activityManagement",
        },
      },
      {
        path: "edit-activity",
        name: "editActivity",
        component: () => import("../views/operating/edit-activity.vue"),
        meta: {
          title: "编辑活动",
          sideBarItem: "activityManagement",
          hidden: true,
        },
      },
      {
        path: "advertisement-management",
        name: "advertisementManagement",
        component: () => import("../views/operating/advertisement-management.vue"),
        meta: {
          title: "站内广告管理",
          sideBarItem: "advertisementsManagement",
        },
      },
      {
        path: "edit-advertisement",
        name: "editAdvertisement",
        component: () => import("../views/operating/edit-advertisement.vue"),
        meta: {
          title: "编辑广告",
          sideBarItem: "advertisementsManagement",
          hidden: true,
        },
      },
    ],
  },
  {
    path: "/i18n",
    name: "i18n",
    redirect: "/i18n/translation-management",
    component: Layout,
    meta: {
      title: "国际化",
      icon: "orange",
    },
    children: [
      {
        path: "translation-management",
        name: "translationManagement",
        component: () => import("../views/i18n/translation-management.vue"),
        meta: {
          title: "翻译管理",
          sideBarItem: "translationManagement",
        },
      },
      {
        path: "tag-management",
        name: "translationTagManagement",
        component: () => import("../views/i18n/tag-management.vue"),
        meta: {
          title: "翻译标签管理",
          sideBarItem: "translationManagement",
          hidden: true,
        },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  // 在跳转路由之前，清除所有未处理的请求
  clearPending();
  next();
});

export default router;
