<!-- 站内广告管理 -->
<template>
  <list-template>
    <template v-slot:barRight>
      <el-button type="primary" @click="toEdit()">创建广告</el-button>
    </template>

    <template v-slot:filterBar>
      <div class="filter-controls">
        <form-item label="关键字搜索">
          <el-input v-model="searchData.keywords" placeholder="请输入广告名称" clearable @keyup.enter="getData(true)" />
        </form-item>
        <form-item label="位置">
          <el-select v-model="searchData.place">
            <el-option v-for="item in placeOptions" :key="item.value" :value="item.value" :label="item.label" />
          </el-select>
        </form-item>
        <form-item label="状态">
          <el-select v-model="searchData.status" placeholder="请选择状态" clearable>
            <el-option v-for="item in statusOptions" :key="item.value" :value="item.value" :label="item.label" />
          </el-select>
        </form-item>
      </div>
      <div class="filter-btns">
        <el-button type="primary" @click="getData(true)">搜索</el-button>
        <el-button @click="clearSearch()">重置</el-button>
      </div>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column>
          <template #default="scope">{{ searchData.limit * (searchData.currentPage - 1) + scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column label="广告名称" min-width="200">
          <template #default="scope">{{ scope.row.title || "-" }}</template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="scope">
            {{ statusOptions.find((item) => item.value === scope.row.status)!.label }}
          </template>
        </el-table-column>
        <el-table-column label="曝光量">
          <template #default="scope">{{ scope.row.ev || "-" }}</template>
        </el-table-column>
        <el-table-column label="点击量">
          <template #default="scope">{{ scope.row.pv || "-" }}</template>
        </el-table-column>
        <el-table-column label="点击率">
          <template #default="scope">{{ getPercents(scope.row.cvr) }}</template>
        </el-table-column>
        <el-table-column label="广告图片" min-width="150">
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
        <el-table-column label="跳转页" min-width="300">
          <template #default="scope">
            <span
              class="text-btn"
              @click="openPage(`${consoleUrl}/activity/${scope.row.linkActivityId}`)"
              v-if="scope.row.linkActivityId"
            >
              {{ scope.row.linkActivityTitle }}
            </span>
            <span class="text-btn" @click="openPage(scope.row.link)" v-else>
              {{ scope.row.link }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="投放时间" min-width="300">
          <template #default="scope">
            <span v-if="scope.row.persist">长期投放</span>
            <span v-else>
              {{ scope.row.startTime ? formatDate(scope.row.startTime) : "-" }} 至
              {{ scope.row.limitTime ? formatDate(scope.row.limitTime) : "-" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="展示排序" width="100">
          <template #default="scope">
            <el-input-number
              style="width: 70px"
              v-model="scope.row.priority"
              :min="1"
              :controls="false"
              @blur="changePriority(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column fixed="right" width="40">
          <template #default="scope">
            <i class="icon-btn admin icon-edit" title="编辑" @click="toEdit(scope.row._id)" />
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
import { reactive, toRefs } from "vue";
import { useMyRouter } from "@/utils/hooks";
import { AdsListParams } from "@/typings/params";
import { Advertisement } from "@/typings/object";

export default {
  setup() {
    const { switchPage, openPage } = useMyRouter();
    const assetsData = {
      placeOptions: [
        { value: 1, label: "首页，顶部公告栏" },
        { value: 2, label: "首页，右侧浮窗" },
        { value: 3, label: "概览页，右侧Banner" },
        { value: 4, label: "发现页，顶部Banner" },
      ],
      statusOptions: [
        { value: 1, label: "已排期" },
        { value: 2, label: "投放中" },
        { value: 3, label: "已结束" },
        { value: 4, label: "已停用" },
      ],
      consoleUrl: (process.env.VUE_APP_BASE_API as string).replace("qi", "www"),
    };
    const data = reactive({
      loading: false,
      tableData: [] as Advertisement[],
      total: 0,
      searchData: { currentPage: 1, limit: 20, place: 1 } as AdsListParams,
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        data.tableData = [];
        data.loading = true;
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        const result = await ActivitiesService.getAdsList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { ads, num } = result.data.data;

          if (ads.length === 0) {
            data.total = 0;
            data.loading = false;
            return;
          }

          data.tableData = ads;
          data.total = num;
          data.loading = false;
        }
      },

      /** 重置 */
      clearSearch() {
        data.searchData = {
          currentPage: 1,
          limit: 20,
          place: 1,
        };
        this.getData(true);
      },

      /** 切换表格页码 */
      changePage(value: number) {
        data.searchData.currentPage = value;
        this.getData();
      },

      /** 编辑广告 */
      toEdit(id?: string) {
        switchPage("/operating/edit-advertisement", { id });
      },

      /** 获取百分比 */
      getPercents(ratio: number) {
        if (!ratio) return "-";

        return (ratio * 100).toFixed(2) + "%";
      },

      /** 修改展示排序 */
      async changePriority(item: Advertisement) {
        const { _id, priority } = item;

        const result = await ActivitiesService.editAdsSort({ _id, priority });
        if (result.data.errcode === 0) {
          this.getData();
        }
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
