<!-- 活动奖励管理 -->
<template>
  <list-template>
    <template v-slot:filterBar>
      <div class="filter-controls">
        <form-item label="奖励名称">
          <el-input v-model="searchData.keywords" placeholder="请输入奖励名称" clearable @keyup.enter="getData(true)" />
        </form-item>
        <form-item label="奖励状态">
          <el-select v-model="searchData.tag" placeholder="请选择奖励状态" clearable>
            <el-option v-for="item in tagMapping" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </form-item>
        <form-item label="奖励类型">
          <el-select v-model="searchData.rewardType" placeholder="请选择奖励类型" clearable>
            <el-option v-for="item in rewardTypeMapping" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </form-item>
      </div>
      <div class="filter-btns">
        <el-button type="primary" @click="getData(true)">搜索</el-button>
        <el-button @click="clearSearch()">重置</el-button>
      </div>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column property="title" label="奖励名称" min-width="150" />
        <el-table-column label="奖励类型" min-width="100">
          <template #default="scope">{{ mappingMatching(rewardTypeMapping, scope.row.rewardType) }}</template>
        </el-table-column>
        <el-table-column label="有效期" min-width="250">
          <template #default="scope">{{
            `${formatDate(scope.row.startTime)} 至 ${formatDate(scope.row.limitTime)}`
          }}</template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="scope">{{ getStatus(scope.row) }}</template>
        </el-table-column>
        <el-table-column fixed="right" width="100">
          <template #default="scope">
            <i
              class="icon-btn admin icon-detail"
              title="查看发放记录"
              @click="switchPage('/operation/issue-record', { id: scope.row.id })"
            />
            <i
              class="icon-btn admin icon-stop"
              title="暂停"
              @click="operateReward(scope.row)"
              v-if="scope.row.status === 1"
            />
            <i
              class="icon-btn admin icon-restore"
              title="恢复"
              @click="operateReward(scope.row)"
              v-if="scope.row.status === 2"
            />
            <i class="icon-btn admin icon-edit" title="编辑" @click="toEdit(scope.row.id)" />
          </template>
        </el-table-column>
      </el-table>
    </template>

    <template v-slot:pagination>
      <el-pagination
        layout="total, prev, pager, next, jumper"
        v-model:currentPage="searchData.currentPage"
        :total="total"
        :page-size="searchData.limit"
        @current-change="changePage($event)"
      />
    </template>
  </list-template>
</template>

<script lang="ts">
import { formatDate, mappingMatching } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ActivitiesService } from "@/api/request";
import { reactive, toRefs } from "vue";
import { Reward } from "@/typings/object";
import { RewardListParams } from "@/typings/params";
import { ElMessageBox } from "element-plus";
import { ElMessage } from "element-plus/lib/components";

export default {
  setup() {
    const { switchPage } = useMyRouter();
    const assetsData = {
      tagMapping: [
        { value: 1, label: "未生效" },
        { value: 2, label: "进行中" },
        { value: 3, label: "已结束" },
        { value: 4, label: "已停用" },
      ],
      rewardTypeMapping: [
        { value: 1, label: "羽币" },
        { value: 2, label: "现金" },
        { value: 3, label: "邀请次数" },
        { value: 4, label: "积分" },
        { value: 5, label: "瓜分资格" },
      ],
    };
    const data = reactive({
      loading: false,
      tableData: [] as Reward[],
      total: 0,
      searchData: { currentPage: 1, limit: 20 } as RewardListParams,
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        data.tableData = [];
        data.loading = true;
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        if (!data.searchData.rewardType) delete data.searchData.rewardType;
        const result = await ActivitiesService.getRewardList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { rewardConfigs, num } = result.data.data;

          if (rewardConfigs.length === 0) {
            data.total = 0;
            data.loading = false;
            return;
          }

          data.tableData = rewardConfigs;
          data.total = num;
          data.loading = false;
        }
      },

      /** 重置 */
      clearSearch() {
        data.searchData = {
          currentPage: 1,
          limit: 20,
        };
        this.getData(true);
      },

      /** 切换表格页码 */
      changePage(value: number) {
        data.searchData.currentPage = value;
        this.getData();
      },

      /** 获取状态 */
      getStatus(item: Reward) {
        const { status, startTime, limitTime } = item;
        const now = new Date().getTime();
        const start = new Date(startTime).getTime();
        const end = new Date(limitTime).getTime();
        if (status === 2) {
          return "已停用";
        } else if (now < start) {
          return "未生效";
        } else if (now < end) {
          return "进行中";
        } else if (now > end) {
          return "已结束";
        }
      },

      /** 恢复/暂停活动奖励 */
      operateReward(item: Reward) {
        const { status } = item;
        const operate = status === 2 ? "恢复" : "暂停";
        ElMessageBox.confirm(`确定要${operate}此奖励的发放吗？`, operate, {
          confirmButtonText: operate,
          cancelButtonText: "取消",
        }).then(() => {
          this.operateConfirm(item);
        });
      },

      /** 操作活动奖励 */
      async operateConfirm(item: Reward) {
        const { id, status } = item;
        const operate = status === 2 ? "恢复" : "暂停";
        const result = await ActivitiesService.operateReward({ id });
        const { errcode, msg } = result.data;
        if (errcode === 0) {
          ElMessage.success(`${operate}成功`);
          const currentItem = data.tableData.find((item) => item.id === id);
          if (currentItem) currentItem.status = status === 1 ? 2 : 1;
        } else {
          ElMessage.error(msg);
        }
      },

      /** 编辑奖励 */
      toEdit(id: string) {
        switchPage("/operation/edit-reward", { id });
      },
    };

    methods.getData(true);

    return {
      mappingMatching,
      ...assetsData,
      ...toRefs(data),
      ...methods,
      formatDate,
      switchPage,
    };
  },
};
</script>
