<!-- 编辑资源属性 -->
<template>
  <edit-template>
    <template v-slot:title>{{ query.id ? "编辑资源属性" : "创建资源属性" }}</template>

    <template v-slot:barRight>
      <el-button type="primary" @click="save(1)">{{ query.id ? "保存" : "创建" }}</el-button>
    </template>

    <template v-slot:main>
      <form-item label="名称">
        <el-input style="width: 400px" v-model="formData.myTitle" placeholder="请输入名称" clearable />
      </form-item>
      <form-item label="说明">
        <el-input style="width: 400px" v-model="formData.myTitle" placeholder="请输入说明（选填）" clearable />
      </form-item>
      <form-item label="属性键">
        <el-input style="width: 400px" v-model="formData.myTitle" placeholder="请输入属性键" clearable />
      </form-item>
      <form-item label="录入方式">
        <el-select style="width: 400px" placeholder="请选择录入方式" v-model="formData.myTitle" clearable>
          <el-option v-for="item in formatList" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </form-item>
      <form-item label="属性值格式">
        <el-select style="width: 400px" placeholder="请选择属性值格式" v-model="formData.myTitle" clearable>
          <el-option v-for="item in formatList" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </form-item>
    </template>
  </edit-template>
</template>

<script lang="ts">
import { reactive, toRefs } from "vue";
import { ActivitiesService } from "@/api/request";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage } from "element-plus";
import { formatDate } from "@/utils/common";
import { CreateOrEditActivityParams } from "@/typings/params";

/** 资源属性数据 */
export interface MyCreateOrEditActivity extends CreateOrEditActivityParams {
  myTitle?: string;
  myPublishDate?: string | null;
  publishType?: 1 | 2;
}

export default {
  setup() {
    const { query, switchPage } = useMyRouter();
    const asstesData = {
      formatList: [
        { value: "Option1", label: "文本" },
        { value: "Option2", label: "数值" },
        { value: "Option3", label: "时间" },
        { value: "Option4", label: "日期" },
        { value: "Option5", label: "日期和时间" },
      ],
    };
    const data = reactive({
      loading: false,
      formData: {} as MyCreateOrEditActivity,
    });

    const methods = {
      /** 获取资源属性数据 */
      async getData() {
        const { id } = query.value;
        if (id) {
          // 编辑
          const result = await ActivitiesService.getActivityData(id);
          const { errcode } = result.data;
          if (errcode === 0) {
            const formData: MyCreateOrEditActivity = result.data.data;
            const { title, publishDate } = formData;
            formData.myTitle = title;
            if (publishDate) {
              formData.publishType = 2;
              formData.myPublishDate = publishDate;
            }
            data.formData = { ...formData };
          }
        } else {
          // 新建
          data.formData.persist = true;
        }
      },

      /**
       * 保存
       * @params type 保存类型 1-保存 2-保存并发布
       */
      async save(type: 1 | 2) {
        if (type === 2 && !validate()) return;

        const { myTitle, publishType, myPublishDate } = data.formData;
        data.formData.isDraft = type === 1;
        data.formData.title = myTitle || "未命名活动";
        if (publishType === 1) {
          data.formData.publishDate = formatDate(new Date().getTime() + 1000 * 5);
        } else if (publishType === 2 && myPublishDate) {
          data.formData.publishDate = formatDate(myPublishDate);
        }
        const func = query.value.id ? "editActivity" : "createActivity";
        const result = await ActivitiesService[func](data.formData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const msg = type === 1 ? "保存成功" : "保存并发布成功";
          ElMessage.success(msg);
          switchPage("/operating/activity-management");
        }
      },
    };

    /** 表单验证 */
    const validate = () => {
      const { myTitle, persist, startTime, limitTime, cover, link, publishType, myPublishDate } = data.formData;
      if (!myTitle) {
        ElMessage("请输入活动名称");
        return false;
      } else if (!persist && (!startTime || !limitTime)) {
        ElMessage("请选择活动时间");
        return false;
      } else if (!cover) {
        ElMessage("请上传活动海报");
        return false;
      } else if (!link) {
        ElMessage("请输入活动页链接");
        return false;
      } else if (!publishType || (publishType === 2 && !myPublishDate)) {
        ElMessage("请选择发布时间");
        return false;
      }
      return true;
    };

    methods.getData();

    return {
      ...asstesData,
      query,
      ...toRefs(data),
      ...methods,
    };
  },
};
</script>
