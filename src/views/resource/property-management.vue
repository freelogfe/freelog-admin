<!-- 资源属性管理 -->
<template>
  <list-template>
    <template v-slot:top>
      <el-tabs v-model="searchData.group">
        <el-tab-pane label="标准属性" :name="1"></el-tab-pane>
        <el-tab-pane label="补充属性" :name="2"></el-tab-pane>
      </el-tabs>
    </template>

    <template v-slot:barRight v-if="searchData.group === 1">
      <el-button type="primary" @click="toEdit()">新增资源属性</el-button>
    </template>

    <template v-slot:filterBar>
      <div class="filter-controls">
        <form-item label="关键字搜索">
          <el-input
            v-model="searchData.nameOrKey"
            placeholder="请输入属性名称、属性键"
            clearable
            @keyup.enter="getData(true)"
          />
        </form-item>
      </div>
      <div class="filter-btns">
        <el-button type="primary" @click="getData(true)">搜索</el-button>
        <el-button @click="clearSearch()">重置</el-button>
      </div>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" stripe v-loading="loading" v-if="searchData.group === 1">
        <el-table-column label="属性名称" min-width="200">
          <template #default="scope">{{ scope.row.name || "-" }}</template>
        </el-table-column>
        <el-table-column label="属性键" min-width="200">
          <template #default="scope">{{ scope.row.key || "-" }}</template>
        </el-table-column>
        <el-table-column label="关联资源数量" min-width="200">
          <template #default="scope">{{ scope.row.dependencies || "-" }}</template>
        </el-table-column>
        <el-table-column label="录入方式" min-width="200">
          <template #default="scope">{{ mappingMatching(insertModeMapping, scope.row.insertMode) }}</template>
        </el-table-column>
        <el-table-column fixed="right" width="40">
          <template #default="scope">
            <i class="icon-btn admin icon-edit" title="编辑" @click="toEdit(scope.row.key)" />
          </template>
        </el-table-column>
      </el-table>

      <el-table :data="tableData" stripe v-loading="loading" v-else-if="searchData.group === 2">
        <el-table-column label="常用属性名称" min-width="200">
          <template #default="scope">{{ scope.row.name || "-" }}</template>
        </el-table-column>
        <el-table-column label="属性键" min-width="200">
          <template #default="scope">{{ scope.row.key || "-" }}</template>
        </el-table-column>
        <el-table-column label="关联资源类型" min-width="200">
          <template #default="scope">{{ scope.row.resourceTypeName || "-" }}</template>
        </el-table-column>
        <el-table-column label="关联资源数量" min-width="200">
          <template #default="scope">{{ scope.row.count || "-" }}</template>
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
import { ResourceProperty } from "@/typings/object";
import { ResourcePropertyListParams } from "@/typings/params";

export default {
  setup() {
    const { switchPage } = useMyRouter();
    const assetsData = {
      insertModeMapping: [
        { value: 1, label: "系统解析" },
        { value: 2, label: "手动录入" },
      ],
    };
    const data = reactive({
      loading: false,
      tableData: [] as ResourceProperty[],
      total: 0,
      searchData: { currentPage: 1, limit: 20, group: 1 } as ResourcePropertyListParams,
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        data.tableData = [];
        data.loading = true;
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        const result = await ResourceService.getResourcePropertyList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          let dataList: ResourceProperty[] = [];
          let totalItem = 0;
          if (data.searchData.group === 1) {
            dataList = result.data.data.resourceAttrs.dataList;
            totalItem = result.data.data.resourceAttrs.totalItem;
          } else if (data.searchData.group === 2) {
            dataList = result.data.data.resourceAttrRecords;
            totalItem = result.data.data.num;
          }

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
        const { group } = data.searchData;
        data.searchData = {
          currentPage: 1,
          limit: 20,
          group,
        };
        this.getData(true);
      },

      /** 切换表格页码 */
      changePage(value: number) {
        data.searchData.currentPage = value;
        this.getData();
      },

      /** 编辑资源属性 */
      toEdit(key?: string) {
        switchPage("/resource/edit-property", { key });
      },
    };

    watch(
      () => data.searchData.group,
      (cur) => {
        data.searchData = {
          nameOrKey: "",
          currentPage: 1,
          limit: 20,
          group: cur,
        };
        methods.getData(true);
      }
    );

    methods.getData(true);

    return {
      mappingMatching,
      switchPage,
      ...assetsData,
      ...toRefs(data),
      ...methods,
      formatDate,
    };
  },
};
</script>
