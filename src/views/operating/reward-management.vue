<!-- 活动奖励管理 -->
<template>
  <list-template>
    <template v-slot:filterBar>
      <div class="filter-controls">
        <form-item label="奖励名称">
          <el-input
            v-model="searchData.authorName"
            placeholder="请输入奖励名称"
            clearable
            @keyup.enter="getData(true)"
          />
        </form-item>
        <form-item label="奖励状态">
          <el-select v-model="searchData.status" placeholder="请选择奖励状态" clearable>
            <el-option v-for="item in statusMapping" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </form-item>
        <form-item label="奖励类型">
          <el-select v-model="searchData.status" placeholder="请选择奖励类型" clearable>
            <el-option v-for="item in typeMapping" :key="item.value" :label="item.label" :value="item.value" />
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
        <el-table-column property="username" label="奖励名称" min-width="250" />
        <el-table-column label="奖励类型" min-width="120">
          <template #default="scope">{{ scope.row.resourceType.join("/") }}</template>
        </el-table-column>
        <el-table-column property="createDate" label="有效期" min-width="160">
          <template #default="scope">{{
            `${formatDate(scope.row.createDate)} 至 ${formatDate(scope.row.createDate)}`
          }}</template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="scope"
            >{{ statusMapping.find((item: any) => item.value === scope.row.status).label }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" width="70">
          <template #header>
            <el-icon class="operation-icon" title="操作">
              <operation />
            </el-icon>
          </template>
          <template #default="scope">
            <el-icon
              class="icon-btn"
              title="查看发放记录"
              @click="switchPage('/operating/issue-record', { id: scope.row.resourceId })"
            >
              <document />
            </el-icon>
            <el-icon
              class="icon-btn"
              title="恢复"
              @click="operateReward(scope.row.resourceId)"
              v-if="scope.row.status === 3"
            >
              <check />
            </el-icon>
            <el-icon
              class="icon-btn"
              title="暂停"
              @click="operateReward(scope.row.resourceId)"
              v-if="![0, 1].includes(scope.row.status)"
            >
              <close />
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
</template>

<script lang="ts">
import { formatDate } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ResourceService, ContractsService, ActivitiesService } from "@/api/request";
import { Operation, Close, Document, Check } from "@element-plus/icons-vue";
import { reactive, toRefs } from "vue";
import { OperateChoicenessParams, Resource } from "@/typings/object";
import { ResourceListParams } from "@/typings/params";
import { ElMessageBox } from "element-plus";
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
    Close,
    Document,
  },

  setup() {
    const { query, switchPage } = useMyRouter();
    const assetsData = {
      statusMapping: [
        { value: 0, label: "未生效" },
        { value: 1, label: "进行中" },
        { value: 2, label: "已结束" },
        { value: 3, label: "已停用" },
      ],
      typeMapping: [
        { value: 1, label: "现金" },
        { value: 2, label: "羽币" },
      ],
    };
    const data = reactive({
      loading: false,
      tableData: [] as Resource[],
      total: 0,
      searchData: { currentPage: 1, limit: 20 } as MyResourceListParams,
      operateData: { type: 1, resourceIds: [] } as OperateChoicenessParams,
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

      /** 恢复/暂停活动奖励 */
      operateReward(resourceId: string) {
        const method = "POST";
        const operate = method === "POST" ? "恢复" : "暂停";
        ElMessageBox.confirm(`确定要${operate}此奖励的发放吗？`, operate, {
          confirmButtonText: operate,
          cancelButtonText: "取消",
        }).then(() => {
          data.operateData.resourceIds = [resourceId];
          this.operateConfirm(method);
        });
      },

      /** 操作活动奖励 */
      async operateConfirm(method: "POST" | "PUT") {
        const result = await ActivitiesService.OperateChoiceness(data.operateData, method);
        const { errcode, msg } = result.data;
        if (errcode === 0) {
          ElMessage.success(`${method === "POST" ? "恢复" : "暂停"}成功`);
          this.getData();
        } else {
          ElMessage.error(msg);
        }
      },
    };

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
