import { RouteLocationNormalizedLoaded } from "vue-router";
import { createStore } from "vuex";

export default createStore({
  state: {
    userData: null as any,
    routerHistory: [] as RouteLocationNormalizedLoaded[],
  },

  mutations: {
    setData(state: any, payload: any) {
      state[payload.key] = payload.value;
    },
  },

  actions: {},

  modules: {},
});
