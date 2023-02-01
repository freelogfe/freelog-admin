<!-- 资源属性管理 -->
<template>
  <list-template>
    <template v-slot:top>
      <el-tabs v-model="pageType" @tab-change="pageType = $event">
        <el-tab-pane label="标准属性" name="standard"></el-tab-pane>
        <el-tab-pane label="补充属性" name="supplement"></el-tab-pane>
      </el-tabs>
    </template>

    <template v-slot:barRight v-if="pageType === 'standard'">
      <el-button type="primary" @click="toEdit()">新增资源属性</el-button>
    </template>

    <template v-slot:filterBar>
      <div class="filter-controls">
        <form-item label="关键字搜索">
          <el-input
            v-model="searchData.keywords"
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
      <el-table :data="tableData" stripe v-loading="loading" v-if="pageType === 'standard'">
        <el-table-column label="属性名称" min-width="200">
          <template #default="scope">{{ scope.row.title || "-" }}</template>
        </el-table-column>
        <el-table-column label="属性键" min-width="200">
          <template #default="scope">{{ scope.row.title || "-" }}</template>
        </el-table-column>
        <el-table-column label="关联资源类型" min-width="200">
          <template #default="scope">{{ scope.row.title || "-" }}</template>
        </el-table-column>
        <el-table-column label="录入方式" min-width="200">
          <template #default="scope">{{ scope.row.title || "-" }}</template>
        </el-table-column>
        <el-table-column fixed="right" width="40">
          <template #header>
            <el-icon class="operation-icon" title="操作">
              <operation />
            </el-icon>
          </template>
          <template #default="scope">
            <el-icon class="icon-btn" title="编辑" @click="toEdit(scope.row._id)">
              <edit />
            </el-icon>
          </template>
        </el-table-column>
      </el-table>

      <el-table :data="tableData" stripe v-loading="loading" v-else-if="pageType === 'supplement'">
        <el-table-column label="常用属性名称" min-width="200">
          <template #default="scope">{{ scope.row.title || "-" }}</template>
        </el-table-column>
        <el-table-column label="属性键" min-width="200">
          <template #default="scope">{{ scope.row.title || "-" }}</template>
        </el-table-column>
        <el-table-column label="关联资源类型" min-width="200">
          <template #default="scope">{{ scope.row.title || "-" }}</template>
        </el-table-column>
        <el-table-column label="关联资源数量" min-width="200">
          <template #default="scope">{{ scope.row.title || "-" }}</template>
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
import { formatDate } from "../../utils/common";
import { ActivitiesService } from "@/api/request";
import { Operation, Edit } from "@element-plus/icons-vue";
import { reactive, toRefs } from "vue";
import { useMyRouter } from "@/utils/hooks";
import { Activity } from "@/typings/object";
import { ActivityListParams } from "@/typings/params";

export default {
  components: {
    Operation,
    Edit,
  },

  setup() {
    const { switchPage, openPage } = useMyRouter();
    const assetsData = {};
    const data = reactive({
      pageType: "standard",
      loading: false,
      tableData: [] as Activity[],
      total: 0,
      searchData: { currentPage: 1, limit: 20 } as ActivityListParams,
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        data.tableData = [];
        data.loading = true;
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        const result = await ActivitiesService.getActivityList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { activities, num } = result.data.data;

          if (activities.length === 0) {
            data.loading = false;
            return;
          }

          data.tableData = activities;
          data.total = num;
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

      /** 编辑资源属性 */
      toEdit(id?: string) {
        switchPage("/resource/edit-property", { id });
      },
    };

    methods.getData(true);

    return {
      openPage,
      ...assetsData,
      ...toRefs(data),
      ...methods,
      formatDate,
    };
  },
};
</script>
