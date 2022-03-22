<!-- 内测资格审核 -->
<template>
  <list-template>
    <template v-slot:barLeft>
      <span class="selected-tip" v-show="selectedData.length"
        >已选中{{ selectedData.length }}条</span
      >
    </template>

    <template v-slot:barRight>
      <el-button type="primary" @click="audit()">批量审核</el-button>
    </template>

    <template v-slot:filterBar>
      <form-item label="关键字搜索">
        <el-input
          style="width: 250px"
          v-model="searchData.keywords"
          placeholder="请输入用户名、注册手机号/邮箱"
          clearable
          @keyup.enter="getData(true)"
        />
      </form-item>
      <form-item label="状态">
        <el-select
          v-model="searchData.status"
          clearable
          placeholder="请选择状态"
        >
          <el-option
            v-for="item in statusMapping"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </form-item>
      <form-item>
        <el-button type="primary" @click="getData(true)">搜索</el-button>
        <el-button @click="clearSearch()">重置</el-button>
      </form-item>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" stripe @selection-change="selectTable">
        <el-table-column
          type="selection"
          :selectable="(row) => row.status === 0"
        />
        <el-table-column label="申请日期" width="160">
          <template #default="scope">{{
            formatDate(scope.row.createDate)
          }}</template>
        </el-table-column>
        <el-table-column
          property="occupation"
          label="职业"
          min-width="100"
          show-overflow-tooltip
        />
        <el-table-column property="city" label="区域" show-overflow-tooltip />
        <el-table-column
          property="description"
          label="其他"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column
          property="username"
          label="用户名"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column label="手机" min-width="130" show-overflow-tooltip>
          <template #default="scope">{{ scope.row.mobile || "-" }}</template>
        </el-table-column>
        <el-table-column
          property="email"
          label="邮箱"
          min-width="250"
          show-overflow-tooltip
        />
        <el-table-column label="最后登录" width="160">
          <template #default="scope">{{
            relativeTime(scope.row.latestLoginData)
          }}</template>
        </el-table-column>
        <el-table-column label="审核状态">
          <template #default="scope">
            <el-tooltip
              effect="dark"
              :content="scope.row.auditMsg"
              placement="top"
              v-if="scope.row.status === 2"
            >
              {{
                statusMapping.find((item) => item.value === scope.row.status)
                  .label
              }}
            </el-tooltip>
            <span v-else>{{
              statusMapping.find((item) => item.value === scope.row.status)
                .label
            }}</span>
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
              @click="audit(scope.row)"
              v-if="scope.row.status === 0"
            >
              <checked />
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

  <el-dialog v-model="auditPopupShow" title="审核">
    <div class="audit-popup-body">
      <div class="title">申请信息</div>
      <div class="apply-info-box">
        <div
          class="apply-info"
          v-for="(item, index) in operateData.items"
          :key="item.username + index"
        >
          <div>用户：{{ item.username }}</div>
          <div>职业：{{ item.occupation }}</div>
          <div>区域：{{ item.city }}</div>
          <div>其他：{{ item.description }}</div>
        </div>
      </div>
      <div class="title">审核结果</div>
      <el-radio-group v-model="operateData.auditResult">
        <el-radio label="通过"></el-radio>
        <el-radio label="拒绝：链接无法打开"></el-radio>
        <el-radio label="拒绝：公众号ID不存在"></el-radio>
        <el-radio label="拒绝：其他原因"></el-radio>
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
import { reactive, toRefs } from "vue-demi";
import { formatDate, relativeTime } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage } from "element-plus";
import { AuditQualifications, ListParams, UserService } from "@/api/request";
import { watch } from "vue";
import { Operation, Checked } from "@element-plus/icons-vue";

/** 内测资格审核数据 */
export interface Qualifications {
  recordId: string;
  createDate: string;
  occupation: string;
  city: string;
  description: string;
  username: string;
  mobile: string;
  email: string;
  latestLoginData: string;
  auditMsg: string;
  status: 0 | 1 | 2;
}

export default {
  components: {
    Operation,
    Checked,
  },

  setup() {
    const { query, switchPage } = useMyRouter();
    const assetsData = {
      statusMapping: [
        { value: 0, label: "未审核" },
        { value: 1, label: "已通过" },
        { value: 2, label: "未通过" },
      ],
    };
    const data = reactive({
      tableData: [] as Qualifications[],
      total: 0,
      selectedData: [] as Qualifications[],
      searchData: {
        currentPage: 1,
        limit: 20,
      } as ListParams,
      operateData: {} as AuditQualifications,
      auditPopupShow: false,
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        const result = await UserService.getQualificationsList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data;
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

      /** 审核操作 */
      async audit(item?: Qualifications) {
        data.operateData = {} as AuditQualifications;
        if (item) {
          data.operateData.items = [item];
        } else {
          if (data.selectedData.length === 0) {
            ElMessage("请选择需要审核的条目");
            return;
          }

          data.operateData.items = data.selectedData;
        }
        data.auditPopupShow = true;
      },

      /** 审核 */
      async auditConfirm() {
        if (!validate()) return;

        const { items } = data.operateData;
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
        if (cur === "通过") {
          data.operateData.status = 1;
        } else {
          data.operateData.status = 2;
          data.operateData.auditMsg = cur || "";
        }
      }
    );

    data.searchData.keywords = query.value.username;
    methods.getData(true);

    return {
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
