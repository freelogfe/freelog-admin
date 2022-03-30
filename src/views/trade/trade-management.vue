<!-- 交易管理 -->
<template>
  <list-template>
    <template v-slot:filterBar>
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
      <form-item label="金额">
        <el-input style="width: 80px" v-model="searchData.keywords" clearable @keyup.enter="getData(true)" />
        -
        <el-input style="width: 80px" v-model="searchData.keywords" clearable @keyup.enter="getData(true)" />
      </form-item>
      <form-item label="交易类型">
        <el-select v-model="searchData.resourceType" placeholder="请选择交易类型" clearable>
          <el-option v-for="item in resourceTypeList" :key="item" :value="item" />
        </el-select>
      </form-item>
      <form-item label="收款方">
        <el-input v-model="searchData.keywords" placeholder="请输入收款方" clearable @keyup.enter="getData(true)" />
      </form-item>
      <form-item label="付款方">
        <el-input v-model="searchData.keywords" placeholder="请输入付款方" clearable @keyup.enter="getData(true)" />
      </form-item>
      <form-item label="交易状态">
        <el-select v-model="searchData.resourceType" placeholder="请选择交易状态" clearable>
          <el-option v-for="item in resourceTypeList" :key="item" :value="item" />
        </el-select>
      </form-item>
      <form-item label="交易编号">
        <el-input v-model="searchData.keywords" placeholder="请输入交易编号" clearable @keyup.enter="getData(true)" />
      </form-item>
      <form-item label="标的物">
        <el-input v-model="searchData.keywords" placeholder="请输入标的物" clearable @keyup.enter="getData(true)" />
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
      <el-table :data="tableData" stripe>
        <el-table-column property="createDate" label="创建时间" width="160">
          <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
        </el-table-column>
        <el-table-column property="createDate" label="交易说明" width="160">
          <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
        </el-table-column>
        <el-table-column property="createDate" label="交易编号" width="160" />
        <el-table-column property="createDate" label="收款方" width="160">
          <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
        </el-table-column>
        <el-table-column property="createDate" label="付款方" width="160">
          <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
        </el-table-column>
        <el-table-column property="createDate" label="交易金额（枚）" width="160">
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
            <el-icon class="icon-btn" title="详情" @click="viewPolicy(scope.row)">
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
</template>

<script lang="ts">
import { reactive, toRefs } from "vue";
import { dateRange, formatDate } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { TransactionsService } from "@/api/request";
import { dateRangeShortcuts } from "@/assets/data";
import { Operation, Document } from "@element-plus/icons-vue";
import { ListParams } from "@/api/interface";

/** 交易数据 */
interface Trade {
  presentableId: string;
  presentableName: string;
  presentableTitle: string;
  tags: string[];
  intro: string;
  onlineStatus: 0 | 1;
  userId: number;
  nodeId: number;
  resolveResources: any[];
  policies: any[];
  resourceInfo: any;
  version: string;
  createDate: string;
  resourceUserName: string;
  resourceName: string;
  signCount: number;
}

export default {
  components: {
    Operation,
    Document,
  },

  setup() {
    const { query } = useMyRouter();
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
      tableData: [] as Trade[],
      total: 0,
      searchData: {
        currentPage: 1,
        limit: 20,
      } as ListParams,
      policyData: [] as any[],
      policyPopupShow: false,
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit, createDate } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        [data.searchData.startCreateDate, data.searchData.endCreateDate] = dateRange(createDate);
        const result = await TransactionsService.getContractList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data;

          if (dataList.length === 0) {
            data.tableData = [];
            return;
          }

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
    };

    data.searchData.keywords = query.value.keywords;
    methods.getData(true);

    return {
      dateRangeShortcuts,
      ...assetsData,
      ...toRefs(data),
      ...methods,
      formatDate,
    };
  },
};
</script>
