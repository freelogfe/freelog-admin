import { createApp, defineAsyncComponent } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

// 正式环境重定向到 https
if (process.env.NODE_ENV === "production" && window.location.protocol === "http:") window.location.protocol = "https:";

const app = createApp(App);
app.use(store).use(router).use(ElementPlus);
app.component(
  "list-template",
  defineAsyncComponent(() => import("@/layout/list-template.vue"))
);
app.component(
  "edit-template",
  defineAsyncComponent(() => import("@/layout/edit-template.vue"))
);
app.component(
  "form-item",
  defineAsyncComponent(() => import("@/components/form-item.vue"))
);
app.mount("#app");
