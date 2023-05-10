<!-- 资源类型管理 -->
<template>
  <list-template>
    <template v-slot:top>
      <el-tabs v-model="searchData.category">
        <el-tab-pane label="基础资源类型" :name="1"></el-tab-pane>
        <el-tab-pane label="自定义资源类型" :name="2"></el-tab-pane>
      </el-tabs>
    </template>

    <template v-slot:barLeft v-if="selectedData.length">
      <el-button type="primary" @click="operate(1)">启用</el-button>
      <el-button type="primary" @click="operate(2)">停用</el-button>
      <span class="selected-tip">已选中{{ selectedData.length }}条</span>
    </template>

    <template v-slot:barRight v-if="searchData.category === 1">
      <el-button type="primary" @click="toSort()">排序</el-button>
      <el-button type="primary" @click="toEdit()">新增资源类型</el-button>
    </template>

    <template v-slot:filterBar>
      <div class="filter-controls">
        <form-item label="关键字搜索">
          <el-input
            v-model="searchData.codeOrName"
            placeholder="请输入类型编号、名称"
            clearable
            @keyup.enter="getData(true)"
          />
        </form-item>
        <template v-if="searchData.category === 1">
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
        </template>
      </div>
      <div class="filter-btns">
        <el-button type="primary" @click="getData(true)">搜索</el-button>
        <el-button @click="clearSearch()">重置</el-button>
      </div>
    </template>

    <template v-slot:table>
      <el-table
        :data="tableData"
        stripe
        @selection-change="selectTable"
        v-loading="loading"
        v-if="searchData.category === 1"
      >
        <el-table-column type="selection" />
        <el-table-column label="编号" min-width="200">
          <template #default="scope">{{ scope.row.code || "-" }}</template>
        </el-table-column>
        <el-table-column label="资源类型" min-width="200">
          <template #default="scope">{{ scope.row.name || "-" }}</template>
        </el-table-column>
        <el-table-column label="父类" min-width="200">
          <template #default="scope">{{ scope.row.parentName || "-" }}</template>
        </el-table-column>
        <el-table-column label="关联资源数量" min-width="200">
          <template #default="scope">
            <span
              class="text-btn"
              @click="
                switchPage('/resource/resource-management', {
                  type: scope.row.parentName ? `${scope.row.parentName},${scope.row.name}` : scope.row.name,
                })
              "
            >
              {{ scope.row.resourceCount || "-" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="scope">{{ mappingMatching(statusMapping, scope.row.status) }}</template>
        </el-table-column>
        <el-table-column fixed="right" width="70">
          <template #default="scope">
            <i
              class="icon-btn admin icon-stop"
              title="停用"
              @click="operate(2, scope.row.code)"
              v-if="scope.row.status === 1"
            />
            <i
              class="icon-btn admin icon-restore"
              title="启用"
              @click="operate(1, scope.row.code)"
              v-if="scope.row.status === 2"
            />
            <i class="icon-btn admin icon-edit" title="编辑" @click="toEdit(scope.row.code)" />
          </template>
        </el-table-column>
      </el-table>

      <el-table :data="tableData" stripe v-loading="loading" v-else-if="searchData.category === 2">
        <el-table-column label="编号" min-width="200">
          <template #default="scope">{{ scope.row.code || "-" }}</template>
        </el-table-column>
        <el-table-column label="资源类型" min-width="200">
          <template #default="scope">{{ scope.row.name || "-" }}</template>
        </el-table-column>
        <el-table-column label="隶属类型" min-width="200">
          <template #default="scope">{{ scope.row.parentName || "-" }}</template>
        </el-table-column>
        <el-table-column label="关联资源数量" min-width="200">
          <template #default="scope">
            <span
              class="text-btn"
              @click="
                switchPage('/resource/resource-management', { type: `${scope.row.parentName},${scope.row.name}` })
              "
            >
              {{ scope.row.resourceCount || "-" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="200">
          <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
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
import { ResourceService } from "@/api/request";
import { reactive, toRefs, watch } from "vue";
import { useMyRouter } from "@/utils/hooks";
import { ResourceType } from "@/typings/object";
import { ResourceTypeListParams } from "@/typings/params";
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
      tableData: [] as ResourceType[],
      total: 0,
      selectedData: [] as ResourceType[],
      searchData: { currentPage: 1, limit: 20, category: 1 } as ResourceTypeListParams,
      parentList: [] as ResourceType[],
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        data.tableData = [];
        data.loading = true;
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        if (!data.searchData.parentCode) delete data.searchData.parentCode;
        const result = await ResourceService.getResourceTypeList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data.resourceTypes;

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
        const result = await ResourceService.getResourceTypeListByParentType("");
        const { errcode } = result.data;
        if (errcode === 0) {
          data.parentList = result.data.data;
        }
      },

      /** 重置 */
      clearSearch() {
        const { category } = data.searchData;
        data.searchData = {
          currentPage: 1,
          limit: 20,
          category,
        };
        this.getData(true);
      },

      /** 切换表格页码 */
      changePage(value: number) {
        data.searchData.currentPage = value;
        this.getData();
      },

      /** 跳转资源类型排序 */
      toSort() {
        switchPage("/resource/type-sort");
      },

      /** 编辑资源类型 */
      toEdit(code?: string) {
        switchPage("/resource/edit-type", { code });
      },

      /** 选择表格项 */
      selectTable(selected: ResourceType[]) {
        data.selectedData = selected;
      },

      /** 启用/停用操作 */
      operate(status: 1 | 2, code?: string) {
        ElMessageBox.confirm(
          `确认${status === 1 ? "启用" : "停用"}${code ? "当前" : "所有已选"}资源类型吗？`,
          `${status === 1 ? "启用" : "停用"}资源类型`,
          {
            confirmButtonText: status === 1 ? "启用" : "停用",
            cancelButtonText: "取消",
          }
        ).then(async () => {
          const codes = code ? [code] : data.selectedData.map((item) => item.code);
          const params = { codes, status };
          const result = await ResourceService.operateResourceType(params);
          const { errcode } = result.data;
          if (errcode === 0) {
            this.getData(true);
          }
        });
      },
    };

    watch(
      () => data.searchData.category,
      (cur) => {
        data.searchData = {
          codeOrName: "",
          currentPage: 1,
          limit: 20,
          category: cur,
        };
        methods.getData(true);
      }
    );

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
