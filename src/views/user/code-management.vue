<!-- 邀请码管理 -->
<template>
  <list-template>
    <template v-slot:hidden>
      <input id="copyInput" v-model="copyValue" />
    </template>

    <template v-slot:barLeft>
      <span class="selected-tip" v-show="selectedData.length">已选中{{ selectedData.length }}条</span>
    </template>

    <template v-slot:barRight>
      <el-button type="primary" @click="operate(1)">批量禁用</el-button>
      <el-button type="primary" @click="operate(0)">批量解禁</el-button>
      <el-button type="primary" @click="createInviteCode()"> 批量生成邀请码 </el-button>
    </template>

    <template v-slot:filterBar>
      <form-item label="关键字搜索">
        <el-input
          style="width: 250px"
          v-model="searchData.keywords"
          placeholder="请输入邀请码、邀请者用户名"
          clearable
          @keyup.enter="getData(true)"
        />
      </form-item>
      <form-item label="状态">
        <el-select v-model="searchData.status" clearable placeholder="请选择状态">
          <el-option v-for="item in statusMapping" :key="item.value" :label="item.label" :value="item.value" />
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
      <form-item>
        <el-button type="primary" @click="getData()">搜索</el-button>
        <el-button @click="clearSearch()">重置</el-button>
      </form-item>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" stripe @selection-change="selectTable">
        <el-table-column type="selection" />
        <el-table-column label="邀请码" width="150" show-overflow-tooltip>
          <template #default="scope">
            <div class="table-cell-item">
              <span>{{ scope.row.code }}</span>
              <el-icon class="icon-btn" title="复制" @click="copy(scope.row.code)"><copy-document /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
        </el-table-column>
        <el-table-column label="邀请者(用户名)" min-width="120" show-overflow-tooltip>
          <template #default="scope">
            <el-button
              type="text"
              @click="
                switchPage('/user/user-management', {
                  username: scope.row.username,
                })
              "
              v-if="scope.row.username"
              >{{ scope.row.username }}
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="剩余次数" width="100">
          <template #default="scope">
            <div class="table-cell-item">
              <span v-if="scope.row.limitCount">
                {{ scope.row.limitCount - scope.row.usedCount }}/
                {{ scope.row.limitCount }}
              </span>
              <span v-else>不限</span>
              <el-icon class="icon-btn" title="查看使用记录" @click="viewRecord(scope.row.code)"><document /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="有效期" width="250">
          <template #default="scope">
            <span v-if="scope.row.endEffectiveDate"
              >{{ formatDate(scope.row.startEffectiveDate, "YYYY-MM-DD") }} 至
              {{ formatDate(scope.row.endEffectiveDate, "YYYY-MM-DD") }}</span
            >
            <span v-else>永久</span>
            <el-tag
              style="margin-left: 5px"
              type="danger"
              v-if="scope.row.endEffectiveDate && !isValid(scope.row.endEffectiveDate)"
            >
              已过期
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="150" show-overflow-tooltip>
          <template #default="scope">
            {{ scope.row.remark || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="scope">
            {{ statusMapping.find((item) => item.value === scope.row.status).label }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" width="40">
          <template #header>
            <el-icon class="operation-icon" title="操作">
              <operation />
            </el-icon>
          </template>
          <template #default="scope">
            <el-icon class="icon-btn" title="禁用" @click="operate(1, scope.row.code)" v-if="scope.row.status === 0">
              <close />
            </el-icon>
            <el-icon class="icon-btn" title="解禁" @click="operate(0, scope.row.code)" v-if="scope.row.status === 1">
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
        @current-change="changePage($event, 'searchData')"
      />
    </template>
  </list-template>

  <el-dialog v-model="createCodePopupShow" title="生成邀请码">
    <div class="popup-item">
      <div class="item-label">生成数量</div>
      <div class="item-value">
        <el-input v-model="operateData.createQuantity" placeholder="请输入生成数量" />
      </div>
    </div>
    <div class="popup-item">
      <div class="item-label">使用次数</div>
      <div class="item-value">
        <el-radio-group v-model="operateData.limitCountType">
          <el-radio :label="1">不限</el-radio>
          <el-radio :label="2">
            限制使用<el-input style="width: 50px; margin: 0 10px" v-model="operateData.limitCountText" />次
          </el-radio>
        </el-radio-group>
      </div>
    </div>
    <div class="popup-item">
      <div class="item-label">有效期</div>
      <div class="item-value">
        <el-radio-group v-model="operateData.effectiveDateType">
          <el-radio :label="1">永久</el-radio>
          <el-radio :label="2">
            期限
            <el-date-picker
              style="width: 300px; margin-left: 10px"
              v-model="operateData.effectiveDate"
              type="daterange"
              unlink-panels
              range-separator="-"
              format="YYYY/MM/DD"
              start-placeholder="起始日期"
              end-placeholder="截止日期"
              :shortcuts="dateRangeShortcuts"
            />
          </el-radio>
        </el-radio-group>
      </div>
    </div>
    <div class="popup-item">
      <div class="item-label">备注（选填）</div>
      <div class="item-value">
        <el-input
          v-model="operateData.remark"
          :autosize="{ minRows: 2, maxRows: 4 }"
          type="textarea"
          placeholder="请输入备注"
        />
      </div>
    </div>
    <template #footer>
      <el-button @click="createCodePopupShow = false">取消</el-button>
      <el-button type="primary" @click="createCode()">生成</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="recordPopupShow" :title="'使用记录 > ' + recordData?.code">
    <div class="filter-bar">
      <form-item label="关键字搜索">
        <el-input v-model="recordSearchData.keywords" placeholder="请输入使用者用户名" clearable />
      </form-item>
      <form-item>
        <el-button type="primary" @click="getRecordList(recordData?.code)">搜索</el-button>
      </form-item>
    </div>

    <el-table :data="recordData?.list" stripe border>
      <el-table-column label="序号" type="index" width="80" />
      <el-table-column property="username" label="使用者(用户名)" show-overflow-tooltip />
      <el-table-column property="loginIp" label="IP地址" show-overflow-tooltip />
      <el-table-column label="使用时间">
        <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
      </el-table-column>
    </el-table>
    <div class="pagination-box">
      <el-pagination
        layout="total, prev, pager, next, jumper"
        v-model:currentPage="recordSearchData.currentPage"
        :total="recordData.total"
        :page-size="recordSearchData.limit"
        @current-change="changePage($event, 'recordSearchData')"
      />
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { reactive, toRefs } from "vue-demi";
import { dateRange, formatDate, relativeTime } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage, ElMessageBox } from "element-plus";
import { Operation, CopyDocument, Document, Close, Check } from "@element-plus/icons-vue";
import { nextTick } from "vue";
import { dateRangeShortcuts } from "@/assets/data";
import { UserService } from "@/api/request";
import { CreateCodeParams, ListParams } from "@/api/interface";

/** 邀请码数据 */
export interface Code {
  userId: string;
  code: string;
  createDate: string;
  username: string;
  usedCount: number;
  limitCount: number;
  startEffectiveDate: string;
  endEffectiveDate: string;
  status: 0 | 1;
}

/** 邀请码使用记录数据 */
export interface CodeRecord {
  userId: string;
  username: string;
  loginIp: string;
  code: string;
  createDate: string;
}

export default {
  components: {
    Operation,
    CopyDocument,
    Document,
    Close,
    Check,
  },

  setup() {
    const { switchPage } = useMyRouter();
    const assetsData = {
      statusMapping: [
        { value: 0, label: "正常" },
        { value: 1, label: "已禁用" },
      ],
    };
    const data = reactive({
      tableData: [] as Code[],
      total: 0,
      selectedData: [] as Code[],
      searchData: {
        currentPage: 1,
        limit: 20,
      } as ListParams,
      operateData: {} as CreateCodeParams,
      recordSearchData: {
        currentPage: 1,
        limit: 20,
      } as ListParams,
      recordData: {} as { code: string; list: CodeRecord[]; total: number },
      copyValue: "",
      createCodePopupShow: false,
      recordPopupShow: false,
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit, createDate } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        [data.searchData.beginCreateDate, data.searchData.endCreateDate] = dateRange(createDate);
        const result = await UserService.getCodeList(data.searchData);
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
      changePage(value: number, key: "searchData" | "recordSearchData") {
        data[key].currentPage = value;
        this.getData();
      },

      /** 复制 */
      copy(value: string) {
        data.copyValue = value;
        nextTick(() => {
          const input: any = document.getElementById("copyInput");
          input.select();
          document.execCommand("Copy");
          ElMessage.success("复制成功");
        });
      },

      /** 批量生成邀请码 */
      createInviteCode() {
        data.operateData = {} as CreateCodeParams;
        data.createCodePopupShow = true;
      },

      /** 生成邀请码 */
      async createCode() {
        if (!validate()) return;

        const { limitCountType, limitCountText, effectiveDateType } = data.operateData;
        if (limitCountType === 1) {
          data.operateData.limitCount = 0;
        } else if (limitCountType === 2) {
          data.operateData.limitCount = limitCountText;
        }
        if (effectiveDateType === 2) {
          data.operateData.startEffectiveDate = data.operateData.effectiveDate[0];
          data.operateData.endEffectiveDate = data.operateData.effectiveDate[1];
        }

        const result = await UserService.createCode(data.operateData);
        const { errcode } = result.data;
        if (errcode === 0) {
          this.getData();
          data.createCodePopupShow = false;
        }
      },

      /** 查看使用记录 */
      viewRecord(code: string) {
        data.recordPopupShow = true;
        this.getRecordList(code);
      },

      /** 获取使用记录 */
      async getRecordList(code: string, init = false) {
        if (init) data.recordSearchData.currentPage = 1;
        const { currentPage, limit } = data.recordSearchData;
        data.recordSearchData.skip = (currentPage - 1) * limit;
        const result = await UserService.getCodeRecordList(data.recordSearchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data;
          data.recordData = {
            code,
            list: dataList,
            total: totalItem,
          };
        }
      },

      /** 操作（禁用/解禁） */
      operate(type: 0 | 1, code?: string) {
        if (!code && data.selectedData.length === 0) {
          ElMessage(`请选择需要${type === 1 ? "禁用" : "解禁"}的条目`);
          return;
        }

        ElMessageBox.confirm(`确认${type === 1 ? "禁用" : "解禁"}${code ? "当前" : "所有已选"}条目？`, "", {
          confirmButtonText: type === 1 ? "禁用" : "解禁",
          cancelButtonText: "取消",
        }).then(async () => {
          const result = await UserService.updateCode({
            codes: code ? [code] : data.selectedData.map((item) => item.code),
            status: type,
          });
          const { errcode } = result.data;
          if (errcode === 0) {
            this.getData();
          }
        });
      },

      /** 选择表格项 */
      selectTable(selected: Code[]) {
        data.selectedData = selected;
      },

      /** 判断是否处于有效期 */
      isValid(time: string) {
        const now = new Date();
        const timestamp = new Date(time);
        return now < timestamp;
      },
    };

    /** 表单验证 */
    const validate = () => {
      const { createQuantity, limitCountType, limitCountText, effectiveDateType, effectiveDate } = data.operateData;
      if (!createQuantity) {
        ElMessage("请输入生成数量");
        return false;
      } else if (!limitCountType || (limitCountType === 2 && !limitCountText)) {
        ElMessage("请输入使用次数");
        return false;
      } else if (!effectiveDateType || (effectiveDateType === 2 && !effectiveDate)) {
        ElMessage("请选择有效期");
        return false;
      }
      return true;
    };

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
.popup-item {
  display: flex;

  & + .popup-item {
    margin-top: 20px;
  }

  .item-label {
    width: 100px;
    line-height: 32px;
  }

  .item-value {
    flex: 1;
  }
}

.filter-bar {
  display: flex;
  align-items: center;
}

.pagination-box {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>
