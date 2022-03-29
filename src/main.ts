import { createApp, defineAsyncComponent } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

const app = createApp(App);
app.use(store).use(router);
app.component(
  "list-template",
  defineAsyncComponent(() => import("@/components/list-template.vue"))
);
app.component(
  "form-item",
  defineAsyncComponent(() => import("@/components/form-item.vue"))
);
app.mount("#app");
