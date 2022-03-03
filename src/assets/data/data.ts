// 侧边栏模块
export const sideBarMenus = [
  {
    title: "用户",
    icon: "user",
    children: [
      { title: "用户管理", path: "/user/user-management" },
      { title: "内测资格审核", path: "/user/qualification-audit" },
      { title: "邀请码管理", path: "/user/code-management" },
    ],
  },
  {
    title: "资源",
    icon: "document-copy",
    children: [{ title: "资源管理", path: "/resource/resource-management" }],
  },
  {
    title: "节点",
    icon: "files",
    children: [
      { title: "节点管理", path: "/node/node-management" },
      { title: "展品管理", path: "/node/exhibit-management" },
    ],
  },
  {
    title: "合约",
    icon: "reading",
    children: [{ title: "合约管理", path: "/contract/contract-management" }],
  },
  {
    title: "交易",
    icon: "bell",
    children: [{ title: "交易管理", path: "/trade/trade-management" }],
  },
  {
    title: "运营",
    icon: "money",
    children: [
      { title: "活动管理", path: "/operating/activity-management" },
      { title: "站内广告管理", path: "/operating/advertisements-management" },
    ],
  },
  {
    title: "工具",
    icon: "brush",
    children: [{ title: "国际化管理", path: "/utils/i18n-management" }],
  },
];
