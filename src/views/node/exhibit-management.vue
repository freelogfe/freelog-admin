<!-- 展品管理 -->
<template>
  <list-template>
    <template v-slot:filterBar>
      <form-item label="关键字搜索">
        <el-input
          style="width: 250px"
          v-model="searchData.keywords"
          placeholder="请输入展品名、节点名、资源名"
          clearable
          @keyup.enter="getData(true)"
        />
      </form-item>
      <form-item label="资源类型">
        <el-select v-model="searchData.resourceType" placeholder="请选择资源类型" clearable>
          <el-option v-for="item in resourceTypeList" :key="item" :value="item" />
        </el-select>
      </form-item>
      <form-item label="创建时间">
        <el-date-picker
          v-model="searchData.createDate"
          type="daterange"
          unlink-panels
          range-separator="-"
          format="YYYY/MM/DD"
          start-placeholder="起始日期"
          end-placeholder="截止日期"
          :shortcuts="dateRangeShortcuts"
        />
      </form-item>
      <form-item label="排序">
        <el-select v-model="searchData.sort" placeholder="请选择排序方式" clearable>
          <el-option v-for="item in sortTypeList" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </form-item>
      <form-item>
        <el-button type="primary" @click="getData(true)">搜索</el-button>
        <el-button @click="clearSearch()">重置</el-button>
      </form-item>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column property="presentableName" label="展品" width="250" />
        <el-table-column label="封面" width="120">
          <template #default="scope">
            <el-image
              class="cover-image"
              :src="scope.row.coverImages[0]"
              :preview-src-list="scope.row.coverImages"
              preview-teleported
              hide-on-click-modal
            />
          </template>
        </el-table-column>
        <el-table-column label="所属节点" width="150" show-overflow-tooltip>
          <template #default="scope">
            <span
              class="text-btn"
              @click="
                switchPage('/node/node-management', {
                  keywords: scope.row.nodeName,
                })
              "
            >
              {{ scope.row.nodeName }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="关联资源" width="250" show-overflow-tooltip>
          <template #default="scope">
            <subject-name :type="1" :name="scope.row.resourceInfo.resourceName" />
          </template>
        </el-table-column>
        <el-table-column label="资源类型" width="100" show-overflow-tooltip>
          <template #default="scope">{{ scope.row.resourceInfo.resourceType }}</template>
        </el-table-column>
        <el-table-column label="需方合约数" width="120" align="right">
          <template #default="scope">
            <span
              class="text-btn"
              @click="
                switchPage('/contract/contract-management', {
                  keywordsType: 3,
                  keywords: scope.row.presentableName,
                })
              "
            >
              {{ scope.row.signCount }}
            </span>
          </template>
        </el-table-column>
        <!-- <el-table-column property="collectCount" label="策略授权次数" align="right" width="120" /> -->
        <el-table-column property="createDate" label="创建时间" width="160">
          <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="scope">{{
            statusMapping.find((item) => item.value === scope.row.status).label
          }}</template>
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
              title="查看授权策略"
              @click="viewPolicy(scope.row)"
              v-if="scope.row.policies.length"
            >
              <document />
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

  <el-dialog v-model="policyPopupShow" title="授权策略" width="80%">
    <div class="policy-box">
      <div class="policy-item" v-for="item in policyData" :key="item.policyId">
        <div class="policy-top">
          <div class="policy-name" :title="item.policyName">
            {{ item.policyName }}
          </div>
          <div class="policy-status" :class="{ active: item.status === 1 }">
            <span v-if="item.status === 1">已启用</span>
            <span v-if="item.status === 0">未启用</span>
          </div>
        </div>
        <div class="policy-code" v-html="item.policyText"></div>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineAsyncComponent, reactive, toRefs } from "vue";
import { dateRange, formatDate, relativeTime } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ContractsService, NodeService } from "@/api/request";
import { dateRangeShortcuts } from "@/assets/data";
import { Operation, Document } from "@element-plus/icons-vue";
import { Exhibit, Policy } from "@/typings/object";
import { ExhibitListParams } from "@/typings/params";

interface MyExhibitListParams extends ExhibitListParams {
  createDate?: string[];
}

export default {
  components: {
    "subject-name": defineAsyncComponent(() => import("@/components/subject-name.vue")),
    Operation,
    Document,
  },

  setup() {
    const { query, switchPage } = useMyRouter();
    const assetsData = {
      resourceTypeList: ["image", "audio", "video", "markdown", "widget", "theme"],
      statusMapping: [
        { value: 0, label: "下线" },
        { value: 1, label: "上线" },
      ],
      sortTypeList: [
        { value: "createDate:1", label: "创建时间升序" },
        { value: "createDate:-1", label: "创建时间降序" },
        { value: "updateDate:1", label: "更新时间升序" },
        { value: "updateDate:-1", label: "更新时间降序" },
      ],
    };
    const data = reactive({
      loading: false,
      tableData: [] as Exhibit[],
      total: 0,
      searchData: { currentPage: 1, limit: 20 } as MyExhibitListParams,
      policyData: [] as Policy[],
      policyPopupShow: false,
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        data.tableData = [];
        data.loading = true;
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit, sort, createDate } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        if (!sort) delete data.searchData.sort;
        [data.searchData.startCreatedDate, data.searchData.endCreatedDate] = dateRange(createDate);
        const result = await NodeService.getExhibitList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data;

          if (dataList.length === 0) {
            data.loading = false;
            return;
          }

          const ids = dataList
            .map((item: Exhibit) => {
              return item.presentableId;
            })
            .join(",");
          const results = await Promise.all([
            ContractsService.getSubjectSignCount({
              subjectIds: ids,
              subjectType: 2,
            }),
            // ResourceService.getResourcesCollectCount({ resourceIds: ids }),
          ]);
          dataList.forEach((exhibit: Exhibit) => {
            const { presentableId } = exhibit;
            exhibit.resourceUserName = exhibit.resourceInfo.resourceName.split("/")[0];
            exhibit.resourceName = exhibit.resourceInfo.resourceName.split("/")[1];
            exhibit.signCount = results[0].data.data.find(
              (item: { subjectId: string; count: number }) => item.subjectId === presentableId
            ).count;
            // exhibit.collectCount = results[1].data.data.find(
            //   (item: { resourceId: string; count: number }) => item.resourceId === resourceId
            // ).count;
          });

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

      /** 查看授权策略 */
      viewPolicy(exhibit: Exhibit) {
        data.policyPopupShow = true;
        data.policyData = exhibit.policies;
      },
    };

    data.searchData.keywords = query.value.keywords;
    methods.getData(true);

    return {
      dateRangeShortcuts,
      ...assetsData,
      ...toRefs(data),
      ...methods,
      formatDate,
      switchPage,
      relativeTime,
    };
  },
};
</script>

<style lang="scss" scoped>
.policy-box {
  width: 100%;
  max-height: 600px;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;

  .policy-item {
    border: 1px solid #ddd;
    border-radius: 6px;
    width: 32%;
    margin-right: 2%;
    padding: 15px;
    box-sizing: border-box;
    transition: all 0.2s linear;

    &:hover {
      box-shadow: 0 0 10px #999;
    }

    &:nth-child(3n) {
      margin-right: 0;
    }

    &:nth-child(n + 4) {
      margin-top: 15px;
    }

    .policy-top {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .policy-name {
        flex: 1;
        width: 0;
        font-size: 16px;
        font-weight: bold;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .policy-status {
        color: #666;
        margin-left: 20px;

        &.active {
          color: #67c23a;
        }
      }
    }

    .policy-code {
      margin-top: 15px;
      white-space: pre-wrap;
    }
  }
}
</style>
