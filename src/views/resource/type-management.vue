<!-- 资源类型管理 -->
<template>
  <list-template>
    <template v-slot:top>
      <el-tabs v-model="pageType" @tab-change="pageType = $event">
        <el-tab-pane label="基础资源类型" name="base"></el-tab-pane>
        <el-tab-pane label="自定义资源类型" name="custom"></el-tab-pane>
      </el-tabs>
    </template>

    <template v-slot:barLeft v-if="selectedData.length">
      <el-button type="primary" @click="operate()">启用</el-button>
      <el-button type="primary" @click="operate()">停用</el-button>
      <span class="selected-tip">已选中{{ selectedData.length }}条</span>
    </template>

    <template v-slot:barRight v-if="pageType === 'base'">
      <el-button type="primary" @click="toEdit()">排序</el-button>
      <el-button type="primary" @click="toEdit()">新增资源类型</el-button>
    </template>

    <template v-slot:filterBar>
      <div class="filter-controls">
        <form-item label="关键字搜索">
          <el-input
            v-model="searchData.keywords"
            placeholder="请输入类型编号、名称"
            clearable
            @keyup.enter="getData(true)"
          />
        </form-item>
        <template v-if="pageType === 'base'">
          <form-item label="状态">
            <el-select v-model="searchData.status" multiple placeholder="所有" clearable>
              <el-option v-for="item in statusMapping" :key="item.value" :value="item.value" :label="item.label" />
            </el-select>
          </form-item>
          <form-item label="父类">
            <el-select v-model="searchData.parent" multiple placeholder="不限" clearable>
              <el-option v-for="item in parentList" :key="item.value" :value="item.value" :label="item.label" />
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
      <el-table :data="tableData" stripe @selection-change="selectTable" v-loading="loading" v-if="pageType === 'base'">
        <el-table-column type="selection" />
        <el-table-column label="编号" min-width="200">
          <template #default="scope">{{ scope.row.title || "-" }}</template>
        </el-table-column>
        <el-table-column label="资源类型" min-width="200">
          <template #default="scope">{{ scope.row.title || "-" }}</template>
        </el-table-column>
        <el-table-column label="父类" min-width="200">
          <template #default="scope">{{ scope.row.title || "-" }}</template>
        </el-table-column>
        <el-table-column label="关联资源数量" min-width="200">
          <template #default="scope">
            <span class="text-btn" @click="switchPage('/resource/resource-management', { type: scope.row.resourceId })">
              {{ scope.row.title }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <!-- <template #default="scope">
            {{ statusMapping.find((item) => item.value === scope.row.status).label }}
          </template> -->
        </el-table-column>
        <el-table-column fixed="right" width="70">
          <template #header>
            <el-icon class="operation-icon" title="操作">
              <operation />
            </el-icon>
          </template>
          <template #default="scope">
            <el-icon
              class="icon-btn"
              title="停用"
              @click="operate(scope.row.resourceId)"
              v-if="![2, 3].includes(scope.row.status)"
            >
              <close />
            </el-icon>
            <el-icon
              class="icon-btn"
              title="启用"
              @click="operate(scope.row.resourceId)"
              v-if="[2, 3].includes(scope.row.status)"
            >
              <check />
            </el-icon>
            <el-icon class="icon-btn" title="编辑" @click="toEdit(scope.row._id)">
              <edit />
            </el-icon>
          </template>
        </el-table-column>
      </el-table>

      <el-table :data="tableData" stripe v-loading="loading" v-else-if="pageType === 'custom'">
        <el-table-column label="编号" min-width="200">
          <template #default="scope">{{ scope.row.title || "-" }}</template>
        </el-table-column>
        <el-table-column label="资源类型" min-width="200">
          <template #default="scope">{{ scope.row.title || "-" }}</template>
        </el-table-column>
        <el-table-column label="隶属类型" min-width="200">
          <template #default="scope">{{ scope.row.title || "-" }}</template>
        </el-table-column>
        <el-table-column label="关联资源数量" min-width="200">
          <template #default="scope">
            <span class="text-btn" @click="switchPage('/resource/resource-management', { type: scope.row.resourceId })">
              {{ scope.row.title }}
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
import { formatDate } from "../../utils/common";
import { ActivitiesService } from "@/api/request";
import { Operation, Edit, Close, Check } from "@element-plus/icons-vue";
import { reactive, toRefs } from "vue";
import { useMyRouter } from "@/utils/hooks";
import { Activity } from "@/typings/object";
import { ActivityListParams } from "@/typings/params";

export default {
  components: {
    Operation,
    Close,
    Check,
    Edit,
  },

  setup() {
    const { switchPage, openPage } = useMyRouter();
    const assetsData = {
      statusMapping: [
        { value: "Option2", label: "已启用" },
        { value: "Option3", label: "已停用" },
      ],
      parentList: [
        { value: "Option2", label: "无" },
        { value: "Option3", label: "图片" },
        { value: "Option3", label: "音频" },
        { value: "Option4", label: "视频" },
        { value: "Option5", label: "主题" },
      ],
    };
    const data = reactive({
      pageType: "base",
      loading: false,
      tableData: [] as Activity[],
      total: 0,
      selectedData: [] as Activity[],
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

      /** 编辑活动 */
      toEdit(id?: string) {
        switchPage("/resource/edit-type", { id });
      },

      /** 选择表格项 */
      selectTable(selected: Activity[]) {
        data.selectedData = selected;
      },

      /** 封禁操作 */
      operate(resourceId?: string) {
        console.error(resourceId);
      },
    };

    methods.getData(true);

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
