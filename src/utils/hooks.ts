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

  return { route, router, query, switchPage, replacePage, routerBack };
};
