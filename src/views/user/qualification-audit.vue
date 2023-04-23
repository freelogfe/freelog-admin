<!-- 内测资格审核 -->
<template>
  <list-template>
    <template v-slot:barLeft v-if="selectedData.length">
      <el-button type="primary" @click="audit()">审核</el-button>
      <span class="selected-tip">已选中{{ selectedData.length }}条</span>
    </template>

    <template v-slot:barRight> </template>

    <template v-slot:filterBar>
      <div class="filter-controls">
        <form-item label="关键字搜索">
          <el-input
            style="width: 250px"
            v-model="searchData.keywords"
            placeholder="请输入用户名、手机号、邮箱"
            clearable
            @keyup.enter="getData(true)"
          />
        </form-item>
        <form-item label="状态">
          <el-select v-model="searchData.status" clearable placeholder="请选择状态">
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
        <el-table-column type="selection" :selectable="(row: any) => row.status === 0" />
        <el-table-column label="申请日期" min-width="160">
          <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
        </el-table-column>
        <el-table-column property="occupation" label="职业" min-width="150" />
        <el-table-column property="areaName" label="区域" min-width="150" />
        <el-table-column property="description" label="其他" min-width="200" />
        <el-table-column property="username" label="用户名" min-width="150" />
        <el-table-column label="手机" min-width="130" show-overflow-tooltip>
          <template #default="scope">{{ scope.row.mobile || "-" }}</template>
        </el-table-column>
        <el-table-column property="email" label="邮箱" min-width="250" show-overflow-tooltip />
        <el-table-column label="最后登录" min-width="160">
          <template #default="scope">{{ relativeTime(scope.row.latestLoginData) }}</template>
        </el-table-column>
        <el-table-column label="审核状态">
          <template #default="scope">
            <el-tooltip effect="dark" :content="scope.row.auditMsg" placement="top" v-if="scope.row.status === 2">
              {{ mappingMatching(statusMapping, scope.row.status) }}
            </el-tooltip>
            <span v-else>{{ mappingMatching(statusMapping, scope.row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" width="40">
          <template #default="scope">
            <i class="icon-btn admin icon-audit" title="审核" @click="audit(scope.row)" v-if="scope.row.status === 0" />
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

  <el-dialog v-model="auditPopupShow" title="审核">
    <div class="audit-popup-body">
      <div class="title">申请信息</div>
      <div class="apply-info-box">
        <div class="apply-info" v-for="(item, index) in operateData.items" :key="item.username + index">
          <div>用户：{{ item.username }}</div>
          <div>职业：{{ item.occupation }}</div>
          <div>区域：{{ item.areaName }}</div>
          <div>其他：{{ item.description }}</div>
        </div>
      </div>
      <div class="title">审核结果</div>
      <el-radio-group v-model="operateData.auditResult">
        <el-radio :label="item.label" v-for="item in auditResultList" :key="item.id"></el-radio>
      </el-radio-group>
      <el-input
        style="margin-top: 10px"
        v-model="operateData.auditMsg"
        :autosize="{ minRows: 2, maxRows: 4 }"
        type="textarea"
        placeholder="请输入备注（选填）"
      />
    </div>
    <template #footer>
      <el-button @click="auditPopupShow = false">取消</el-button>
      <el-button type="primary" @click="auditConfirm()">确定</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { formatDate, mappingMatching, relativeTime } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage } from "element-plus";
import { UserService } from "@/api/request";
import { reactive, toRefs, watch } from "vue";
import { Qualifications } from "@/typings/object";
import { AuditQualificationsParams, QualificationsListParams } from "@/typings/params";

/** 审核结果选项 */
interface AuditResult {
  id: number;
  label: string;
  remark: string;
  result: 1 | 2;
}

/** 审核内测资格参数 */
interface MyAuditQualificationsParams extends AuditQualificationsParams {
  items?: Qualifications[];
  auditResult?: string;
}

export default {
  setup() {
    const { query, switchPage } = useMyRouter();
    const assetsData = {
      statusMapping: [
        { value: 0, label: "未审核" },
        { value: 1, label: "已通过" },
        { value: 2, label: "未通过" },
      ],
      auditResultList: [
        { id: 1, label: "通过", remark: "", result: 1 },
        {
          id: 2,
          label: "拒绝：链接无法打开",
          remark: "经审核，您提交的链接无法打开，请重新提交您常用的创作平台或社区的个人主页网址。",
          result: 2,
        },
        {
          id: 3,
          label: "拒绝：公众号ID不存在",
          remark: "经审核，您提交的公众号不存在，请重新提交您的微信公众号ID。",
          result: 2,
        },
        { id: 4, label: "拒绝：其他原因", remark: "经审核，您需要重新提交申请信息。", result: 2 },
      ] as AuditResult[],
    };
    const data = reactive({
      loading: false,
      tableData: [] as Qualifications[],
      total: 0,
      selectedData: [] as Qualifications[],
      searchData: { currentPage: 1, limit: 20 } as QualificationsListParams,
      operateData: {} as MyAuditQualificationsParams,
      auditPopupShow: false,
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        data.tableData = [];
        data.loading = true;
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        const result = await UserService.getQualificationsList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data;

          if (dataList.length === 0) {
            data.total = 0;
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

      /** 审核操作 */
      async audit(item?: Qualifications) {
        data.operateData = {} as MyAuditQualificationsParams;
        if (item) {
          data.operateData.items = [item];
        } else {
          data.operateData.items = data.selectedData;
        }
        data.auditPopupShow = true;
      },

      /** 审核 */
      async auditConfirm() {
        const { items } = data.operateData;
        if (!validate() || !items) return;

        data.operateData.recordIds = items.map((item: Qualifications) => {
          return item.recordId;
        });
        const result = await UserService.auditQualifications(data.operateData);
        const { errcode } = result.data;
        if (errcode === 0) {
          data.auditPopupShow = false;
          this.getData();
        }
      },

      /** 选择表格项 */
      selectTable(selected: Qualifications[]) {
        data.selectedData = selected;
      },
    };

    /** 表单验证 */
    const validate = () => {
      const { auditResult } = data.operateData;
      if (!auditResult) {
        ElMessage("请选择审核结果");
        return false;
      }
      return true;
    };

    watch(
      () => data.operateData.auditResult,
      (cur) => {
        const item = assetsData.auditResultList.find((item) => item.label === cur);
        if (!item) return;

        data.operateData.auditMsg = item.remark;
        data.operateData.status = item.result;
      }
    );

    data.searchData.keywords = query.value.username;
    methods.getData(true);

    return {
      mappingMatching,
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
.audit-popup-body {
  margin-top: -40px;

  .title {
    font-size: 16px;
    font-weight: bold;
    margin: 20px 0;
  }

  .apply-info-box {
    max-height: 300px;
    overflow: auto;

    .apply-info {
      padding: 10px;
      background-color: #eef1f6;
      line-height: 1.5;
      border-radius: 6px;

      & + .apply-info {
        margin-top: 5px;
      }
    }
  }
}
</style>
