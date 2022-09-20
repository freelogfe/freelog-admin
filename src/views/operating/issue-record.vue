<!-- 发放记录 -->
<template>
  <list-template>
    <template v-slot:top>
      <div class="card">
        <el-table :data="tableData">
          <el-table-column property="username" label="奖励名称" min-width="250" />
          <el-table-column label="关联信息" min-width="120">
            <template #default="scope">{{ scope.row.resourceType.join("/") }}</template>
          </el-table-column>
          <el-table-column property="createDate" label="有效期" min-width="160">
            <template #default="scope">{{
              `${formatDate(scope.row.createDate)} 至 ${formatDate(scope.row.createDate)}`
            }}</template>
          </el-table-column>
          <el-table-column label="状态">
            <template #default="scope"
              >{{ rewardStatusMapping.find((item: any) => item.value === scope.row.status).label }}
            </template>
          </el-table-column>
          <el-table-column fixed="right" width="40">
            <template #header>
              <el-icon class="operation-icon" title="操作">
                <operation />
              </el-icon>
            </template>
            <template #default="scope">
              <el-icon
                class="icon-btn"
                title="审核"
                @click="operateReward(scope.row.resourceId)"
                v-if="scope.row.status === 3"
              >
                <check />
              </el-icon>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="card statistic-area">
        <div class="statistic-item">
          <div class="title">昨日发放额度（元）</div>
          <div class="num">{{ 1000 }}</div>
        </div>
        <div class="statistic-item">
          <div class="title">昨日发放次数</div>
          <div class="num">{{ 1000 }}</div>
        </div>
        <div class="statistic-item">
          <div class="title">昨日发放用户数</div>
          <div class="num">{{ 1000 }}</div>
        </div>
        <div class="statistic-item">
          <div class="title">累计发放额度（元）</div>
          <div class="num">{{ 1000 }}</div>
        </div>
        <div class="statistic-item">
          <div class="title">累计发放次数</div>
          <div class="num">{{ 1000 }}</div>
        </div>
        <div class="statistic-item">
          <div class="title">累计发放用户数</div>
          <div class="num">{{ 1000 }}</div>
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
          <el-input v-model="searchData.authorName" placeholder="请输入用户名" clearable @keyup.enter="getData(true)" />
        </form-item>
        <form-item label="发放状态">
          <el-select v-model="searchData.status" placeholder="请选择发放状态" clearable>
            <el-option v-for="item in statusMapping" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </form-item>
      </div>
      <div class="filter-btns">
        <el-button type="primary" @click="getData(true)">搜索</el-button>
        <el-button @click="clearSearch()">重置</el-button>
      </div>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" stripe @selection-change="selectTable" v-loading="loading">
        <el-table-column type="selection" />
        <el-table-column property="resourceId" label="记录编号" min-width="250" />
        <el-table-column property="username" label="奖励名称" min-width="250" />
        <el-table-column property="username" label="用户" min-width="250" />
        <el-table-column property="createDate" label="生成日期" min-width="160">
          <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
        </el-table-column>
        <el-table-column property="username" label="发放额度" min-width="250" />
        <el-table-column label="发放状态">
          <template #default="scope"
            >{{ statusMapping.find((item: any) => item.value === scope.row.status).label }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" width="40">
          <template #header>
            <el-icon class="operation-icon" title="操作">
              <operation />
            </el-icon>
          </template>
          <template #default="scope">
            <el-icon class="icon-btn" title="审核" @click="audit(scope.row.resourceId)">
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
    <el-radio-group v-model="operateData.reason">
      <el-radio label="审核通过，允许发放"></el-radio><br />
      <el-radio label="审核未通过，不予发放"></el-radio>
    </el-radio-group>
    <template #footer>
      <el-button @click="auditPopupShow = false">取消</el-button>
      <el-button type="primary" :disabled="!operateData.reason" @click="operateConfirm()">确定</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { formatDate } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ResourceService, ContractsService, ActivitiesService } from "@/api/request";
import { Operation, Check } from "@element-plus/icons-vue";
import { reactive, toRefs } from "vue";
import { OperateChoicenessParams, Resource } from "@/typings/object";
import { ResourceListParams } from "@/typings/params";
import { ElMessage } from "element-plus/lib/components";

/** 活动奖励列表参数 */
export interface MyResourceListParams extends ResourceListParams {
  createDate?: string[];
  selectedTags?: string[];
  type?: string[];
}

export default {
  components: {
    Operation,
    Check,
  },

  setup() {
    const { query, switchPage } = useMyRouter();
    const assetsData = {
      rewardStatusMapping: [
        { value: 0, label: "未生效" },
        { value: 1, label: "进行中" },
        { value: 2, label: "已结束" },
        { value: 3, label: "已停用" },
      ],
      statusMapping: [
        { value: 0, label: "待审核" },
        { value: 1, label: "待领取" },
        { value: 2, label: "已发放" },
        { value: 3, label: "已拒绝" },
      ],
    };
    const data = reactive({
      loading: false,
      tableData: [] as Resource[],
      total: 0,
      searchData: { currentPage: 1, limit: 20 } as MyResourceListParams,
      selectedData: [] as Resource[],
      operateData: { type: 1, resourceIds: [] } as OperateChoicenessParams,
      auditPopupShow: false,
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        data.tableData = [];
        data.loading = true;
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit, type } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        if (type) {
          data.searchData.resourceType = type ? type[type.length - 1] : "";
        } else {
          delete data.searchData.resourceType;
        }
        const result = await ActivitiesService.getChoicenessList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data;

          if (dataList.length === 0) {
            data.loading = false;
            return;
          }

          const ids = dataList
            .map((item: Resource) => {
              return item.resourceId;
            })
            .join();
          const results = await Promise.all([
            ContractsService.getSubjectSignCount({
              subjectIds: ids,
              subjectType: 1,
            }),
            ResourceService.getResourcesCollectCount({ resourceIds: ids }),
          ]);
          dataList.forEach((resource: Resource) => {
            const { resourceId } = resource;
            resource.resourceNameAbbreviation = resource.resourceName.split("/")[1];
            resource.resourceVersions.reverse();
            resource.signCount = results[0].data.data.find(
              (item: { subjectId: string; count: number }) => item.subjectId === resourceId
            ).count;
            resource.collectCount = results[1].data.data.find(
              (item: { resourceId: string; count: number }) => item.resourceId === resourceId
            ).count;
          });
          const bannedIds = dataList
            .filter((item: Resource) => [2, 3].includes(item.status))
            .map((item: Resource) => {
              return item.resourceId;
            })
            .join(",");

          if (bannedIds) {
            const bannedResult = await ResourceService.getResourceRecordList({ resourceIds: bannedIds });
            bannedResult.data.data.forEach(
              (item: { resourceId: string; records: { reason: string; remark: string }[] }) => {
                const resource: Resource = dataList.find(
                  (resource: Resource) => resource.resourceId === item.resourceId
                );
                resource.reason = item.records[0].reason;
                resource.remark = item.records[0].remark;
              }
            );
          }

          data.tableData = dataList;
          data.total = totalItem;
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

      /** 选择表格项 */
      selectTable(selected: Resource[]) {
        data.selectedData = selected;
      },

      /** 审核 */
      audit(resourceId?: string) {
        data.operateData.resourceIds = resourceId ? [resourceId] : data.selectedData.map((item) => item.resourceId);
        data.auditPopupShow = true;
      },

      /** 操作审核 */
      async operateConfirm(method: "POST" | "PUT") {
        const result = await ActivitiesService.OperateChoiceness(data.operateData, method);
        const { errcode, msg } = result.data;
        if (errcode === 0) {
          ElMessage.success(`审核${method === "POST" ? "通过" : "拒绝"}`);
          this.getData();
        } else {
          ElMessage.error(msg);
        }
      },
    };

    data.searchData.resourceId = query.value.id;
    methods.getData(true);

    return {
      ...assetsData,
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
</style>
