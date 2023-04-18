<!-- 运营分类管理 -->
<template>
  <list-template>
    <template v-slot:barLeft v-if="selectedData.length">
      <el-button type="primary" @click="operate(1)">启用</el-button>
      <el-button type="primary" @click="operate(2)">停用</el-button>
      <span class="selected-tip">已选中{{ selectedData.length }}条</span>
    </template>

    <template v-slot:barRight>
      <el-button type="primary" @click="toSort()">排序</el-button>
      <el-button type="primary" @click="toEdit()">新增运营分类</el-button>
    </template>

    <template v-slot:filterBar>
      <div class="filter-controls">
        <form-item label="关键字搜索">
          <el-input v-model="searchData.name" placeholder="请输入名称" clearable @keyup.enter="getData(true)" />
        </form-item>
        <form-item label="状态">
          <el-select v-model="searchData.status" placeholder="所有" clearable>
            <el-option v-for="item in statusMapping" :key="item.value" :value="item.value" :label="item.label" />
          </el-select>
        </form-item>
        <form-item label="父类">
          <el-select v-model="searchData.parentCode" placeholder="不限" clearable>
            <el-option v-for="item in parentList" :key="item.code" :value="item.code" :label="item.name" />
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
        <el-table-column label="运营分类" min-width="200">
          <template #default="scope">{{ scope.row.name || "-" }}</template>
        </el-table-column>
        <el-table-column label="父类" min-width="200">
          <template #default="scope">{{ scope.row.parentName || "-" }}</template>
        </el-table-column>
        <el-table-column label="映射来源" min-width="250">
          <template #default="scope">
            <div class="wrap-row">
              <div
                class="sources"
                :class="{ special: [4, 5, 6, 7].includes(item.type) }"
                v-for="item in scope.row.sources"
                :key="item.identity"
              >
                <template v-if="[1, 2, 4, 5, 6, 7].includes(item.type)">
                  <el-icon class="type-icon"><grid /></el-icon>
                  <span v-if="item.type === 4">所有基础类型</span>
                  <span v-else-if="item.type === 5">{{ item.name }}/所有基础类型</span>
                  <span v-else-if="item.type === 6">所有自定义类型</span>
                  <span v-else-if="item.type === 7">{{ item.name }}/所有自定义类型</span>
                  <span v-else>
                    {{
                      item.parentChain
                        .reverse()
                        .map((item) => item.name)
                        .join("/")
                    }}
                  </span>
                </template>
                <template v-if="item.type === 3">
                  <div class="tag-icon">#</div>
                  {{ item.name }}
                </template>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="关联资源数量" min-width="200">
          <template #default="scope">{{ scope.row.resourceCount || "-" }}</template>
        </el-table-column>
        <el-table-column label="状态" min-width="250">
          <template #default="scope">
            <div>
              <div>{{ statusMapping.find((item) => item.value === scope.row.status)!.label }}</div>
              <div v-if="scope.row.status === 2 && scope.row.startTime">
                将于 {{ formatDate(scope.row.startTime) }} 启用
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column fixed="right" width="100">
          <template #header>
            <el-icon class="operation-icon" title="操作">
              <operation />
            </el-icon>
          </template>
          <template #default="scope">
            <el-icon class="icon-btn" title="停用" @click="operate(2, scope.row.code)" v-if="scope.row.status === 1">
              <close />
            </el-icon>
            <el-icon class="icon-btn" title="启用" @click="operate(1, scope.row.code)" v-if="scope.row.status === 2">
              <check />
            </el-icon>
            <el-icon class="icon-btn" title="编辑" @click="toEdit(scope.row.code)">
              <edit />
            </el-icon>
            <el-icon class="icon-btn" title="删除" @click="deleteClassification(scope.row.code)">
              <delete />
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
import { ActivitiesService } from "@/api/request";
import { Grid, Operation, Edit, Close, Check, Delete } from "@element-plus/icons-vue";
import { reactive, toRefs } from "vue";
import { useMyRouter } from "@/utils/hooks";
import { Classification } from "@/typings/object";
import { ClassificationListParams } from "@/typings/params";
import { ElMessageBox } from "element-plus";

export default {
  components: {
    Grid,
    Operation,
    Close,
    Check,
    Edit,
    Delete,
  },

  setup() {
    const { switchPage, openPage } = useMyRouter();
    const assetsData = {
      statusMapping: [
        { value: 1, label: "已启用" },
        { value: 2, label: "已停用" },
      ],
    };
    const data = reactive({
      loading: false,
      tableData: [] as Classification[],
      total: 0,
      selectedData: [] as Classification[],
      searchData: { currentPage: 1, limit: 20 } as ClassificationListParams,
      parentList: [] as Classification[],
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        data.tableData = [];
        data.loading = true;
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        const result = await ActivitiesService.getClassificationList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data.operationCategories;

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

      /** 获取父类选项数据 */
      async getParentList() {
        const result = await ActivitiesService.getClassificationGroupList("");
        const { errcode } = result.data;
        if (errcode === 0) {
          data.parentList = result.data.data;
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

      /** 跳转运营分类排序 */
      toSort() {
        switchPage("/operating/classification-sort");
      },

      /** 编辑运营分类 */
      toEdit(code?: string) {
        switchPage("/operating/edit-classification", { code });
      },

      /** 选择表格项 */
      selectTable(selected: Classification[]) {
        data.selectedData = selected;
      },

      /** 启用/停用/删除操作 */
      operate(status: 1 | 2, code?: string) {
        ElMessageBox.confirm(
          `确认${status === 1 ? "启用" : "停用"}${code ? "当前" : "所有已选"}运营分类吗？`,
          `${status === 1 ? "启用" : "停用"}运营分类`,
          {
            confirmButtonText: status === 1 ? "启用" : "停用",
            cancelButtonText: "取消",
          }
        ).then(async () => {
          const codes = code ? [code] : data.selectedData.map((item) => item.code);
          const params = { codes, status };
          const result = await ActivitiesService.operateClassification(params);
          const { errcode } = result.data;
          if (errcode === 0) {
            this.getData(true);
          }
        });
      },

      /** 删除操作 */
      deleteClassification(code: string) {
        ElMessageBox.confirm(`确认删除当前运营分类吗？`, `删除运营分类`, {
          confirmButtonText: "删除",
          cancelButtonText: "取消",
        }).then(async () => {
          const result = await ActivitiesService.deleteClassification(code);
          const { errcode } = result.data;
          if (errcode === 0) {
            this.getData(true);
          }
        });
      },
    };

    methods.getData(true);
    methods.getParentList();

    return {
      openPage,
      ...assetsData,
      ...toRefs(data),
      ...methods,
      switchPage,
      formatDate,
    };
  },
};
</script>

<style lang="scss" scoped>
.wrap-row {
  display: flex;
  flex-wrap: wrap;

  .sources {
    line-height: 24px;
    display: flex;
    margin-right: 20px;

    &.special {
      color: #9090ff;

      .type-icon {
        color: #9090ff;
      }
    }

    .type-icon {
      color: #888;
      font-size: 16px;
      margin-right: 5px;
      margin-top: 4px;
    }

    .tag-icon {
      color: #888;
      font-size: 18px;
      font-weight: 800;
      margin-right: 5px;
    }
  }
}
</style>
