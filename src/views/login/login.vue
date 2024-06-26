<!-- 登录 -->
<template>
  <div class="login-wrapper">
    <div class="login-box">
      <div class="title">登录</div>
      <el-form ref="ruleFormRef" :model="loginData" :rules="rules">
        <el-form-item prop="loginName">
          <el-input v-model="loginData.loginName" placeholder="用户名" autofocus @keyup.enter="login()">
            <template #prefix>
              <i class="admin icon-user" />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginData.password"
            placeholder="密码"
            type="password"
            show-password
            @keyup.enter="login()"
          >
            <template #prefix>
              <i class="admin icon-password" />
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <div class="btns">
        <el-button class="normal-btn" type="primary" @click="login()">登录</el-button>
        <el-button class="text-btn" type="text" @click="openPage(`${userUrl}/retrieve`)">忘记密码？</el-button>
        <el-button class="normal-btn" @click="openPage(`${userUrl}/logon`)">注册</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { useMyRouter } from "@/utils/hooks";
import { ref, reactive, toRefs } from "vue";
import { ElForm, ElMessage } from "element-plus";
import { PassportService } from "@/api/request";
import Cookie from "@/utils/cookie";
import { LoginParams } from "@/typings/params";

type FormInstance = InstanceType<typeof ElForm>;

export default {
  setup() {
    const { query, replacePage, openPage } = useMyRouter();
    const ruleFormRef = ref<FormInstance>();
    const assetsData = {
      userUrl: (process.env.VUE_APP_BASE_API as string).replace("api", "user"),
      rules: {
        loginName: [
          {
            required: true,
            message: "请输入用户名",
            trigger: "blur",
          },
        ],
        password: [
          {
            required: true,
            message: "请输入密码",
            trigger: "blur",
          },
        ],
      },
    };
    const data = reactive({
      loginData: {
        loginName: process.env.NODE_ENV === "production" ? "" : "support@freelog.com",
        password: process.env.NODE_ENV === "production" ? "" : "f233109!",
      } as LoginParams,
    });

    const methods = {
      /** 登录 */
      login() {
        if (!ruleFormRef.value) return;

        ruleFormRef.value.validate(async (valid) => {
          if (!valid) return;

          if (data.loginData.loginName !== "support@freelog.com") {
            ElMessage.error("用户名或密码错误");
            return;
          }

          const result = await PassportService.login(data.loginData);
          const { errcode } = result.data;
          if (errcode === 0) {
            /* 本地登录人为添加 cookie */
            if (process.env.NODE_ENV === "development") {
              Cookie.set("uid", 50031);
              Cookie.set(
                "authInfo",
                "eyJhbGciOiJSU0EtU0hBMjU2IiwidHlwIjoiSldUIn0=.eyJ1c2VySWQiOjUwMDMxLCJ1c2VybmFtZSI6IkZyZWVsb2ciLCJ1c2VyVHlwZSI6MSwibW9iaWxlIjoiIiwiZW1haWwiOiJzdXBwb3J0QGZyZWVsb2cuY29tIiwiaXNzIjoiaHR0cHM6Ly9pZGVudGl0eS5mcmVlbG9nLmNvbSIsInN1YiI6IjUwMDMxIiwiYXVkIjoiZnJlZWxvZy13ZWJzaXRlIiwiZXhwIjoxNjQ4Mjc2ODcyLCJpYXQiOjE2NDY5ODA4NzIsImp0aSI6ImVlYmViMTM1YzJmOTRkZDA4MDNmZTQxNTVjMmViNzQ5In0=.1b4db7b00a710f3b84d877485c80fc1ae7d4453bbb37a07e578b7cfc1b63b72b30db623b2b58e3b1163ac730cd554bb45017a6653f03ecda36870b4b7d252023f3e8fe4c2246a4c32174bd4da869a8c7ee22e0bddab128e5515c4a2816a48942252670a7689fff74a3fa506d673681c669ea4109315e5cd95136e84ef7e7b80b"
              );
            }
            replacePage(query.value.redirect || "/");
          }
        });
      },
    };

    return {
      ruleFormRef,
      openPage,
      ...assetsData,
      ...toRefs(data),
      ...methods,
    };
  },
};
</script>

<style lang="scss" scoped>
.login-wrapper {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: url(../../assets/images/login-bg.jpg) no-repeat 50%;
  display: flex;
  justify-content: flex-end;

  .login-box {
    width: 30%;
    height: 100%;
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(6px);
    border-radius: 6px;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    padding: 10% 5%;
    box-sizing: border-box;

    .title {
      text-align: center;
      font-size: 26px;
      color: #fff;
      padding: 20px 0;
      letter-spacing: 5px;
    }

    .el-form-item + .el-form-item {
      margin-top: 50px;
    }

    :deep .el-input__inner {
      height: 40px;
      padding-left: 50px;
    }

    :deep .el-input__prefix-inner {
      display: flex;
      align-items: center;
      font-size: 20px;
      margin-left: 5px;
      color: #000;
      font-weight: bold;
    }

    .btns {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      margin-top: 50px;

      button {
        margin-left: 0;
      }

      .normal-btn {
        width: 100%;
      }

      .text-btn {
        width: fit-content;
        margin-bottom: 100px;
      }
    }
  }
}
</style>
