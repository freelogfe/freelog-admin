/**
 * 静态数据
 */

/** 日期段选择器快速选项 */
export const dateRangeShortcuts = [
  {
    text: "上周",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
      return [start, end];
    },
  },
  {
    text: "上月",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
      return [start, end];
    },
  },
  {
    text: "前三个月",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
      return [start, end];
    },
  },
];

/** 资源类型列表 */
export const resourceTypeList = [
  { value: "主题" },
  { value: "插件" },
  {
    value: "阅读",
    children: [
      { value: "文章" },
      { value: "电子书" },
      { value: "连载写作" },
      { value: "连载漫画" },
      { value: "演示文稿" },
    ],
  },
  {
    value: "音频",
    children: [
      { value: "音效" },
      { value: "音乐" },
      { value: "播客节目" },
      { value: "音乐专辑" },
      // { value: "播客频道/连载有声书广播剧" },
    ],
  },
  { value: "图片", children: [{ value: "照片" }, { value: "插画" }, { value: "矢量图" }] },
  {
    value: "视频",
    children: [
      { value: "动态影像" },
      { value: "实拍片段" },
      { value: "短视频" },
      { value: "长视频" },
      { value: "视频合集" },
    ],
  },
  { value: "游戏", children: [{ value: "红白机" }] },
];
