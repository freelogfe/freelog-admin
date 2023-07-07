<!-- 编辑资源属性 -->
<template>
  <edit-template>
    <template v-slot:title>{{ mode === "create" ? "创建资源属性" : "编辑资源属性" }}</template>

    <template v-slot:barRight>
      <el-button type="primary" @click="save()">{{ mode === "create" ? "创建" : "保存" }}</el-button>
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
          @change="
            formData.format = null;
            formData.formatUnit = '';
            formData.autoConvert = false;
            formData.contentRule = {};
          "
        >
          <el-option v-for="item in insertModeList" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </form-item>

      <template v-if="formData.insertMode === 1">
        <form-item label="属性值格式">
          <el-select
            style="width: 400px"
            placeholder="请选择属性值格式"
            v-model="formData.format"
            clearable
            @change="
              formData.formatUnit = '';
              formData.autoConvert = false;
            "
          >
            <el-option v-for="item in formatList" :key="item.value" :value="item.value" :label="item.label" />
          </el-select>
        </form-item>
        <form-item label="单位" v-if="formData.format === 2">
          <el-select placeholder="请选择单位" v-model="formData.formatUnit" clearable>
            <el-option v-for="item in formatUnitList" :key="item" :value="item" :label="item" />
          </el-select>
          <el-checkbox style="margin-left: 20px" v-model="formData.autoConvert" label="自动换算单位词头" />
        </form-item>
        <form-item label="属性值获取方式">
          <el-select style="width: 400px" placeholder="请选择属性值获取方式" v-model="formData.analyseMode" clearable>
            <el-option v-for="item in analyseModeList" :key="item.label" :value="item.value" :label="item.label" />
          </el-select>
        </form-item>
      </template>

      <template v-if="formData.insertMode === 2">
        <form-item label="属性值输入">
          <el-select
            style="width: 400px"
            placeholder="请选择属性值输入"
            v-model="formData.format"
            clearable
            @change="formData.contentRule = {}"
          >
            <el-option v-for="item in inputList" :key="item.value" :value="item.value" :label="item.label" />
          </el-select>
        </form-item>
        <template v-if="[6, 7].includes(formData.format!)">
          <form-item label="长度范围（选填）">
            <el-input-number
              style="width: 200px"
              v-model="formData.contentRule.minLength"
              placeholder="最小长度"
              :precision="0"
              :min="0"
              :controls="false"
            />
            <span style="margin: 0 20px">-</span>
            <el-input-number
              style="width: 200px"
              v-model="formData.contentRule.maxLength"
              placeholder="最大长度"
              :precision="0"
              :min="formData.contentRule.minLength"
              :controls="false"
            />
          </form-item>
        </template>
        <template v-if="formData.format === 5">
          <form-item label="可选时间范围（选填）">
            <el-date-picker v-model="formData.contentRule.myStartDateTime" type="datetime" placeholder="最早可选" />
            <span style="margin: 0 20px">-</span>
            <el-date-picker v-model="formData.contentRule.myLimitDateTime" type="datetime" placeholder="最晚可选" />
          </form-item>
        </template>
        <template v-if="formData.format === 4">
          <form-item label="可选日期范围（选填）">
            <el-date-picker v-model="formData.contentRule.myStartDate" placeholder="最早可选" />
            <span style="margin: 0 20px">-</span>
            <el-date-picker v-model="formData.contentRule.myLimitDate" placeholder="最晚可选" />
          </form-item>
        </template>
        <template v-if="formData.format === 8">
          <form-item label="整数范围（选填）">
            <el-input-number
              style="width: 200px"
              v-model="formData.contentRule.min"
              placeholder="最小值"
              :precision="0"
              :controls="false"
            />
            <span style="margin: 0 20px">-</span>
            <el-input-number
              style="width: 200px"
              v-model="formData.contentRule.max"
              placeholder="最大值"
              :precision="0"
              :min="formData.contentRule.min"
              :controls="false"
            />
          </form-item>
        </template>
        <template v-if="formData.format === 9">
          <form-item label="小数范围（选填）">
            <el-input-number
              style="width: 200px"
              v-model="formData.contentRule.minDecimal"
              placeholder="最小值"
              :controls="false"
              :precision="formData.contentRule.precision"
            />
            <span style="margin: 0 20px">-</span>
            <el-input-number
              style="width: 200px"
              v-model="formData.contentRule.maxDecimal"
              placeholder="最大值"
              :min="formData.contentRule.minDecimal"
              :precision="formData.contentRule.precision"
              :controls="false"
            />
            <span style="margin: 0 20px"></span>
            <el-input-number
              style="width: 200px"
              v-model="formData.contentRule.precision"
              placeholder="请输入小数位数"
              :precision="0"
              :min="0"
              :controls="false"
            />
          </form-item>
        </template>
      </template>
    </template>
  </edit-template>
</template>

<script lang="ts">
import { reactive, toRefs } from "vue";
import { ResourceService } from "@/api/request";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage } from "element-plus";
import { CreateOrEditResourcePropertyParams } from "@/typings/params";
import { formatDate } from "@/utils/common";

export default {
  setup() {
    const { query, switchPage } = useMyRouter();
    const asstesData = {
      insertModeList: [
        { value: 1, label: "系统解析" },
        { value: 2, label: "手动录入" },
      ],
      formatList: [
        { value: 1, label: "文本" },
        { value: 2, label: "数值" },
        { value: 3, label: "时间" },
        { value: 4, label: "日期" },
        { value: 5, label: "日期和时间" },
      ],
      formatUnitList: ["b", "px", "ms", "ppi", "fps", "bpm", "bps"],
      analyseModeList: [
        { value: 1, label: "默认" },
        { value: 2, label: "从资源配置文件中获取条目数" },
      ],
      inputList: [
        { value: 6, label: "单行文本" },
        { value: 7, label: "多行文本" },
        { value: 5, label: "日期和时间" },
        { value: 4, label: "日期" },
        { value: 8, label: "整数" },
        { value: 9, label: "小数" },
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
            data.formData = result.data.data;

            const { insertMode, contentRule } = result.data.data;
            if (insertMode === 2 && !contentRule) {
              data.formData.contentRule = {};
            }
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

        if (data.formData.contentRule) {
          const { myStartDateTime, myLimitDateTime, myStartDate, myLimitDate } = data.formData.contentRule;
          if (myStartDateTime) data.formData.contentRule.startDateTime = formatDate(myStartDateTime);
          if (myLimitDateTime) data.formData.contentRule.limitDateTime = formatDate(myLimitDateTime);
          if (myStartDate) data.formData.contentRule.startDate = formatDate(myStartDate);
          if (myLimitDate) data.formData.contentRule.limitDate = formatDate(myLimitDate);
        }

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
      const { name, key, insertMode, format, contentRule } = data.formData;
      if (!name) {
        ElMessage("请输入名称");
        return false;
      } else if (!key) {
        ElMessage("请选择属性键");
        return false;
      } else if (!insertMode) {
        ElMessage("请选择录入方式");
        return false;
      } else if (insertMode === 1) {
        if (!format) {
          ElMessage("请选择属性值格式");
          return false;
        }
      } else if (insertMode === 2) {
        if (!format) {
          ElMessage("请选择属性值输入");
          return false;
        } else {
          if (format === 5) {
            const { myStartDateTime, myLimitDateTime } = contentRule;
            if (
              myStartDateTime &&
              myLimitDateTime &&
              new Date(myStartDateTime).getTime() > new Date(myLimitDateTime).getTime()
            ) {
              ElMessage("最晚可选时间不可早于最早可选时间");
              return false;
            }
          } else if (format === 4) {
            const { myStartDate, myLimitDate } = contentRule;
            if (myStartDate && myLimitDate && new Date(myStartDate).getTime() > new Date(myLimitDate).getTime()) {
              ElMessage("最晚可选日期不可早于最早可选日期");
              return false;
            }
          }
        }
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
