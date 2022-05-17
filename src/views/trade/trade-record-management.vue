<!-- 交易记录管理 -->
<template>
  <list-template>
    <template v-slot:filterBar>
      <div class="filter-controls">
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
          <el-input-number
            style="width: 100px"
            v-model="searchData.amountStartPoint"
            placeholder="最小金额"
            :min="0"
            :max="searchData.amountEndPoint"
            :controls="false"
            @keyup.enter="getData(true)"
          />
          -
          <el-input-number
            style="width: 100px"
            v-model="searchData.amountEndPoint"
            placeholder="最大金额"
            :min="searchData.amountStartPoint"
            :controls="false"
            @keyup.enter="getData(true)"
          />
        </form-item>
        <form-item label="交易类型">
          <el-select v-model="searchData.transactionType" placeholder="请选择交易类型" clearable>
            <el-option v-for="item in transactionTypeList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </form-item>
        <form-item label="收款方">
          <el-input
            v-model="searchData.reciprocalAccountName"
            placeholder="请输入收款方"
            clearable
            @keyup.enter="getData(true)"
          />
        </form-item>
        <form-item label="付款方">
          <el-input
            v-model="searchData.accountName"
            placeholder="请输入付款方"
            clearable
            @keyup.enter="getData(true)"
          />
        </form-item>
        <form-item label="交易状态">
          <el-select v-model="searchData.status" placeholder="请选择交易状态" clearable>
            <el-option v-for="item in statusList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </form-item>
        <form-item label="交易编号">
          <el-input v-model="searchData.recordId" placeholder="请输入交易编号" clearable @keyup.enter="getData(true)" />
        </form-item>
        <form-item label="标的物">
          <el-input v-model="searchData.keywords" placeholder="请输入标的物" clearable @keyup.enter="getData(true)" />
        </form-item>
      </div>
      <div class="filter-btns">
        <el-button type="primary" @click="getData(true)">搜索</el-button>
        <el-button @click="clearSearch()">重置</el-button>
      </div>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column property="createDate" label="创建时间" width="160">
          <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
        </el-table-column>
        <el-table-column property="digest" label="交易说明" width="300" />
        <el-table-column label="合约编号" width="300">
          <template #default="scope">
            <span
              class="text-btn"
              v-if="scope.row.transactionType === 2"
              @click="
                switchPage('/contract/contract-management', {
                  keywordsType: 1,
                  keywords: scope.row.attachInfo.contractId,
                })
              "
            >
              {{ scope.row.attachInfo.contractId }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column property="recordId" label="交易编号" width="160" />
        <el-table-column property="reciprocalAccountName" label="收款方" width="200" />
        <el-table-column property="accountName" label="付款方" width="200" />
        <el-table-column label="交易金额（枚）" width="140" align="right">
          <template #default="scope">{{ abs(scope.row.transactionAmount) }}</template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="scope">{{ statusList.find((item) => item.value === scope.row.status).label }}</template>
        </el-table-column>
        <el-table-column fixed="right" width="40">
          <template #header>
            <el-icon class="operation-icon" title="操作">
              <operation />
            </el-icon>
          </template>
          <template #default="scope">
            <el-icon class="icon-btn" title="查看交易明细" @click="viewTradeDetail(scope.row)">
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

  <el-dialog v-model="tradeDetailPopupShow" title="交易明细" width="1120px">
    <el-table max-height="600" :data="tradeDetailData.tradeDetail" stripe border>
      <el-table-column property="createDate" label="创建时间" width="160">
        <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
      </el-table-column>
      <el-table-column property="createDate" label="更新时间" width="160">
        <template #default="scope">{{ formatDate(scope.row.updateDate) }}</template>
      </el-table-column>
      <el-table-column property="serialNo" label="交易流水号" width="180" />
      <el-table-column label="交易方类型" width="100">
        <template #default="scope">{{ scope.row.transactionAmount > 0 ? "收款方" : "付款方" }}</template>
      </el-table-column>
      <el-table-column property="accountName" label="交易主体信息" width="120" />
      <el-table-column label="交易金额（枚）" width="130" align="right">
        <template #default="scope">{{ abs(scope.row.transactionAmount) }}</template>
      </el-table-column>
      <el-table-column label="交易后账户余额" width="130" align="right">
        <template #default="scope">{{ scope.row.afterBalance }}</template>
      </el-table-column>
      <el-table-column label="交易状态" width="100">
        <template #default="scope">{{ statusList.find((item) => item.value === scope.row.status).label }}</template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script lang="ts">
import { computed, reactive, toRefs } from "vue";
import { dateRange, formatDate } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { TransactionsService } from "@/api/request";
import { dateRangeShortcuts } from "@/assets/data";
import { Operation, Document } from "@element-plus/icons-vue";
import { TradeRecord } from "@/typings/object";
import { TradeListParams } from "@/typings/params";

/** 交易列表参数 */
interface MyTradeListParams extends TradeListParams {
  createDate?: string[];
}

export default {
  components: {
    Operation,
    Document,
  },

  setup() {
    const { query, switchPage } = useMyRouter();
    const assetsData = {
      transactionTypeList: [
        { value: 1, label: "转账" },
        { value: 2, label: "合约交易" },
      ],
      statusList: [
        { value: 1, label: "交易确认中" },
        { value: 2, label: "交易成功" },
        { value: 3, label: "交易关闭" },
      ],
    };
    const data = reactive({
      loading: false,
      tableData: [] as TradeRecord[],
      total: 0,
      searchData: { currentPage: 1, limit: 20 } as MyTradeListParams,
      tradeDetailId: "",
      tradeDetailPopupShow: false,
    });
    const tradeDetailData = computed(() => {
      const { tradeDetailId, tableData } = data;
      return tableData.find((item) => item.recordId === tradeDetailId) || {};
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        data.tableData = [];
        data.loading = true;
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit, createDate } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        [data.searchData.startCreateDate, data.searchData.endCreateDate] = dateRange(createDate);
        const result = await TransactionsService.getTradeRecordList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data;

          if (dataList.length === 0) {
            data.loading = false;
            return;
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

      /** 绝对数 */
      abs(amount: string) {
        return Math.abs(Number(amount));
      },

      /** 查看交易明细 */
      async viewTradeDetail(tradeRecord: TradeRecord) {
        const { recordId } = tradeRecord;
        data.tradeDetailId = recordId;
        data.tradeDetailPopupShow = true;
        const result = await TransactionsService.searchTradeList(recordId);
        if (result.data.errcode === 0) {
          tradeRecord.tradeDetail = result.data.data;
        }
      },
    };

    data.searchData.keywords = query.value.keywords;
    if (query.value.relatedAccountName) {
      data.searchData.relatedAccountName = query.value.relatedAccountName;
    }
    methods.getData(true);

    return {
      dateRangeShortcuts,
      switchPage,
      ...assetsData,
      ...toRefs(data),
      tradeDetailData,
      ...methods,
      formatDate,
    };
  },
};
</script>
