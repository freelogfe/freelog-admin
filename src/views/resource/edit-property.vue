<!-- 编辑资源属性 -->
<template>
  <edit-template>
    <template v-slot:title>{{ mode === 'create' ? "编辑资源属性" : "创建资源属性" }}</template>

    <template v-slot:barRight>
      <el-button type="primary" @click="save()">{{ mode === 'create' ? "保存" : "创建" }}</el-button>
    </template>

    <template v-slot:main>
      <form-item label="名称">
        <el-input style="width: 400px" v-model="formData.name" placeholder="请输入名称" clearable />
      </form-item>
      <form-item label="说明">
        <el-input style="width: 400px" v-model="formData.note" placeholder="请输入说明（选填）" clearable />
      </form-item>
      <form-item label="属性键">
        <el-input
          style="width: 400px"
          v-model="formData.key"
          placeholder="请输入属性键"
          clearable
          :disabled="mode === 'update'"
        />
      </form-item>
      <form-item label="录入方式">
        <el-select
          style="width: 400px"
          placeholder="请选择录入方式"
          v-model="formData.insertMode"
          clearable
          :disabled="mode === 'update'"
        >
          <el-option v-for="item in insertModeList" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </form-item>
      <form-item label="属性值格式">
        <el-select style="width: 400px" placeholder="请选择属性值格式" v-model="formData.format" clearable>
          <el-option v-for="item in formatList" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </form-item>
    </template>
  </edit-template>
</template>

<script lang="ts">
import { reactive, toRefs } from "vue";
import { ResourceService } from "@/api/request";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage } from "element-plus";
import { CreateOrEditResourcePropertyParams } from "@/typings/params";

export default {
  setup() {
    const { query, switchPage } = useMyRouter();
    const asstesData = {
      insertModeList: [{ value: 1, label: "系统解析" }],
      formatList: [
        { value: 1, label: "文本" },
        { value: 2, label: "数值" },
        { value: 3, label: "时间" },
        { value: 4, label: "日期" },
        { value: 5, label: "日期和时间" },
      ],
    };
    const data = reactive({
      loading: false,
      mode: "create" as "create" | "update",
      formData: {} as CreateOrEditResourcePropertyParams,
    });

    const methods = {
      /** 获取资源属性数据 */
      async getData() {
        const { key } = query.value;
        if (key) {
          // 编辑
          data.mode = "update";
          const result = await ResourceService.getResourcePropertyData(key);
          const { errcode } = result.data;
          if (errcode === 0) {
            console.error(result.data)
            data.formData = result.data.data;
          }
        } else {
          // 新建
          data.mode = "create";
        }
      },

      /**
       * 保存
       * @params type 保存类型 1-创建 2-保存
       */
      async save() {
        if (!validate()) return;

        const result = await ResourceService.createOrEditResourceProperty(data.formData, data.mode);
        const { errcode } = result.data;
        if (errcode === 0) {
          const msg = data.mode === "create" ? "创建成功" : "保存成功";
          ElMessage.success(msg);
          switchPage("/resource/property-management");
        }
      },
    };

    /** 表单验证 */
    const validate = () => {
      const { name, key, insertMode, format } = data.formData;
      if (!name) {
        ElMessage("请输入名称");
        return false;
      } else if (!key) {
        ElMessage("请选择属性键");
        return false;
      } else if (!insertMode) {
        ElMessage("请选择录入方式");
        return false;
      } else if (!format) {
        ElMessage("请选择属性值格式");
        return false;
      }
      return true;
    };

    methods.getData();

    return {
      ...asstesData,
      ...toRefs(data),
      ...methods,
    };
  },
};
</script>
