<!-- 发放记录 -->
<template>
  <list-template>
    <template v-slot:top>
      <div class="card">
        <el-table :data="rewardData">
          <el-table-column property="title" label="奖励名称" min-width="150" />
          <el-table-column label="奖励类型" min-width="100">
            <template #default="scope">
              {{ rewardTypeMapping.find((item: any) => item.value === scope.row.rewardType).label }}
            </template>
          </el-table-column>
          <el-table-column label="有效期" min-width="250">
            <template #default="scope">{{
              `${formatDate(scope.row.startTime)} 至 ${formatDate(scope.row.limitTime)}`
            }}</template>
          </el-table-column>
          <el-table-column label="状态">
            <template #default="scope">{{ getStatus(scope.row) }}</template>
          </el-table-column>
          <el-table-column fixed="right" width="40">
            <template #header>
              <el-icon class="operation-icon" title="操作">
                <operation />
              </el-icon>
            </template>
            <template #default="scope">
              <el-icon class="icon-btn" title="恢复" @click="operateReward(scope.row)" v-if="scope.row.status === 2">
                <check />
              </el-icon>
              <el-icon class="icon-btn" title="暂停" @click="operateReward(scope.row)" v-if="scope.row.status === 1">
                <close />
              </el-icon>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="card statistic-area">
        <div class="statistic-item">
          <div class="title">昨日发放额度（元）</div>
          <div class="num">{{ statisticData.sumRewardNumY }}</div>
        </div>
        <div class="statistic-item">
          <div class="title">昨日发放次数</div>
          <div class="num">{{ statisticData.countRewardRecordY }}</div>
        </div>
        <div class="statistic-item">
          <div class="title">昨日发放用户数</div>
          <div class="num">{{ statisticData.countUserIdY }}</div>
        </div>
        <div class="statistic-item">
          <div class="title">累计发放额度（元）</div>
          <div class="num">{{ statisticData.sumRewardNum }}</div>
        </div>
        <div class="statistic-item">
          <div class="title">累计发放次数</div>
          <div class="num">{{ statisticData.countRewardRecord }}</div>
        </div>
        <div class="statistic-item">
          <div class="title">累计发放用户数</div>
          <div class="num">{{ statisticData.countUserId }}</div>
        </div>
      </div>
    </template>

    <template v-slot:barLeft v-if="selectedData.length">
      <el-button type="primary" @click="audit()">批量审核</el-button>
      <span class="selected-tip">已选中{{ selectedData.length }}条</span>
    </template>

    <template v-slot:filterBar>
      <div class="filter-controls">
        <form-item label="用户名">
          <el-input v-model="searchData.keywords" placeholder="请输入用户名" clearable @keyup.enter="getData(true)" />
        </form-item>
        <form-item label="发放状态">
          <el-select v-model="searchData.tag" placeholder="请选择发放状态" clearable>
            <el-option v-for="item in recordTagMapping" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </form-item>
      </div>
      <div class="filter-btns">
        <el-button type="primary" @click="getData(true)">搜索</el-button>
        <el-button @click="clearSearch()">重置</el-button>
      </div>
    </template>

    <template v-slot:table>
      <el-table ref="tableRef" :data="tableData" stripe @selection-change="selectTable" v-loading="loading">
        <el-table-column type="selection" :selectable="(row) => row.tag === 1" />
        <el-table-column property="id" label="记录编号" min-width="250" />
        <el-table-column label="关联信息" min-width="250">
          <template #default="scope">
            <div class="info">
              <div>{{ scope.row.rewardConfigTitle }}</div>
              <template v-for="item in scope.row.resources" :key="item.resourceId">
                <subject-name :type="1" :name="item.resourceName" :id="item.resourceId" />
              </template>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="用户" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <span class="text-btn" @click="switchPage('/user/user-management', { userId: scope.row.userId })">
              {{ scope.row.username }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="生成日期" min-width="160">
          <template #default="scope">{{ formatDate(scope.row.updateTime) }}</template>
        </el-table-column>
        <el-table-column property="rewardNum" label="发放额度（元）" min-width="250" />
        <el-table-column label="发放状态">
          <template #default="scope">
            {{ recordTagMapping.find((item: any) => item.value === scope.row.tag).label }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" width="40">
          <template #header>
            <el-icon class="operation-icon" title="操作">
              <operation />
            </el-icon>
          </template>
          <template #default="scope">
            <el-icon class="icon-btn" title="审核" @click="audit(scope.row.id)" v-if="scope.row.tag === 1">
              <check />
            </el-icon>
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

  <el-dialog v-model="auditPopupShow" title="奖励发放审核" width="400px">
    <el-radio-group v-model="operateData.isPass">
      <el-radio :label="true">审核通过，允许发放</el-radio><br />
      <el-radio :label="false"><span class="refuse-tip">审核未通过，不予发放</span></el-radio>
    </el-radio-group>
    <template #footer>
      <el-button @click="auditPopupShow = false">取消</el-button>
      <el-button type="primary" :disabled="operateData.isPass === null" @click="operateAuditConfirm()">确定</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { formatDate } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ActivitiesService } from "@/api/request";
import { Operation, Check, Close } from "@element-plus/icons-vue";
import { defineAsyncComponent, reactive, ref, toRefs } from "vue";
import { Reward, RewardRecord } from "@/typings/object";
import { ElMessage, ElMessageBox, ElTable } from "element-plus/lib/components";
import { RewardRecordListParams } from "@/typings/params";

export default {
  components: {
    "subject-name": defineAsyncComponent(() => import("@/components/subject-name.vue")),
    Operation,
    Check,
    Close,
  },

  setup() {
    const { query, switchPage } = useMyRouter();
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
      ],
      recordTagMapping: [
        { value: 1, label: "待审核" },
        { value: 2, label: "已拒绝" },
        { value: 3, label: "待领取" },
        { value: 4, label: "已发放" },
      ],
    };
    const tableRef = ref<InstanceType<typeof ElTable>>();
    const data = reactive({
      id: "",
      rewardData: [] as Reward[],
      statisticData: {} as any,
      loading: false,
      tableData: [] as RewardRecord[],
      total: 0,
      searchData: { currentPage: 1, limit: 20 } as RewardRecordListParams,
      selectedData: [] as RewardRecord[],
      operateData: { isPass: null as boolean | null, ids: [] as string[] },
      auditPopupShow: false,
    });

    const methods = {
      /** 获取活动奖励数据 */
      async getRewardInfo() {
        const result = await ActivitiesService.getRewardById(data.id);
        const { data: rewardData } = result.data;
        if (rewardData) data.rewardData = [rewardData];
      },

      /** 获取活动奖励统计数据 */
      async getRewardStatistic() {
        const result = await ActivitiesService.getRewardStatistic(data.id);
        data.statisticData = result.data.data;
      },

      /** 获取列表数据 */
      async getData(init = false) {
        data.tableData = [];
        data.loading = true;
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        const result = await ActivitiesService.getRewardRecordList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { rewardRecords, num } = result.data.data;

          if (rewardRecords.length === 0) {
            data.loading = false;
            return;
          }

          data.tableData = rewardRecords;
          data.total = num;
          data.loading = false;
        }
      },

      /** 重置 */
      clearSearch() {
        data.searchData = {
          id: data.id,
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

      /** 选择表格项 */
      selectTable(selected: RewardRecord[]) {
        data.selectedData = selected;
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
          data.rewardData[0].status = status === 1 ? 2 : 1;
        } else {
          ElMessage.error(msg);
        }
      },

      /** 审核 */
      audit(id?: string) {
        data.operateData.ids = id ? [id] : data.selectedData.map((item) => item.id);
        data.auditPopupShow = true;
      },

      /** 操作审核 */
      async operateAuditConfirm() {
        const { isPass } = data.operateData;
        if (isPass === null) return;

        const result = await ActivitiesService.operateIssue(data.operateData as { isPass: boolean; ids: string[] });
        const { errcode, msg } = result.data;
        if (errcode === 0) {
          data.operateData.ids.forEach((id) => {
            const record = data.tableData.find((item) => item.id === id);
            if (record) record.tag = isPass ? 4 : 2;
          });
          tableRef.value!.clearSelection();
          ElMessage.success(`审核${isPass ? "通过" : "拒绝"}`);
          data.auditPopupShow = false;
          data.operateData.isPass = null;
        } else {
          ElMessage.error(msg);
        }
      },
    };

    data.id = query.value.id;
    data.searchData.id = data.id;
    methods.getRewardInfo();
    methods.getRewardStatistic();
    methods.getData(true);

    return {
      ...assetsData,
      tableRef,
      ...toRefs(data),
      ...methods,
      formatDate,
      switchPage,
    };
  },
};
</script>

<style lang="scss" scoped>
.card {
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.1);
  margin-top: 30px;

  &.statistic-area {
    display: flex;

    .statistic-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;

      .title {
        font-size: 16px;
        opacity: 0.7;
      }

      .num {
        font-size: 30px;
        font-weight: bold;
        margin-top: 10px;
      }
    }
  }
}

.el-radio-group {
  display: block;
}

.refuse-tip {
  color: #ff0000;
}
</style>
