<!-- 合约管理 -->
<template>
  <list-template>
    <template v-slot:filterBar>
      <div class="filter-controls">
        <form-item label="关键字搜索">
          <el-input
            style="width: 350px"
            v-model="searchData.keywords"
            :placeholder="
              searchData.keywordsType
                ? '请输入' + keywordsTypeList.find((item) => item.value === searchData.keywordsType)!.label
                : '请先选择关键字类型'
            "
            clearable
            @keyup.enter="getData(true)"
          >
            <template #prepend>
              <el-select v-model="searchData.keywordsType" placeholder="请选择类型" style="width: 120px">
                <el-option v-for="item in keywordsTypeList" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </template>
          </el-input>
        </form-item>
        <form-item label="类型">
          <el-select v-model="searchData.subjectType" placeholder="请选择类型" clearable>
            <el-option v-for="item in subjectTypeList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </form-item>
        <form-item label="状态">
          <el-select v-model="searchData.compositeState" placeholder="请选择状态" clearable>
            <el-option
              v-for="item in statusMapping.filter((item) => item.value !== 7)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </form-item>
        <form-item label="签约时间">
          <el-date-picker
            v-model="searchData.signDate"
            type="daterange"
            unlink-panels
            range-separator="-"
            format="YYYY/MM/DD"
            start-placeholder="起始日期"
            end-placeholder="截止日期"
            :shortcuts="dateRangeShortcuts"
          />
        </form-item>
      </div>
      <div class="filter-btns">
        <el-button type="primary" @click="getData(true)">搜索</el-button>
        <el-button @click="clearSearch()">重置</el-button>
      </div>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column label="标的物" min-width="250">
          <template #default="scope">
            <subject-name :type="scope.row.subjectType" :name="scope.row.subjectName" :id="scope.row.subjectId" />
          </template>
        </el-table-column>
        <el-table-column label="封面" min-width="120">
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
        <el-table-column label="类型">
          <template #default="scope">
            {{ subjectTypeList.find((item) => item.value === scope.row.subjectType)!.label }}
          </template>
        </el-table-column>
        <el-table-column property="contractName" label="所签授权策略" min-width="150" show-overflow-tooltip />
        <el-table-column label="供方" min-width="250">
          <template #default="scope">
            <subject-name
              :type="scope.row.subjectType"
              :name="scope.row.licensorName"
              :id="scope.row.licensorId"
              v-if="scope.row.subjectType === 1"
            />
            <span
              class="text-btn"
              @click="switchPage('/node/node-management', { nodeId: scope.row.licensorId })"
              v-else-if="scope.row.subjectType === 2"
            >
              {{ scope.row.licensorName }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="需方" min-width="250">
          <template #default="scope">
            <subject-name
              :type="scope.row.subjectType"
              :name="scope.row.licenseeName"
              :id="scope.row.licenseeId"
              v-if="scope.row.licenseeIdentityType === 1"
            />
            <span
              class="text-btn"
              @click="switchPage('/node/node-management', { nodeId: scope.row.licenseeId })"
              v-else-if="scope.row.licenseeIdentityType === 2"
            >
              {{ scope.row.licenseeName }}
            </span>
            <span
              class="text-btn"
              @click="switchPage('/user/user-management', { userId: scope.row.licenseeId })"
              v-else-if="scope.row.licenseeIdentityType === 3"
            >
              {{ scope.row.licenseeName }}
            </span>
          </template>
        </el-table-column>
        <el-table-column property="contractId" label="合约ID" min-width="210" />
        <el-table-column label="签约时间" min-width="160">
          <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="scope">
            {{ statusMapping.find((item) => item.value === scope.row.myStatus)!.label }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" width="40">
          <template #default="scope">
            <i class="icon-btn admin icon-detail" title="详情" @click="viewDetail(scope.row)" />
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

  <el-dialog v-model="detailPopupShow" title="合约详情" destroy-on-close>
    <div class="basic-info">
      <form-item label="标的物">{{ detailData.subjectName }}</form-item>
      <form-item label="授权策略">{{ detailData.contractName }}</form-item>
      <form-item label="供方">{{ detailData.licensorName }}</form-item>
      <form-item label="签约时间">{{ formatDate(detailData.createDate) }}</form-item>
      <form-item label="需方">{{ detailData.licenseeName }}</form-item>
      <form-item label="合约ID">{{ detailData.contractId }}</form-item>
    </div>
    <el-tabs v-model="detailTabActive" type="border-card">
      <el-tab-pane name="tab1" label="合约流转记录">
        <div class="tab-pane-item">
          <div class="record-item" v-for="(item, index) in detailData.transitionRecords" :key="item.time">
            <div class="item-header">
              <div
                class="status"
                :class="{
                  terminal: detailData.myStatus === 6,
                  active: [1, 2, 3].includes(item.serviceStates),
                  inactive: item.serviceStates === 128,
                }"
              >
                {{ index === 0 && detailData.myStatus === 6 ? "已终止" : authStatusMapping[item.serviceStates as 1|2|3|128] }}
              </div>
              <div class="time">{{ item.time }}</div>
            </div>
            <div class="state-info">{{ item.stateInfoStr }}</div>
            <template v-if="index === 0 && detailData.myStatus !== 6">
              <div class="event" v-for="event in item.eventSectionStrs" :key="event">
                {{ event }}
              </div>
            </template>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane name="tab2" label="策略内容">
        <div class="tab-pane-item policy-content" v-html="detailData.policyInfo.translateInfo.content"></div>
      </el-tab-pane>
      <el-tab-pane name="tab3" label="策略代码">
        <div class="tab-pane-item policy-content" v-html="detailData.policyInfo.policyText"></div>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script lang="ts">
import { dateRange, formatDate } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ContractsService, NodeService, ResourceService } from "@/api/request";
import { dateRangeShortcuts } from "@/assets/data";
import { computed, defineAsyncComponent, reactive, toRefs } from "vue";
import { Contract } from "@/typings/object";
import { HttpResponse, ContractListParams } from "@/typings/params";

/** 合约列表参数 */
interface MyContractListParams extends ContractListParams {
  signDate?: string[];
}

export default {
  components: {
    "subject-name": defineAsyncComponent(() => import("@/components/subject-name.vue")),
  },

  setup() {
    const { query, switchPage } = useMyRouter();
    const assetsData = {
      keywordsTypeList: [
        { value: 1, label: "合约ID" },
        { value: 2, label: "标的物" },
        { value: 3, label: "供方" },
        { value: 4, label: "需方" },
      ],
      subjectTypeList: [
        { value: 1, label: "资源" },
        { value: 2, label: "展品" },
        { value: 3, label: "用户组" },
      ],
      statusMapping: [
        { value: 1, label: "正式授权" },
        { value: 2, label: "测试授权" },
        { value: 3, label: "用户组标签" },
        { value: 4, label: "未授权" },
        { value: 5, label: "异常" },
        { value: 6, label: "终止" },
        { value: 7, label: "正式&测试授权" },
      ],
      authStatusMapping: {
        1: "已授权",
        2: "测试授权",
        3: "已授权",
        128: "未授权",
      },
    };
    const data = reactive({
      loading: false,
      tableData: [] as Contract[],
      total: 0,
      searchData: { currentPage: 1, limit: 20 } as MyContractListParams,
      detailId: "",
      detailPopupShow: false,
      detailTabActive: "tab1",
    });
    const detailData: any = computed(() => {
      const { tableData, detailId } = data;
      return tableData.find((item) => item.contractId === detailId) || {};
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        data.tableData = [];
        data.loading = true;
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit, signDate } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        [data.searchData.startDate, data.searchData.endDate] = dateRange(signDate);
        const result = await ContractsService.getContractList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data;

          if (dataList.length === 0) {
            data.total = 0;
            data.loading = false;
            return;
          }

          let resourceResult: HttpResponse;
          let exhibitResult: HttpResponse;
          const resourceIds = dataList
            .filter((item: Contract) => item.subjectType === 1)
            .map((item: Contract) => {
              return item.subjectId;
            })
            .join(",");
          if (resourceIds) {
            resourceResult = await ResourceService.searchResource(resourceIds);
          }

          const exhibitIds = dataList
            .filter((item: Contract) => item.subjectType === 2)
            .map((item: Contract) => {
              return item.subjectId;
            })
            .join(",");
          if (exhibitIds) {
            exhibitResult = await NodeService.searchExhibit(exhibitIds);
          }

          dataList.forEach((contract: Contract) => {
            const { subjectType, fsmRunningStatus, authStatus, status } = contract;
            if (resourceResult && subjectType === 1) {
              // 资源
              const coverItem = resourceResult.data.data.find(
                (item: { resourceId: string; coverImages: string[] }) => item.resourceId === contract.subjectId
              );
              contract.coverImages = coverItem ? coverItem.coverImages : [];
            } else if (exhibitResult && subjectType === 2) {
              // 展品
              const coverItem = exhibitResult.data.data.find(
                (item: { presentableId: string; coverImages: string[] }) => item.presentableId === contract.subjectId
              );
              contract.coverImages = coverItem ? coverItem.coverImages : [];
            }

            if (status === 1) {
              contract.myStatus = 6;
            } else if (authStatus === 1) {
              contract.myStatus = 1;
            } else if (authStatus === 2) {
              contract.myStatus = 2;
            } else if (authStatus === 3) {
              contract.myStatus = 7;
            } else if (authStatus === 4) {
              contract.myStatus = 3;
            } else if (authStatus === 128) {
              contract.myStatus = 4;
            } else if (fsmRunningStatus === 16 || status === 2) {
              contract.myStatus = 5;
            }
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
        data.detailId = "";
        this.getData(true);
      },

      /** 切换表格页码 */
      changePage(value: number) {
        data.searchData.currentPage = value;
        this.getData();
      },

      /** 查看详情 */
      async viewDetail(contract: Contract) {
        data.detailId = contract.contractId;
        data.detailTabActive = "tab1";
        data.detailPopupShow = true;
        const result = await ContractsService.getContractTransitionRecords(data.detailId);
        if (result.data.errcode === 0) {
          contract.transitionRecords = result.data.data.dataList;
        }
      },
    };

    if (query.value.keywordsType) data.searchData.keywordsType = Number(query.value.keywordsType) as 1 | 2 | 3 | 4;
    data.searchData.keywords = query.value.keywords;
    data.searchData.licensorId = query.value.licensorId;
    data.searchData.licenseeId = query.value.licenseeId;
    data.searchData.subjectIds = query.value.subjectIds;
    methods.getData(true);

    return {
      dateRangeShortcuts,
      ...assetsData,
      ...toRefs(data),
      detailData,
      ...methods,
      formatDate,
      switchPage,
    };
  },
};
</script>

<style lang="scss" scoped>
.basic-info {
  display: flex;
  flex-wrap: wrap;

  .form-item-wrapper {
    width: calc((100% - 20px) / 2);
    margin-right: 0;

    &:nth-child(2n) {
      margin-left: 20px;
    }
  }
}

.tab-pane-item {
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;

  .record-item {
    width: 100%;
    color: #222;
    font-size: 14px;

    & + .record-item {
      margin-top: 20px;
      opacity: 0.3;
    }

    .item-header {
      display: flex;
      align-items: center;

      .status {
        height: 20px;
        font-size: 12px;
        color: #fff;
        padding: 0 10px;
        border-radius: 10px;
        display: flex;
        align-items: center;

        &.active {
          background-color: #44c28c;
        }

        &.inactive {
          background-color: #e9a923;
        }

        &.terminal {
          background-color: #999;
        }
      }

      .time {
        margin-left: 10px;
      }
    }

    .state-info {
      line-height: 20px;
      font-weight: bold;
      margin-top: 10px;
    }

    .event {
      width: 100%;
      font-weight: bold;
      border-radius: 4px;
      padding: 10px;
      box-sizing: border-box;
      border: 1px solid rgba(0, 0, 0, 0.15);
      margin-top: 10px;
    }
  }
}
</style>
