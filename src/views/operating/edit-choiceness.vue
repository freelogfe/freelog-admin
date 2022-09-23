<!-- 编辑精选 -->
<template>
  <list-template>
    <template v-slot:barLeft v-if="selectedData.length">
      <el-button type="primary" @click="operateChoiceness('PUT')">移出编辑精选</el-button>
    </template>

    <template v-slot:barRight>
      <el-button type="primary" @click="openResourceList()">添加资源</el-button>
    </template>

    <template v-slot:filterBar>
      <div class="filter-controls">
        <form-item label="资源作者">
          <el-input
            v-model="searchData.authorName"
            placeholder="请输入资源发布者的用户名"
            clearable
            @keyup.enter="getData(true)"
          />
        </form-item>
        <form-item label="资源名">
          <el-input
            v-model="searchData.resourceName"
            placeholder="请输入资源名"
            clearable
            @keyup.enter="getData(true)"
          />
        </form-item>
        <form-item label="类型">
          <el-cascader
            v-model="searchData.type"
            placeholder="请选择类型"
            :options="resourceTypeList"
            :props="{ checkStrictly: true, label: 'value' }"
            clearable
          />
        </form-item>
        <form-item label="状态">
          <el-select v-model="searchData.status" placeholder="请选择状态" clearable>
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
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
        <el-table-column label="资源" min-width="250">
          <template #default="scope">
            <div class="resource-name">
              <span class="text-btn" @click="switchPage('/user/user-management', { userId: scope.row.userId })">
                {{ scope.row.username }}
              </span>
              <span class="divider">/</span>
              <span class="text-btn" @click="openResourceDetail(scope.row.resourceId)">
                {{ scope.row.resourceNameAbbreviation }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="封面" min-width="120">
          <template #default="scope">
            <el-image
              class="cover-image"
              :src="scope.row.coverImages[0]"
              :preview-src-list="scope.row.coverImages"
              preview-teleported
              hide-on-click-modal
            />
          </template>
        </el-table-column>
        <el-table-column label="类型" min-width="150" show-overflow-tooltip>
          <template #default="scope">{{ scope.row.resourceType.join("/") }}</template>
        </el-table-column>
        <el-table-column label="需方合约数" min-width="120" align="right">
          <template #default="scope">
            <span
              class="text-btn"
              @click="switchPage('/contract/contract-management', { licensorId: scope.row.resourceId })"
            >
              {{ scope.row.signCount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column property="collectCount" label="收藏数" align="right" min-width="120" />
        <el-table-column label="最新版本" min-width="100">
          <template #default="scope">
            <div class="table-cell-item">
              <span>{{ scope.row.latestVersion || "-" }}</span>
              <el-icon
                class="icon-btn"
                title="查看历史记录"
                @click="viewHistory(scope.row)"
                v-if="scope.row.resourceVersions.length"
              >
                <clock />
              </el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column property="createDate" label="创建时间" min-width="160">
          <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
        </el-table-column>
        <el-table-column label="资源状态">
          <template #default="scope">
            <el-tooltip
              effect="dark"
              :content="`${scope.row.reason}${scope.row.remark ? '（' + scope.row.remark + '）' : ''}`"
              placement="top"
              v-if="[2, 3].includes(scope.row.status)"
            >
              {{ statusMapping.find((item: any) => item.value === scope.row.status).label }}
            </el-tooltip>
            <span v-else>{{ statusMapping.find((item: any) => item.value === scope.row.status).label }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" width="100">
          <template #header>
            <el-icon class="operation-icon" title="操作">
              <operation />
            </el-icon>
          </template>
          <template #default="scope">
            <el-icon
              class="icon-btn"
              title="查看授权策略"
              @click="viewPolicy(scope.row)"
              v-if="scope.row.policies.length"
            >
              <grid />
            </el-icon>
            <el-icon
              class="icon-btn"
              title="查看更多信息"
              @click="switchPage('/resource/resource-management', { resourceId: scope.row.resourceId })"
            >
              <document />
            </el-icon>
            <el-icon
              class="icon-btn"
              title="移除"
              @click="operateChoiceness('PUT', scope.row.resourceId)"
              v-if="![2, 3].includes(scope.row.status)"
            >
              <close />
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

  <el-dialog v-model="policyPopupShow" title="授权策略" width="80%">
    <div class="policy-box">
      <div class="policy-item" v-for="item in policyData" :key="item.policyId">
        <div class="policy-top">
          <div class="policy-name" :title="item.policyName">
            {{ item.policyName }}
          </div>
          <div class="policy-status" :class="{ active: item.status === 1 }">
            <span v-if="item.status === 1">已启用</span>
            <span v-if="item.status === 0">未启用</span>
          </div>
        </div>
        <div class="policy-code" v-html="item.policyText"></div>
      </div>
    </div>
  </el-dialog>

  <el-dialog v-model="resourcePopupShow" title="添加资源进入编辑精选" width="1000px" @close="closeResourcePopup()">
    <div class="filter-bar" v-if="!resourceData.showSelected">
      <form-item label="关键字搜索">
        <el-input
          v-model="resourceSearchData.keywords"
          placeholder="请输入资源名"
          clearable
          @keyup.enter="getResourceList(true)"
        />
      </form-item>
      <form-item>
        <el-button type="primary" @click="getResourceList(true)">搜索</el-button>
      </form-item>
    </div>

    <el-table
      ref="tableRef"
      :data="resourceData.showSelected ? selectedResourceData : resourceData.list"
      stripe
      @select="selectResources"
      @select-all="selectAllResources"
      border
      height="400"
    >
      <el-table-column type="selection" align="center" />
      <el-table-column label="资源" min-width="250">
        <template #default="scope">
          <div class="resource-name">
            <span class="text-btn" @click="switchPage('/user/user-management', { userId: scope.row.userId })">
              {{ scope.row.username }}
            </span>
            <span class="divider">/</span>
            <span class="text-btn" @click="openResourceDetail(scope.row.resourceId)">
              {{ scope.row.resourceNameAbbreviation }}
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="封面" min-width="120">
        <template #default="scope">
          <el-image
            class="cover-image"
            :src="scope.row.coverImages[0]"
            :preview-src-list="scope.row.coverImages"
            preview-teleported
            hide-on-click-modal
          />
        </template>
      </el-table-column>
      <el-table-column label="类型" min-width="150" show-overflow-tooltip>
        <template #default="scope">{{ scope.row.resourceType.join("/") }}</template>
      </el-table-column>
      <el-table-column label="最新版本" min-width="100">
        <template #default="scope">
          <div class="table-cell-item">
            <span>{{ scope.row.latestVersion || "-" }}</span>
            <el-icon
              class="icon-btn"
              title="查看历史记录"
              @click="viewHistory(scope.row)"
              v-if="scope.row.resourceVersions.length"
            >
              <clock />
            </el-icon>
          </div>
        </template>
      </el-table-column>
      <el-table-column property="createDate" label="创建时间" min-width="160">
        <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
      </el-table-column>
      <el-table-column label="资源状态">
        <template #default="scope">
          <el-tooltip
            effect="dark"
            :content="`${scope.row.reason}${scope.row.remark ? '（' + scope.row.remark + '）' : ''}`"
            placement="top"
            v-if="[2, 3].includes(scope.row.status)"
          >
            {{ statusMapping.find((item: any) => item.value === scope.row.status).label }}
          </el-tooltip>
          <span v-else>{{ statusMapping.find((item: any) => item.value === scope.row.status).label }}</span>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination-box">
      <div class="selected-tip">
        <template v-if="selectedResourceData.length">
          <div>已选{{ selectedResourceData.length }}项</div>
          <div class="text-btn" @click="switchShowSelected()">
            {{ resourceData.showSelected ? "返回" : "查看所有已选" }}
          </div>
        </template>
      </div>

      <el-pagination
        layout="total, prev, pager, next, jumper"
        v-model:currentPage="resourceSearchData.currentPage"
        :total="resourceData.showSelected ? selectedResourceData.length : resourceData.total"
        :page-size="resourceSearchData.limit"
        @current-change="changeResourcePage($event)"
        v-if="!resourceData.showSelected"
      />
    </div>
    <div class="btns-area">
      <el-button @click="closeResourcePopup()">取消</el-button>
      <el-button type="primary" @click="operateChoiceness('POST')">保存</el-button>
    </div>
  </el-dialog>

  <el-dialog v-model="versionData.versionPopupShow" title="版本历史记录" width="840px" destroy-on-close>
    <div class="version-history">
      <el-scrollbar class="side-bar">
        <div
          class="version-item"
          :class="{ active: versionData.activeIndex === index }"
          v-for="(item, index) in versionData.versionList"
          :key="item.versionId"
          @click="getVersionFile(item)"
        >
          <div class="version">
            <div class="version-name" :title="item.version">{{ item.version }}</div>
            <a class="icon-btn" title="下载" :href="getFileUrl(item.versionId)" download @click.stop>
              <el-icon><download /></el-icon>
            </a>
          </div>
          <div class="create-date">{{ relativeTime(item.createDate) }}</div>
        </div>
      </el-scrollbar>
      <el-scrollbar
        class="version-content"
        v-loading="versionData.loading"
        v-if="currentVersionData.mime && currentVersionData.mime.startsWith('text')"
      >
        <my-markdown :data="versionData" @done="versionData.loading = false" />
      </el-scrollbar>
      <div class="version-content media" v-loading="versionData.loading" v-else>
        <el-image
          style="width: 570px; height: 570px"
          fit="contain"
          :src="currentVersionData.content"
          :preview-src-list="[currentVersionData.content]"
          preview-teleported
          hide-on-click-modal
          v-if="currentVersionData.mime && currentVersionData.mime.startsWith('image')"
        />
        <video
          style="width: 100%"
          :src="currentVersionData.content"
          controls
          v-else-if="currentVersionData.mime && currentVersionData.mime.startsWith('video')"
        />
        <audio
          :src="currentVersionData.content"
          controls
          v-else-if="currentVersionData.mime && currentVersionData.mime.startsWith('audio')"
        />
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { formatDate, relativeTime } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ResourceService, ContractsService, ActivitiesService } from "@/api/request";
import { dateRangeShortcuts, resourceTypeList } from "@/assets/data";
import { Operation, Close, Document, Download, Grid, Clock } from "@element-plus/icons-vue";
import { reactive, toRefs, computed, defineAsyncComponent, ref, nextTick } from "vue";
import { OperateChoicenessParams, Policy, Resource, ResourceVersion } from "@/typings/object";
import { ResourceListParams } from "@/typings/params";
import { ElMessageBox, ElTable } from "element-plus";
import { ElMessage } from "element-plus/lib/components";

/** 资源列表参数 */
export interface MyResourceListParams extends ResourceListParams {
  createDate?: string[];
  selectedTags?: string[];
  type?: string[];
}

export default {
  components: {
    "my-markdown": defineAsyncComponent(() => import("@/components/markdown.vue")),
    Operation,
    Close,
    Grid,
    Document,
    Download,
    Clock,
  },

  setup() {
    const { query, switchPage, openPage } = useMyRouter();
    const tableRef = ref<InstanceType<typeof ElTable>>();
    const assetsData = {
      statusOptions: [
        { value: "0", label: "下线" },
        { value: "1", label: "上线" },
        { value: "2,3", label: "禁用" },
      ],
      statusMapping: [
        { value: 0, label: "下线" },
        { value: 1, label: "上线" },
        { value: 2, label: "禁用" },
        { value: 3, label: "禁用" },
      ],
    };
    const data = reactive({
      loading: false,
      tableData: [] as Resource[],
      total: 0,
      selectedData: [] as Resource[],
      searchData: { currentPage: 1, limit: 20 } as MyResourceListParams,
      versionData: {
        resourceId: "",
        activeIndex: 0,
        versionList: [] as ResourceVersion[],
        versionPopupShow: false,
        loading: false,
      },
      policyData: [] as Policy[],
      operateData: { type: 1, resourceIds: [] } as OperateChoicenessParams,
      resourceSearchData: { currentPage: 1, limit: 20 } as ResourceListParams,
      resourceData: {
        keywords: "",
        list: [] as Resource[],
        total: 0,
        showSelected: false,
      },
      selectedResourceData: [] as Resource[],
      policyPopupShow: false,
      resourcePopupShow: false,
    });
    const currentVersionData = computed(() => {
      const { versionList, activeIndex } = data.versionData;
      return versionList[activeIndex];
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        data.tableData = [];
        data.loading = true;
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit, type } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        if (type) {
          data.searchData.resourceType = type ? type[type.length - 1] : "";
        } else {
          delete data.searchData.resourceType;
        }
        const result = await ActivitiesService.getChoicenessList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data;

          if (dataList.length === 0) {
            data.loading = false;
            return;
          }

          const ids = dataList
            .map((item: Resource) => {
              return item.resourceId;
            })
            .join();
          const results = await Promise.all([
            ContractsService.getSubjectSignCount({
              subjectIds: ids,
              subjectType: 1,
            }),
            ResourceService.getResourcesCollectCount({ resourceIds: ids }),
          ]);
          dataList.forEach((resource: Resource) => {
            const { resourceId } = resource;
            resource.resourceNameAbbreviation = resource.resourceName.split("/")[1];
            resource.resourceVersions.reverse();
            resource.signCount = results[0].data.data.find(
              (item: { subjectId: string; count: number }) => item.subjectId === resourceId
            ).count;
            resource.collectCount = results[1].data.data.find(
              (item: { resourceId: string; count: number }) => item.resourceId === resourceId
            ).count;
          });
          const bannedIds = dataList
            .filter((item: Resource) => [2, 3].includes(item.status))
            .map((item: Resource) => {
              return item.resourceId;
            })
            .join(",");

          if (bannedIds) {
            const bannedResult = await ResourceService.getResourceRecordList({ resourceIds: bannedIds });
            bannedResult.data.data.forEach(
              (item: { resourceId: string; records: { reason: string; remark: string }[] }) => {
                const resource: Resource = dataList.find(
                  (resource: Resource) => resource.resourceId === item.resourceId
                );
                resource.reason = item.records[0].reason;
                resource.remark = item.records[0].remark;
              }
            );
          }

          data.tableData = dataList;
          data.total = totalItem;
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

      /** 打开资源详情 */
      openResourceDetail(resourceId: string) {
        const domain = (process.env.VUE_APP_BASE_API as string).replace("qi", "console");
        const url = `${domain}/resource/details/${resourceId}`;
        openPage(url);
      },

      /** 打开资源列表 */
      openResourceList() {
        data.resourcePopupShow = true;
        this.getResourceList(true);
      },

      /** 获取资源列表 */
      async getResourceList(init = false) {
        if (init) data.resourceSearchData.currentPage = 1;
        const { currentPage, limit } = data.resourceSearchData;
        data.resourceSearchData.skip = (currentPage - 1) * limit;
        const result = await ResourceService.getResourceList(data.resourceSearchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data;
          dataList.forEach((resource: Resource) => {
            resource.resourceNameAbbreviation = resource.resourceName.split("/")[1];
            resource.resourceVersions.reverse();
          });
          data.resourceData = {
            keywords: data.resourceData.keywords,
            list: dataList,
            total: totalItem,
            showSelected: false,
          };
          this.updateResourceSelections();
        }
      },

      /** 更新资源列表选中状态 */
      updateResourceSelections() {
        const list = data.resourceData.showSelected ? data.selectedResourceData : data.resourceData.list;
        list.forEach((row) => {
          const index = data.selectedResourceData.findIndex((item) => item.resourceId === row.resourceId);
          nextTick(() => {
            tableRef.value!.toggleRowSelection(row, index !== -1);
          });
        });
      },

      /** 切换资源表格页码 */
      changeResourcePage(value: number) {
        data.resourceSearchData.currentPage = value;
        this.getResourceList();
      },

      /** 关闭资源列表弹窗 */
      closeResourcePopup() {
        tableRef.value!.clearSelection();
        data.resourcePopupShow = false;
        data.selectedResourceData = [];
      },

      /** 切换资源列表显示内容 */
      switchShowSelected() {
        data.resourceData.showSelected = !data.resourceData.showSelected;
        this.updateResourceSelections();
      },

      /** 选择资源表格项 */
      selectResources(selected: Resource[], row: Resource) {
        const index = data.selectedResourceData.findIndex((item) => item.resourceId === row.resourceId);
        if (index === -1) {
          data.selectedResourceData.push(row);
        } else {
          data.selectedResourceData.splice(index, 1);
        }
      },

      /** 全选资源表格项 */
      selectAllResources(selected: Resource[]) {
        const all = selected.length !== 0;
        data.resourceData.list.forEach((row) => {
          const index = data.selectedResourceData.findIndex(
            (selectedItem) => selectedItem.resourceId === row.resourceId
          );
          if (all && index === -1) {
            data.selectedResourceData.push(row);
          } else if (!all && index !== -1) {
            data.selectedResourceData.splice(index, 1);
          }
        });
      },

      /** 选择表格项 */
      selectTable(selected: Resource[]) {
        data.selectedData = selected;
      },

      /** 查看授权策略 */
      viewPolicy(resource: Resource) {
        data.policyPopupShow = true;
        data.policyData = resource.policies;
      },

      /** 添加/移除编辑精选 */
      operateChoiceness(method: "POST" | "PUT", resourceId?: string) {
        ElMessageBox.confirm(
          `确定要将${resourceId ? "此" : "选中"}资源${method === "POST" ? "添加" : "移除"}编辑精选吗？`,
          method === "POST" ? "添加" : "移除",
          {
            confirmButtonText: method === "POST" ? "添加" : "移除",
            cancelButtonText: "取消",
          }
        ).then(() => {
          const selectedList = method === "POST" ? data.selectedResourceData : data.selectedData;
          data.operateData.resourceIds = resourceId ? [resourceId] : selectedList.map((item) => item.resourceId);
          this.operateConfirm(method);
        });
      },

      /** 操作编辑精选 */
      async operateConfirm(method: "POST" | "PUT") {
        const result = await ActivitiesService.operateChoiceness(data.operateData, method);
        const { errcode, msg } = result.data;
        if (errcode === 0) {
          ElMessage.success(`${method === "POST" ? "添加" : "移除"}成功`);
          this.closeResourcePopup();
          this.getData();
        } else {
          ElMessage.error(msg);
        }
      },

      /** 查看历史版本 */
      viewHistory(resource: Resource) {
        const { resourceId, resourceVersions } = resource;
        data.versionData.resourceId = resourceId;
        data.versionData.versionList = resourceVersions;
        data.versionData.versionPopupShow = true;
        this.getVersionFile(data.versionData.versionList[0]);
      },

      /** 获取响应版本文件内容 */
      async getVersionFile(version: ResourceVersion) {
        const { versionId } = version;
        data.versionData.activeIndex = data.versionData.versionList.findIndex((item) => item.versionId === versionId);
        if (version.content) return;

        data.versionData.loading = true;
        const result = await ResourceService.getResourceFile(versionId);
        version.mime = result.headers["content-type"];
        if (version.mime.startsWith("image") || version.mime.startsWith("video") || version.mime.startsWith("audio")) {
          // 媒体资源
          version.content = this.getFileUrl(versionId);
          data.versionData.loading = false;
        } else {
          version.content = result.data;
        }
      },

      /** 获取文件路径 */
      getFileUrl(versionId: string) {
        return `${
          process.env.NODE_ENV === "development" ? "/api" : process.env.VUE_APP_BASE_API
        }/v2/resources/versions/${versionId}/internalClientDownload`;
      },
    };

    data.searchData.keywords = query.value.keywords;
    data.searchData.userId = query.value.userId;
    data.searchData.resourceId = query.value.resourceId;
    if (query.value.tag) data.searchData.selectedTags = [query.value.tag];
    methods.getData(true);

    return {
      resourceTypeList,
      dateRangeShortcuts,
      tableRef,
      ...assetsData,
      ...toRefs(data),
      currentVersionData,
      ...methods,
      formatDate,
      switchPage,
      relativeTime,
    };
  },
};
</script>

<style lang="scss" scoped>
.resource-name {
  word-break: break-all;

  .divider {
    margin: 0 3px;
  }
}

.policy-box {
  width: 100%;
  max-height: 600px;
  overflow-y: auto;
  padding: 10px;
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;

  .policy-item {
    border: 1px solid #ddd;
    border-radius: 6px;
    width: 32%;
    margin-right: 2%;
    padding: 15px;
    box-sizing: border-box;
    transition: all 0.2s linear;

    &:hover {
      box-shadow: 0 0 10px #999;
    }

    &:nth-child(3n) {
      margin-right: 0;
    }

    &:nth-child(n + 4) {
      margin-top: 15px;
    }

    .policy-top {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .policy-name {
        flex: 1;
        width: 0;
        font-size: 16px;
        font-weight: bold;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .policy-status {
        color: #666;
        margin-left: 20px;

        &.active {
          color: #67c23a;
        }
      }
    }

    .policy-code {
      margin-top: 15px;
      white-space: pre-wrap;
    }
  }
}

.version-history {
  display: flex;
  height: 600px;

  .side-bar {
    flex-shrink: 0;
    width: 200px;

    .version-item {
      width: 100%;
      padding: 10px 20px;
      box-sizing: border-box;
      border-radius: 6px 0 0 6px;
      cursor: pointer;
      transition: all 0.2s linear;

      &:hover {
        background-color: #fafafa;

        .icon-btn {
          opacity: 1 !important;
        }
      }

      &.active {
        background-color: #f5f5f5;
      }

      .version {
        display: flex;
        align-items: center;

        .version-name {
          flex: 1;
          width: 0;
          font-size: 16px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .icon-btn {
          opacity: 0;
        }
      }

      .create-date {
        font-size: 12px;
        color: #666;
        margin-top: 5px;
      }
    }
  }

  .version-content {
    flex-shrink: 0;
    width: 600px;
    height: 600px;
    padding: 10px;
    box-sizing: border-box;
    border-radius: 0 6px 6px 6px;
    background-color: #f5f5f5;

    &.media {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.filter-bar {
  display: flex;
  align-items: center;
}

.pagination-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;

  .selected-tip {
    display: flex;
    align-items: center;

    .text-btn {
      margin-left: 10px;
    }
  }
}

.btns-area {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
