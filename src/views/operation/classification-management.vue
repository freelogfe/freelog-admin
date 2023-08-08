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
                  <i class="admin icon-type" />
                  <span v-if="item.type === 4">所有基础类型</span>
                  <span v-else-if="item.type === 5">{{ item.name }}/所有基础类型</span>
                  <span v-else-if="item.type === 6">所有自定义类型</span>
                  <span v-else-if="item.type === 7">{{ item.name }}/所有自定义类型</span>
                  <span v-else>{{ getSourcesLine(item.parentChain) }}</span>
                </template>
                <template v-if="item.type === 3">
                  <i class="admin icon-tag" />
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
              <div>{{ mappingMatching(statusMapping, scope.row.status) }}</div>
              <div v-if="scope.row.status === 1 && scope.row.limitTime">
                将于 {{ formatDate(scope.row.limitTime) }} 停用
              </div>
              <div v-if="scope.row.status === 2 && scope.row.startTime">
                将于 {{ formatDate(scope.row.startTime) }} 启用
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column fixed="right" width="100">
          <template #default="scope">
            <i
              class="icon-btn admin icon-stop"
              title="停用"
              @click="operate(2, scope.row.code)"
              v-if="scope.row.status === 1"
            />
            <i
              class="icon-btn admin icon-enable"
              title="启用"
              @click="operate(1, scope.row.code)"
              v-if="scope.row.status === 2"
            />
            <i class="icon-btn admin icon-edit" title="编辑" @click="toEdit(scope.row.code)" />
            <i class="icon-btn admin icon-delete" title="删除" @click="deleteClassification(scope.row.code)" />
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
import { formatDate, mappingMatching } from "../../utils/common";
import { ActivitiesService } from "@/api/request";
import { reactive, toRefs } from "vue";
import { useMyRouter } from "@/utils/hooks";
import { Classification } from "@/typings/object";
import { ClassificationListParams } from "@/typings/params";
import { ElMessageBox } from "element-plus";

export default {
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
        const { currentPage, limit, parentCode } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        if (!parentCode) delete data.searchData.parentCode;
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

      /** 获取映射来源链 */
      getSourcesLine(list: any[]) {
        const result = [...list];

        return result
          .reverse()
          .map((item: any) => item.name)
          .join("/");
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
        switchPage("/operation/classification-sort");
      },

      /** 编辑运营分类 */
      toEdit(code?: string) {
        switchPage("/operation/edit-classification", { code });
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
      mappingMatching,
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

      .admin {
        color: #9090ff;
      }
    }

    .admin {
      font-size: 16px;
      margin-right: 5px;
    }
  }
}
</style>
