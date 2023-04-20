/**
 * 请求封装
 */

import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import qs from "qs";
import { ElMessage } from "element-plus";
import Cookie from "@/utils/cookie";
import store from "../store";
import router from "../router";

const service = axios.create({
  baseURL: process.env.NODE_ENV === "development" ? "/api" : process.env.VUE_APP_BASE_API,
  headers: { "Content-Type": "application/json;charset=utf-8" },
  withCredentials: true,
  timeout: 30000,
  transformRequest: [
    (data) => {
      data = JSON.stringify(data);
      return data;
    },
  ],
  data: (data: any) => data,
  validateStatus() {
    return true;
  },
  transformResponse: [
    (data) => {
      if (typeof data === "string" && data.startsWith("{") && !data.startsWith("{{")) {
        data = JSON.parse(data);
      }
      return data;
    },
  ],
});

/** 待请求 map */
const pending = new Map();

/** 添加请求 */
const addPending = (config: AxiosRequestConfig) => {
  const url = [config.method, config.url, qs.stringify(config.params), qs.stringify(config.data)].join("&");
  config.cancelToken =
    config.cancelToken ||
    new axios.CancelToken((cancel) => {
      if (!pending.has(url)) {
        // 如果 pending 中不存在当前请求，则添加进去
        pending.set(url, cancel);
      }
    });
};

/** 移除请求 */
const removePending = (config: AxiosRequestConfig) => {
  const url = [config.method, config.url, qs.stringify(config.params), qs.stringify(config.data)].join("&");
  if (pending.has(url)) {
    // 如果在 pending 中存在当前请求标识，取消当前请求
    const cancel = pending.get(url);
    cancel(url);
    pending.delete(url);
  }
};

/** 清空 pending 中的请求 */
export const clearPending = () => {
  for (const [url, cancel] of pending) {
    cancel(url);
  }
  pending.clear();
};

/** 请求拦截器 */
service.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // 在请求开始前，对之前的请求做检查取消操作
    removePending(config);
    // 将当前请求添加到 pending 中
    addPending(config);
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `${token}`;
    }
    return config;
  },
  (error) => {
    // 错误抛到业务代码
    error.data = {};
    error.data.msg = "请求失败";
    ElMessage.error(error.data.msg);
    return Promise.resolve(error);
  }
);

/** 响应拦截器 */
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 在请求结束后，移除本次请求
    removePending(response);
    if (response.data.errcode !== 0 && response.data.msg) {
      // 请求出错，将服务器报错抛出
      ElMessage.error(response.data.msg);
    }
    if (response.data.errcode === 3) {
      if (process.env.NODE_ENV === "development") Cookie.clear(["uid", "authInfo"]);
      store.commit("setData", { key: "userData", value: null });
      router.push({ path: "/login", query: { redirect: router.currentRoute.value.fullPath } });
    }
    return response;
  },
  (error) => {
    if (axios.isCancel(error)) {
      console.log("repeated request: " + error.message);
    } else {
      error.data = {};
      error.data.msg = "请求失败";
      ElMessage.error(error.data.msg);
    }
    return Promise.reject(error);
  }
);

export default service;
