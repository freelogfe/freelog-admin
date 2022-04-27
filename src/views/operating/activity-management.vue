<!-- 活动管理 -->
<template>
  <list-template>
    <template v-slot:barRight>
      <el-button type="primary" @click="toEdit()">发布活动</el-button>
    </template>

    <template v-slot:filterBar>
      <form-item label="关键字搜索">
        <el-input v-model="searchData.keywords" placeholder="请输入活动名称" clearable @keyup.enter="getData(true)" />
      </form-item>
      <form-item label="状态">
        <el-select v-model="searchData.status" placeholder="请选择状态" clearable>
          <el-option v-for="item in statusOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </form-item>
      <form-item>
        <el-button type="primary" @click="getData(true)">搜索</el-button>
        <el-button @click="clearSearch()">重置</el-button>
      </form-item>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column label="活动名称" min-width="200">
          <template #default="scope">{{ scope.row.title || "-" }}</template>
        </el-table-column>
        <el-table-column label="海报" width="150">
          <template #default="scope">
            <el-image
              class="cover-image"
              :src="scope.row.cover"
              :preview-src-list="[scope.row.cover]"
              preview-teleported
              hide-on-click-modal
              v-if="scope.row.cover"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="活动时间" min-width="300">
          <template #default="scope">
            <span v-if="scope.row.persist">长期活动</span>
            <span v-else>
              {{ scope.row.startTime ? formatDate(scope.row.startTime) : "-" }} 至
              {{ scope.row.limitTime ? formatDate(scope.row.limitTime) : "-" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="scope">
            {{ getStatus(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column label="发布时间" min-width="160">
          <template #default="scope">
            <span :style="{ color: getStatus(scope.row) === '未发布' ? 'red' : '#333' }" v-if="scope.row.publishDate">{{
              formatDate(scope.row.publishDate)
            }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" width="70">
          <template #header>
            <el-icon class="operation-icon" title="操作">
              <operation />
            </el-icon>
          </template>
          <template #default="scope">
            <el-icon class="icon-btn" title="查看活动" @click="openPage(scope.row.link)" v-if="scope.row.link">
              <connection />
            </el-icon>
            <el-icon class="icon-btn" title="编辑" @click="toEdit(scope.row._id)">
              <edit />
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
import { Operation, Edit, Connection } from "@element-plus/icons-vue";
import { reactive, toRefs } from "vue";
import { useMyRouter } from "@/utils/hooks";
import { Activity } from "@/typings/object";
import { ActivityListParams } from "@/typings/params";

export default {
  components: {
    Operation,
    Edit,
    Connection,
  },

  setup() {
    const { switchPage, openPage } = useMyRouter();
    const assetsData = {
      statusOptions: [
        { value: 1, label: "未发布" },
        { value: 2, label: "已暂停" },
        { value: 3, label: "未开始" },
        { value: 4, label: "进行中" },
        { value: 5, label: "已结束" },
        { value: 6, label: "草稿" },
      ],
      statusMapping: [
        { value: 1, label: "正常" },
        { value: 2, label: "暂停" },
      ],
    };
    const data = reactive({
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

      /** 获取活动状态 */
      getStatus(item: Activity) {
        const now = new Date().getTime();
        const { status, isDraft, persist, publishDate, startTime, limitTime } = item;
        const publishTimestamp = new Date(publishDate).getTime();
        const startTimestamp = new Date(startTime).getTime();
        const limitTimestamp = new Date(limitTime).getTime();
        if (status === 2) {
          return "已暂停";
        } else if (isDraft) {
          return "草稿";
        } else if (now < publishTimestamp) {
          return "未发布";
        } else if (now <= startTimestamp) {
          return "未开始";
        } else if (now < limitTimestamp || persist) {
          return "进行中";
        } else if (limitTimestamp <= now) {
          return "已结束";
        }
      },

      /** 编辑活动 */
      toEdit(id?: string) {
        switchPage("/operating/edit-activity", { id });
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
