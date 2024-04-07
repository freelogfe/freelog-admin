/**
 * hooks
 */

import { ref, watchEffect } from "vue";
import { useRouter, useRoute } from "vue-router";

/**
 * 路由hook
 */
export const useMyRouter = () => {
  const router = useRouter();
  const route = useRoute();
  const query = ref();

  watchEffect(() => {
    query.value = { ...route.query };
  });

  // 路由跳转方法
  const switchPage = (path: string, query: any = {}) => {
    router.push({ path, query });
  };

  // 路由跳转方法(replace)
  const replacePage = (path: string, query: any = {}) => {
    router.replace({ path, query });
  };

  // 路由跳转方法
  const routerBack = () => {
    router.back();
  };

  // 打开新页面
  const openPage = (url: string, params: any = {}) => {
    if (params) {
      Object.keys(params).forEach((key: string, index: number) => {
        const prefix = index ? "&" : "?";
        const param = `${key}=${params[key]}`;
        url += `${prefix}${param}`;
      });
    }
    window.open(url);
  };

  return { route, router, query, switchPage, replacePage, routerBack, openPage };
};
