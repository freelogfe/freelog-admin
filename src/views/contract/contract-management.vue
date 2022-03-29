<!-- 合约管理 -->
<template>
  <list-template>
    <template v-slot:filterBar>
      <form-item label="关键字搜索">
        <el-input v-model="searchData.keywords" placeholder="请输入合约ID" clearable @keyup.enter="getData(true)" />
      </form-item>
      <form-item label="类型">
        <el-select v-model="searchData.subjectType" placeholder="请选择类型" clearable>
          <el-option v-for="item in subjectTypeList" :key="item" :value="item" />
        </el-select>
      </form-item>
      <form-item label="状态">
        <el-select v-model="searchData.status" placeholder="请选择状态" clearable>
          <el-option v-for="item in subjectTypeList" :key="item" :value="item" />
        </el-select>
      </form-item>
      <form-item label="授权状态">
        <el-select v-model="searchData.authStatus" placeholder="请选择授权状态" clearable>
          <el-option v-for="item in subjectTypeList" :key="item" :value="item" />
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
      <form-item>
        <el-button type="primary" @click="getData(true)">搜索</el-button>
        <el-button @click="clearSearch()">重置</el-button>
      </form-item>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" stripe>
        <el-table-column label="标的物" width="250" show-overflow-tooltip>
          <template #default="scope">
            <el-button
              type="text"
              @click="
                switchPage('/user/user-management', {
                  keywords: scope.row.username,
                })
              "
              >{{ scope.row.subjectName }}
            </el-button>
          </template>
        </el-table-column>
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
        <el-table-column label="类型" width="120">
          <template #default="scope">
            {{ subjectTypeList.find((item) => item.value === scope.row.subjectType).label }}
          </template>
        </el-table-column>
        <el-table-column property="policyId" label="所签授权策略" />
        <el-table-column property="licensorName" label="供方" />
        <el-table-column property="licenseeName" label="需方" />
        <el-table-column property="contractId" label="合约ID" />
        <el-table-column label="签约时间" width="160">
          <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="scope">
            {{ statusMapping.find((item) => item.value === scope.row.status).label }}
          </template>
        </el-table-column>
        <el-table-column label="授权状态">
          <template #default="scope">
            {{ authStatusMapping.find((item) => item.value === scope.row.authStatus).label }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" width="40">
          <template #header>
            <el-icon class="operation-icon" title="操作">
              <operation />
            </el-icon>
          </template>
          <template #default="scope">
            <el-icon class="icon-btn" title="详情" @click="viewDetail(scope.row)">
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

  <el-dialog v-model="detailPopupShow" title="授权策略" width="80%"> </el-dialog>
</template>

<script lang="ts">
import { reactive, toRefs } from "vue-demi";
import { dateRange, formatDate } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ContractsService, NodeService, ResourceService } from "@/api/request";
import { dateRangeShortcuts } from "@/assets/data";
import { Operation, Document } from "@element-plus/icons-vue";
import { ListParams } from "@/api/interface";

/** 合约数据 */
interface Contract {
  contractId: string;
  contractName: string;
  subjectId: string;
  subjectName: string;
  subjectType: number;
  licensorId: string;
  licensorName: string;
  licensorOwnerId: number;
  licensorOwnerName: string;
  licenseeId: string;
  licenseeName: string;
  licenseeOwnerId: number;
  licenseeOwnerName: string;
  licenseeIdentityType: number;
  policyId: string;
  isDefault: number;
  fsmCurrentState: string;
  fsmRunningStatus: number;
  authStatus: 1 | 2 | 128;
  status: 0 | 1 | 2;
  createDate: string;
  coverImages: string[];
}

export default {
  components: {
    Operation,
    Document,
  },

  setup() {
    const { query, switchPage } = useMyRouter();
    const assetsData = {
      subjectTypeList: [
        { value: 1, label: "资源" },
        { value: 2, label: "展品" },
        { value: 3, label: "用户组" },
      ],
      statusMapping: [
        { value: 0, label: "生效中" },
        { value: 1, label: "已终止" },
        { value: 2, label: "异常" },
      ],
      authStatusMapping: [
        { value: 1, label: "正式授权" },
        { value: 2, label: "测试授权" },
        { value: 128, label: "未授权" },
      ],
    };
    const data = reactive({
      tableData: [] as Contract[],
      total: 0,
      searchData: {
        currentPage: 1,
        limit: 20,
      } as ListParams,
      policyData: [] as any[],
      detailPopupShow: false,
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit, signDate } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        [data.searchData.startDate, data.searchData.endDate] = dateRange(signDate);
        const result = await ContractsService.getContractList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data;

          if (dataList.length === 0) {
            data.tableData = [];
            return;
          }

          const resourceIds = dataList
            .filter((item: Contract) => item.subjectType === 1)
            .map((item: Contract) => {
              return item.subjectId;
            })
            .join(",");
          const exhibitIds = dataList
            .filter((item: Contract) => item.subjectType === 2)
            .map((item: Contract) => {
              return item.subjectId;
            })
            .join(",");
          const results = await Promise.all([
            ResourceService.searchResource(resourceIds),
            NodeService.searchExhibit(exhibitIds),
          ]);
          dataList.forEach((contract: Contract) => {
            const { subjectType } = contract;
            if (subjectType === 1) {
              // 资源
              const coverItem = results[0].data.data.find(
                (item: { resourceId: string; coverImages: string[] }) => item.resourceId === contract.subjectId
              );
              contract.coverImages = coverItem ? coverItem.coverImages : [];
            } else if (subjectType === 2) {
              // 展品
              const coverItem = results[1].data.data.find(
                (item: { presentableId: string; coverImages: string[] }) => item.presentableId === contract.subjectId
              );
              contract.coverImages = coverItem ? coverItem.coverImages : [];
            }
          });

          data.tableData = dataList;
          data.total = totalItem;
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
      viewDetail(contract: Contract) {
        data.detailPopupShow = true;
        console.error(contract);
      },
    };

    data.searchData.keywords = query.value.keywords;
    if (query.value.tag) data.searchData.selectedTags = [query.value.tag];
    methods.getData(true);

    return {
      dateRangeShortcuts,
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
.cover-image {
  width: 100px;
  border: 1px solid #eee;
  border-radius: 4px;
}
</style>
