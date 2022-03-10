<!-- 登录 -->
<template>
  <div class="login-wrapper">
    <div class="logo">
      <div>freelog</div>
      <div>后台管理系统</div>
    </div>
    <div class="login-box">
      <div class="title">登录</div>
      <el-form ref="ruleFormRef" :model="loginData" :rules="rules">
        <el-form-item prop="loginName">
          <el-input v-model="loginData.loginName" placeholder="用户名" autofocus @keyup.enter="login()">
            <template #prefix>
              <el-icon><user-filled /></el-icon>
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
              <el-icon><lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <div class="btns">
        <el-button class="normal-btn" type="primary" @click="login()">登录</el-button>
        <el-button class="text-btn" type="text" @click="openPage('http://user.testfreelog.com/retrieve')">
          忘记密码？
        </el-button>
        <el-button class="normal-btn" @click="openPage('http://user.testfreelog.com/logon')">注册</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { reactive, toRefs } from "vue-demi";
import { useMyRouter } from "@/utils/hooks";
import { UserFilled, Lock } from "@element-plus/icons-vue";
import { ref } from "vue";
import { ElForm } from "element-plus";
import { UserService } from "@/api/request";

type FormInstance = InstanceType<typeof ElForm>;

export default {
  components: {
    // "form-item": defineAsyncComponent(() => import("@/components/form-item.vue")),
    UserFilled,
    Lock,
  },

  setup() {
    const { replacePage } = useMyRouter();
    const ruleFormRef = ref<FormInstance>();
    const data = reactive({
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
      loginData: {
        loginName: "17727491320",
        password: "ct0724",
      },
    });

    const methods = {
      // 打开新页面
      openPage(url: string) {
        window.open(url);
      },

      // 登录
      login() {
        if (!ruleFormRef.value) return;

        ruleFormRef.value.validate(async (valid) => {
          if (valid) {
            const result = await UserService.login(data.loginData);
            const { errcode } = result.data;
            if (errcode === 0) replacePage("/");
          } else {
            return false;
          }
        });
      },
    };

    return {
      ruleFormRef,
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

  .logo {
    width: 70%;
    padding-top: 10%;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #fff;
    font-size: 100px;
    font-style: italic;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }

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

    ::v-deep .el-input__inner {
      height: 40px;
    }

    ::v-deep .el-input__prefix-inner {
      display: flex;
      align-items: center;
      font-size: 20px;
      margin-left: -5px;
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
