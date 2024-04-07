<!-- 发放记录 -->
<template>
  <list-template>
    <template v-slot:top>
      <div class="card">
        <el-table :data="rewardData">
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
          <el-table-column fixed="right" width="40">
            <template #default="scope">
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
      <el-button type="primary" @click="deduct()" v-if="![1, 3].includes(rewardData[0].rewardType)">批量扣除</el-button>
      <el-button type="primary" @click="restoreDeduct()" v-if="![1, 3].includes(rewardData[0].rewardType)">
        批量恢复积分
      </el-button>
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
        <el-table-column type="selection" :selectable="(row: any) => [1, 4, 5].includes(row.tag)" />
        <el-table-column property="id" label="记录编号" min-width="250" />
        <el-table-column label="关联信息" min-width="300">
          <template #default="scope">
            <div class="info">
              <div>{{ scope.row.rewardConfigDescription }}</div>
              <template v-if="scope.row.extraInfoType.includes('resources')">
                <template v-for="item in scope.row.extraInfo.resources" :key="item.resourceId">
                  <subject-name :type="1" :name="item.resourceName" :id="item.resourceId" />
                </template>
              </template>
              <template v-if="scope.row.extraInfoType.includes('presentableInfos')">
                <template v-for="item in scope.row.extraInfo.presentableInfos" :key="item.presentableId">
                  <subject-name :type="2" :name="item.presentableName" :id="item.presentableId" />
                </template>
              </template>
              <template v-if="scope.row.extraInfoType.includes('nodes')">
                <template v-for="item in scope.row.extraInfo.nodes" :key="item.nodeId">
                  <subject-name :type="3" :name="item.nodeDomain" :id="item.nodeId" />
                </template>
              </template>
              <template v-if="scope.row.extraInfoType.includes('linkUrl')">
                <subject-name :type="4" :name="scope.row.extraInfo.linkUrl" />
              </template>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="用户" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <span class="text-btn" @click="openPage('/user/user-management', { userId: scope.row.userId })">
              {{ scope.row.username }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="生成日期" min-width="160">
          <template #default="scope">{{ formatDate(scope.row.completedTime) }}</template>
        </el-table-column>
        <el-table-column property="rewardNum" label="发放额度（元）" min-width="250" />
        <el-table-column label="发放状态">
          <template #default="scope">
            <el-tooltip effect="dark" :content="scope.row.extra.reason" placement="top" v-if="scope.row.tag === 5">
              {{ mappingMatching(recordTagMapping, scope.row.tag) }}
            </el-tooltip>
            <span v-else>{{ mappingMatching(recordTagMapping, scope.row.tag) }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" width="40">
          <template #default="scope">
            <i class="icon-btn admin icon-audit" title="审核" @click="audit(scope.row.id)" v-if="scope.row.tag === 1" />
            <i
              class="icon-btn admin icon-deduct"
              title="扣除"
              @click="deduct(scope.row.id)"
              v-if="![1, 3].includes(rewardData[0].rewardType) && scope.row.tag === 4"
            />
            <i
              class="icon-btn admin icon-restore"
              title="恢复积分"
              @click="restoreDeduct(scope.row)"
              v-if="scope.row.tag === 5"
            />
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
    <el-radio-group v-model="auditData.isPass">
      <el-radio :label="true">审核通过，允许发放</el-radio><br />
      <el-radio :label="false"><span class="refuse-tip">审核未通过，不予发放</span></el-radio>
    </el-radio-group>
    <template #footer>
      <el-button @click="auditPopupShow = false">取消</el-button>
      <el-button type="primary" :disabled="auditData.isPass === null" @click="operateAuditConfirm()">确定</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="deductPopupShow" title="奖励扣除原因" width="400px">
    <el-radio-group v-model="deductData.reason" @change="deductData.otherReason = ''">
      <el-radio label="不符合发放标准" /><br />
      <el-radio label="存在违规行为" /><br />
      <el-radio label="其他原因">
        <el-input
          style="width: 300px"
          v-model="deductData.otherReason"
          placeholder="其他原因"
          clearable
          @input="deductData.reason = '其他原因'"
        />
      </el-radio>
    </el-radio-group>
    <template #footer>
      <el-button @click="deductPopupShow = false">取消</el-button>
      <el-button type="primary" :disabled="!deductData.reason" @click="operateDeductConfirm()">确定</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { formatDate, mappingMatching } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ActivitiesService } from "@/api/request";
import { defineAsyncComponent, reactive, ref, toRefs } from "vue";
import { Reward, RewardRecord } from "@/typings/object";
import { ElMessage, ElMessageBox, ElTable } from "element-plus/lib/components";
import { RewardRecordListParams } from "@/typings/params";

export default {
  components: {
    "subject-name": defineAsyncComponent(() => import("@/components/subject-name.vue")),
  },

  setup() {
    const { query, openPage } = useMyRouter();
    const assetsData = {
      tagMapping: [
        { value: 1, label: "未生效" },
        { value: 2, label: "进行中" },
        { value: 3, label: "已结束" },
        { value: 4, label: "已停用" },
        { value: 5, label: "已扣除" },
      ],
      rewardTypeMapping: [
        { value: 1, label: "羽币" },
        { value: 2, label: "现金" },
        { value: 3, label: "邀请次数" },
        { value: 4, label: "积分" },
        { value: 5, label: "瓜分资格" },
      ],
      recordTagMapping: [
        { value: 1, label: "待审核" },
        { value: 2, label: "已拒绝" },
        { value: 3, label: "待领取" },
        { value: 4, label: "已发放" },
        { value: 5, label: "已扣除" },
      ],
    };
    const tableRef = ref<InstanceType<typeof ElTable>>();
    const data = reactive({
      id: "",
      code: "",
      rewardData: [] as Reward[],
      statisticData: {} as any,
      loading: false,
      tableData: [] as RewardRecord[],
      total: 0,
      searchData: { currentPage: 1, limit: 20 } as RewardRecordListParams,
      selectedData: [] as RewardRecord[],
      auditData: { isPass: null as boolean | null, ids: [] as string[] },
      auditPopupShow: false,
      deductData: { ids: [] as string[], reason: "", otherReason: "" },
      deductPopupShow: false,
    });

    const methods = {
      /** 获取活动奖励数据 */
      async getRewardInfo() {
        const result = await ActivitiesService.getRewardById(data.code);
        const { data: rewardData } = result.data;
        if (!rewardData) return;
        data.rewardData = [rewardData];
        data.searchData.code = rewardData.code;
        this.getRewardStatistic();
        this.getData(true);
      },

      /** 获取活动奖励统计数据 */
      async getRewardStatistic() {
        const result = await ActivitiesService.getRewardStatistic(data.rewardData[0].code);
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
          code: data.rewardData[0].code,
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
        const { code, status } = item;
        const operate = status === 2 ? "恢复" : "暂停";
        const result = await ActivitiesService.operateReward({ code });
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
        data.auditData.ids = id ? [id] : data.selectedData.map((item) => item.id);
        data.auditPopupShow = true;
      },

      /** 扣除 */
      deduct(id?: string) {
        data.deductData.ids = id ? [id] : data.selectedData.map((item) => item.id);
        data.deductPopupShow = true;
      },

      /** 恢复 */
      restoreDeduct(item?: RewardRecord) {
        ElMessageBox.confirm("确定要恢复积分吗？", "恢复", {
          confirmButtonText: "恢复",
          cancelButtonText: "取消",
        }).then(async () => {
          const ids = item ? [item.id] : data.selectedData.map((item) => item.id);
          const result = await ActivitiesService.restoreDeductIssue({ ids });
          const { errcode, msg } = result.data;
          if (errcode === 0) {
            ids.forEach((id) => {
              const record = data.tableData.find((item) => item.id === id);
              if (record) record.tag = 4;
            });
            tableRef.value!.clearSelection();
            ElMessage.success(`恢复积分成功`);
          } else {
            ElMessage.error(msg);
          }
        });
      },

      /** 操作审核 */
      async operateAuditConfirm() {
        const { isPass } = data.auditData;
        if (isPass === null) return;

        const result = await ActivitiesService.operateIssue(data.auditData as { isPass: boolean; ids: string[] });
        const { errcode, msg } = result.data;
        if (errcode === 0) {
          data.auditData.ids.forEach((id) => {
            const record = data.tableData.find((item) => item.id === id);
            if (record) record.tag = isPass ? 4 : 2;
          });
          tableRef.value!.clearSelection();
          ElMessage.success(`审核${isPass ? "通过" : "拒绝"}`);
          data.auditPopupShow = false;
          data.auditData.isPass = null;
        } else {
          ElMessage.error(msg);
        }
      },

      /** 操作扣除 */
      async operateDeductConfirm() {
        const { ids, reason, otherReason } = data.deductData;
        const params = {
          ids,
          reason: reason === "其他原因" ? otherReason : reason,
        };
        const result = await ActivitiesService.deductIssue(params);
        const { errcode, msg } = result.data;
        if (errcode === 0) {
          data.deductData.ids.forEach((id) => {
            const record = data.tableData.find((item) => item.id === id);
            if (record) {
              record.tag = 5;
              record.extra.reason = params.reason;
            }
          });
          tableRef.value!.clearSelection();
          ElMessage.success("奖励扣除成功");
          data.deductPopupShow = false;
          data.deductData.reason = "";
          data.deductData.otherReason = "";
        } else {
          ElMessage.error(msg);
        }
      },
    };

    data.id = query.value.id;
    data.code = query.value.code;
    methods.getRewardInfo();

    return {
      mappingMatching,
      ...assetsData,
      tableRef,
      ...toRefs(data),
      ...methods,
      formatDate,
      openPage,
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
