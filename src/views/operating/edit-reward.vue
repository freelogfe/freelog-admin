<!-- 编辑奖励配置 -->
<template>
  <edit-template>
    <template v-slot:title>编辑奖励配置</template>

    <template v-slot:status v-if="query.id">{{ statusTip }}</template>

    <template v-slot:barRight>
      <el-button type="primary" @click="save()">保存配置</el-button>
    </template>

    <template v-slot:main>
      <form-item label="奖励名称">
        <el-input style="width: 400px" v-model="formData.title" placeholder="请输入奖励名称" clearable />
      </form-item>
      <form-item label="奖励有效期">
        <el-date-picker
          style="width: 400px"
          v-model="formData.validDate"
          type="datetimerange"
          unlink-panels
          range-separator="-"
          value-format="YYYY-MM-DDTHH:mm:ss.000Z"
          start-placeholder="起始日期"
          end-placeholder="截止日期"
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
import { Reward } from "@/typings/object";

/** 奖励配置编辑数据 */
export interface RewardParams extends Reward {
  validDate: string | null;
}

export default {
  setup() {
    const { query, switchPage } = useMyRouter();
    const data = reactive({
      loading: false,
      formData: {} as RewardParams,
      statusTip: "",
      timeout: null as any,
    });

    const methods = {
      /** 获取活动奖励数据 */
      async getData() {
        const { id } = query.value;
        const result = await ActivitiesService.getRewardById(id);
        const { data: rewardData } = result.data;
        if (!rewardData) return;
        rewardData.validDate = [rewardData.startTime, rewardData.limitTime];
        data.formData = rewardData;
        getStatus(rewardData);
      },

      /** 保存 */
      async save() {
        if (!validate()) return;

        if (!data.formData.validDate) return;
        [data.formData.startTime, data.formData.limitTime] = data.formData.validDate;
        const result = await ActivitiesService.editReward(data.formData);
        const { errcode } = result.data;
        if (errcode === 0) {
          ElMessage.success("保存成功");
          switchPage("/operating/reward-management");
        }
      },
    };

    /** 获取活动状态提示 */
    const getStatus = (formData: RewardParams) => {
      const { status, startTime, limitTime } = formData;
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const end = new Date(limitTime).getTime();
      if (status === 2) {
        data.statusTip = "已停用";
      } else if (now < start) {
        data.statusTip = "未生效";
      } else if (now > end) {
        data.statusTip = "已结束";
      } else if (now < end) {
        data.statusTip = `进行中（距离结束还有${differenceTime(limitTime)}）`;
        getStatusOneSecond(formData);
      }
    };

    /** 一秒后更新活动状态提示 */
    const getStatusOneSecond = (formData: RewardParams) => {
      data.timeout = setTimeout(() => {
        getStatus(formData);
      }, 1000);
    };

    /** 表单验证 */
    const validate = () => {
      const { title, validDate } = data.formData;
      if (!title) {
        ElMessage("请输入奖励名称");
        return false;
      } else if (!validDate || validDate.length !== 2) {
        ElMessage("请选择奖励有效期");
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
      ...toRefs(data),
      ...methods,
    };
  },
};
</script>
