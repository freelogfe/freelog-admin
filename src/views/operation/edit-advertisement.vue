<!-- 编辑广告 -->
<template>
  <edit-template>
    <template v-slot:title>{{ query.id ? "编辑广告" : "创建广告" }}</template>

    <template v-slot:status v-if="query.id">{{ statusTip }}</template>

    <template v-slot:barRight>
      <el-button type="danger" @click="operate(4)" v-if="query.id && [1, 2].includes(formData.status as number)">
        停用
      </el-button>
      <el-button type="success" @click="operate(0)" v-if="query.id && formData.status === 4">启用</el-button>
      <el-button type="primary" @click="save()">{{ query.id ? "保存" : "创建" }}</el-button>
    </template>

    <template v-slot:main>
      <form-item label="投放位置">
        <el-radio-group v-model="formData.place">
          <el-radio :label="1">首页，顶部公告栏</el-radio>
          <el-radio :label="2">首页，右侧浮窗</el-radio>
          <el-radio :label="3">概览页，右侧Banner</el-radio>
          <el-radio :label="4">发现页，顶部Banner</el-radio>
        </el-radio-group>
      </form-item>
      <form-item label="广告名称">
        <el-input style="width: 400px" v-model="formData.title" placeholder="请输入广告名称" clearable />
      </form-item>
      <form-item label="广告时间">
        <el-radio-group
          v-model="formData.persist"
          @change="
            formData.startTime = undefined;
            formData.limitTime = undefined;
          "
        >
          <el-radio :label="true">长期投放</el-radio>
          <el-radio :label="false">指定时间投放</el-radio>
        </el-radio-group>
        <template v-if="!formData.persist">
          <el-date-picker
            style="margin-left: 20px"
            v-model="formData.startTime"
            type="datetime"
            placeholder="请选择投放开始时间"
          />
          <span style="margin: 0 20px">-</span>
          <el-date-picker v-model="formData.limitTime" type="datetime" placeholder="请选择投放结束时间" />
        </template>
      </form-item>
      <form-item label="素材">
        <el-upload
          class="cover-uploader"
          :action="uploadAction"
          :show-file-list="false"
          :on-success="uploadSuccess"
          :before-upload="beforeUpload"
          with-credentials
        >
          <img class="cover" v-if="formData.cover" :src="formData.cover" />
          <i class="admin icon-plus" v-else />
        </el-upload>
      </form-item>
      <form-item label="点击跳转至">
        <el-radio-group v-model="formData.linkType" @change="changeLinkType($event)">
          <el-radio :label="1">
            站内活动页
            <el-select
              style="width: 500px; margin-left: 10px"
              placeholder="请选择站内活动页"
              v-model="formData.linkActivityId"
              clearable
              filterable
              @change="changeLinkActivity($event)"
            >
              <el-option v-for="item in activityList" :key="item._id" :value="item._id" :label="item.title">
                <span style="float: left">{{ item.title }}</span>
                <span style="float: right; color: #999; font-size: 13px">{{ getActivityStatus(item) }}</span>
              </el-option>
            </el-select>
          </el-radio>
          <el-radio style="margin-top: 10px" :label="2">
            其他推广页
            <el-input
              style="width: 500px; margin-left: 10px"
              v-model="formData.link"
              placeholder="请输入广告页链接"
              clearable
              @input="inputLink($event)"
            />
          </el-radio>
        </el-radio-group>
      </form-item>
      <form-item label="展示序号">
        <el-input-number
          style="width: 200px"
          v-model="formData.priority"
          placeholder="序号越小，展示优先级越高"
          :min="1"
          :controls="false"
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
import { differenceTime } from "@/utils/common";
import { CreateOrEditAdsParams } from "@/typings/params";
import { Activity } from "@/typings/object";

/** 广告编辑数据 */
export interface MyCreateOrEditAds extends CreateOrEditAdsParams {
  linkType?: 1 | 2;
}

export default {
  setup() {
    const { query, switchPage } = useMyRouter();
    const assetsData = {
      statusMappings: { 1: "已排期", 2: "投放中", 3: "已结束", 4: "已停用" },
      uploadAction: `${
        process.env.NODE_ENV === "development" ? "/api" : process.env.VUE_APP_BASE_API
      }/v2/storages/files/uploadImage`,
    };
    const data = reactive({
      loading: false,
      formData: {} as MyCreateOrEditAds,
      activityList: [] as Activity[],
      statusTip: "",
      timeout: null as any,
    });

    const methods = {
      /** 获取广告数据 */
      async getData() {
        const { id } = query.value;
        if (id) {
          // 编辑
          const result = await ActivitiesService.getAdsData(id);
          const { errcode } = result.data;
          if (errcode === 0) {
            const formData: MyCreateOrEditAds = result.data.data;
            if (formData.linkActivityId) {
              formData.linkType = 1;
            } else if (formData.link) {
              formData.linkType = 2;
            }
            data.formData = { ...formData };
            getStatus();
          }
        } else {
          // 新建
          data.formData.persist = true;
        }
      },

      /** 保存 */
      async save() {
        if (!validate()) return;

        const func = query.value.id ? "editAds" : "createAds";
        const result = await ActivitiesService[func](data.formData);
        const { errcode } = result.data;
        if (errcode === 0) {
          ElMessage.success("保存成功");
          switchPage("/operation/advertisement-management");
        }
      },

      /**
       * 操作
       * @params type 操作类型 0-启用 4-停用
       */
      async operate(type: 0 | 4) {
        const { _id } = data.formData;
        if (!_id) return;

        const result = await ActivitiesService.operateAds({ _id, status: type });
        const { errcode } = result.data;
        if (errcode === 0) {
          const msg = type === 4 ? "停用广告成功" : "启用广告成功";
          ElMessage.success(msg);
          const newData = await ActivitiesService.getAdsData(query.value.id);
          data.formData.status = newData.data.data.status;
          clearTimeout(data.timeout);
          getStatus();
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

      /** 切换链接类型 */
      changeLinkType(value: 1 | 2) {
        if (value === 1) {
          data.formData.link = "";
        } else if (value === 2) {
          data.formData.linkActivityId = "";
        }
      },

      /** 切换链接活动 */
      changeLinkActivity(value: string) {
        if (!value) return;
        data.formData.linkType = 1;
        data.formData.link = "";
      },

      /** 输入推广页链接 */
      inputLink(value: string) {
        if (!value) return;
        data.formData.linkType = 2;
        data.formData.linkActivityId = "";
      },

      /** 获取活动状态 */
      getActivityStatus(item: Activity) {
        const now = new Date().getTime();
        const { status, isDraft, persist, publishDate, startTime, limitTime } = item;
        const publishTimestamp = new Date(publishDate).getTime();
        const startTimestamp = new Date(startTime).getTime();
        const limitTimestamp = new Date(limitTime).getTime();
        if (status === 2) {
          return "已暂停";
        } else if (isDraft) {
          return "草稿";
        } else if (now < publishTimestamp) {
          return "未发布";
        } else if (now <= startTimestamp) {
          return "未开始";
        } else if (now < limitTimestamp || persist) {
          return "进行中";
        } else if (limitTimestamp <= now) {
          return "已结束";
        }
      },
    };

    /** 获取广告状态提示 */
    const getStatus = () => {
      const now = new Date().getTime();
      const { status, persist, startTime = "", limitTime = "" } = data.formData;
      data.statusTip = assetsData.statusMappings[status as 1 | 2 | 3 | 4];
      if (status === 1) {
        data.statusTip += persist ? "" : `（距离开始还有${differenceTime(startTime)}）`;
        if (new Date(startTime).getTime() - now < 1000) {
          data.formData.status = 2;
        }
        getStatusOneSecond();
      } else if (status === 2) {
        data.statusTip += persist ? "" : `（距离结束还有${differenceTime(limitTime)}）`;
        if (new Date(limitTime).getTime() - now < 1000) {
          data.formData.status = 3;
        }
        getStatusOneSecond();
      }
    };

    /** 一秒后更新广告状态提示 */
    const getStatusOneSecond = () => {
      data.timeout = setTimeout(() => {
        getStatus();
      }, 1000);
    };

    /** 表单验证 */
    const validate = () => {
      const { place, title, persist, startTime, limitTime, cover, linkType, linkActivityId, link, priority } =
        data.formData;
      if (!place) {
        ElMessage("请选择投放位置");
        return false;
      } else if (!title) {
        ElMessage("请输入广告名称");
        return false;
      } else if (!persist && (!startTime || !limitTime)) {
        ElMessage("请选择投放时间");
        return false;
      } else if (!cover) {
        ElMessage("请上传素材");
        return false;
      } else if (!linkType) {
        ElMessage("请选择跳转类型");
        return false;
      } else if (linkType === 1 && !linkActivityId) {
        ElMessage("请选择站内活动页");
        return false;
      } else if (linkType === 2 && !link) {
        ElMessage("请填写推广页链接");
        return false;
      } else if (!priority) {
        ElMessage("请填写展示序号");
        return false;
      }
      return true;
    };

    /** 获取活动列表 */
    const getActivityList = async () => {
      const result = await ActivitiesService.getValidActivityList();
      const { errcode } = result.data;
      if (errcode === 0) {
        data.activityList = result.data.data;
      }
    };

    onUnmounted(() => {
      clearTimeout(data.timeout);
    });

    methods.getData();
    getActivityList();

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

  .admin {
    width: 150px;
    height: 150px;
    font-size: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
