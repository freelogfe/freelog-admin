<!-- 编辑广告 -->
<template>
  <edit-template>
    <template v-slot:title>{{ query.id ? "编辑活动" : "发布活动" }}</template>

    <template v-slot:status v-if="query.id">{{ statusTip }}</template>

    <template v-slot:barRight>
      <el-button @click="save(1)" v-if="!query.id || formData.isDraft">保存</el-button>
      <el-button type="success" @click="save(2)">
        <span v-if="!query.id || formData.isDraft">保存并发布</span>
        <span v-else>保存</span>
      </el-button>
      <el-button type="success" @click="operate(1)" v-if="query.id && !formData.isDraft && formData.status === 2">
        恢复
      </el-button>
      <el-button type="danger" @click="operate(2)" v-if="query.id && !formData.isDraft && formData.status === 1">
        暂停
      </el-button>
    </template>

    <template v-slot:main>
      <form-item label="活动名称">
        <el-input style="width: 400px" v-model="formData.myTitle" placeholder="请输入活动名称" clearable />
      </form-item>
      <form-item label="活动时间">
        <el-radio-group v-model="formData.persist" @change="formData.validityDate = null">
          <el-radio :label="true" :disabled="!formData.isDraft && statusTip !== '未发布'">长期活动</el-radio>
          <el-radio :label="false">限期活动</el-radio>
        </el-radio-group>
        <template v-if="!formData.persist">
          <el-date-picker
            style="margin-left: 20px"
            v-model="formData.startTime"
            type="datetime"
            placeholder="请选择活动开始时间"
          />
          <span style="margin: 0 20px">-</span>
          <el-date-picker v-model="formData.limitTime" type="datetime" placeholder="请选择活动结束时间" />
        </template>
      </form-item>
      <form-item label="活动海报">
        <el-upload
          class="cover-uploader"
          action="/api/v2/storages/files/uploadImage"
          :show-file-list="false"
          :on-success="uploadSuccess"
          :before-upload="beforeUpload"
        >
          <img class="cover" v-if="formData.cover" :src="formData.cover" />
          <el-icon class="plus-icon" v-else><Plus /></el-icon>
        </el-upload>
      </form-item>
      <form-item label="活动页链接">
        <el-input style="width: 500px" v-model="formData.link" placeholder="请输入活动页链接" clearable />
      </form-item>
      <form-item label="发布时间" v-if="!query.id || formData.isDraft || statusTip === '未发布'">
        <el-radio-group v-model="formData.publishType" @change="formData.myPublishDate = null">
          <el-radio :label="1">马上发布</el-radio>
          <el-radio :label="2">定时发布</el-radio>
        </el-radio-group>
        <el-date-picker
          style="margin-left: 20px"
          v-model="formData.myPublishDate"
          type="datetime"
          placeholder="请选择发布时间"
          v-if="formData.publishType === 2"
        />
      </form-item>
    </template>
  </edit-template>
</template>

<script lang="ts">
import { onUnmounted, reactive, toRefs } from "vue";
import { ActivitiesService } from "@/api/request";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage } from "element-plus";
import { formatDate, differenceTime } from "@/utils/common";
import { Plus } from "@element-plus/icons-vue";

/** 活动数据 */
interface Activity {
  _id?: number;
  myTitle: string;
  title: string;
  startTime: string;
  limitTime: string;
  persist: boolean;
  cover: string;
  link: string;
  myPublishDate: string | null;
  publishDate: string;
  status: 1 | 2;
  isDraft: boolean;
  publishType: 1 | 2;
}

export default {
  components: {
    Plus,
  },

  setup() {
    const { query, switchPage } = useMyRouter();
    const assetsData = {};
    const data = reactive({
      loading: false,
      formData: {} as Activity,
      statusTip: "",
      timeout: null as any,
    });

    const methods = {
      /** 获取活动数据 */
      async getData() {
        const { id } = query.value;
        if (id) {
          // 编辑
          const result = await ActivitiesService.getActivityData(id);
          const { errcode } = result.data;
          if (errcode === 0) {
            const formData = result.data.data;
            const { title, startTime, limitTime, publishDate } = formData;
            formData.myTitle = title;
            if (startTime && limitTime) formData.validityDate = [startTime, limitTime];
            if (publishDate) {
              formData.publishType = 2;
              formData.myPublishDate = publishDate;
            }
            data.formData = { ...formData };
            getStatus(result.data.data);
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
          data.formData.publishDate = formatDate(new Date());
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

      /**
       * 操作
       * @params type 操作类型 1-恢复 2-暂停
       */
      async operate(type: 1 | 2) {
        const res = await ActivitiesService.getActivityData(query.value.id);
        const formData = res.data.data;
        formData.status = type;
        const result = await ActivitiesService.editActivity(formData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const msg = type === 2 ? "暂停活动成功" : "恢复活动成功";
          ElMessage.success(msg);
          data.formData.status = type;
          clearTimeout(data.timeout);
          getStatus(data.formData);
        }
      },

      /** 上传成功 */
      uploadSuccess(res: { data: { url: string }; errCode: number; msg: string }) {
        const { errCode, msg } = res;
        if (errCode === 0) {
          data.formData.cover = res.data.url;
        } else {
          ElMessage(msg);
        }
      },

      /** 上传文件验证 */
      beforeUpload(rawFile: { type: string }) {
        if (!rawFile.type.startsWith("image")) {
          ElMessage("请上传图片文件");
          return false;
        }
        return true;
      },
    };

    /** 获取活动状态提示 */
    const getStatus = (formData: Activity) => {
      const now = new Date().getTime();
      const { status, isDraft, persist, publishDate, startTime, limitTime } = formData;
      const publishTimestamp = new Date(publishDate).getTime();
      const startTimestamp = new Date(startTime).getTime();
      const limitTimestamp = new Date(limitTime).getTime();
      if (status === 2) {
        data.statusTip = `已暂停`;
      } else if (isDraft) {
        data.statusTip = "草稿";
      } else if (now < publishTimestamp) {
        data.statusTip = "未发布";
        getStatusOneSecond(formData);
      } else if (now <= startTimestamp) {
        data.statusTip = `即将开始（距离开始还有${differenceTime(startTime)}）`;
        getStatusOneSecond(formData);
      } else if (now < limitTimestamp || persist) {
        data.statusTip = "进行中" + (persist ? "" : `（距离结束还有${differenceTime(limitTime)}）`);
        getStatusOneSecond(formData);
      } else if (limitTimestamp <= now) {
        data.statusTip = "已结束";
      }
    };

    /** 一秒后更新活动状态提示 */
    const getStatusOneSecond = (formData: Activity) => {
      data.timeout = setTimeout(() => {
        getStatus(formData);
      }, 1000);
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

    onUnmounted(() => {
      clearTimeout(data.timeout);
    });

    methods.getData();

    return {
      query,
      ...assetsData,
      ...toRefs(data),
      ...methods,
    };
  },
};
</script>

<style lang="scss" scoped>
.cover-uploader {
  width: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8c939d;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s linear;

  &:hover {
    border-color: #c6e2ff;
    color: #409eff;
  }

  &:active {
    border-color: #409eff;
  }

  .cover {
    width: 150px;
  }

  .plus-icon {
    width: 150px;
    height: 150px;
    font-size: 28px;
  }
}
</style>
