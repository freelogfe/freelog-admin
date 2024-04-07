<!-- 示例节点管理 -->
<template>
  <list-template>
    <template v-slot:barLeft v-if="selectedData.length">
      <el-button type="primary" @click="removeSampleNode()">移除示例节点</el-button>
      <span class="selected-tip">已选中{{ selectedData.length }}条</span>
    </template>

    <template v-slot:barRight>
      <el-button type="primary" @click="openNodeListPopup()">添加示例节点</el-button>
    </template>

    <template v-slot:filterBar>
      <div class="filter-controls">
        <form-item label="关键字搜索">
          <el-input
            style="width: 300px"
            v-model="searchData.keywords"
            placeholder="请输入节点标题、授权标识、地址"
            clearable
            @keyup.enter="getData(true)"
          />
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
      <el-table :data="tableData" stripe @selection-change="selectTable" v-loading="loading">
        <el-table-column type="selection" />
        <el-table-column label="节点标题" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <span class="text-btn" @click="openNode(scope.row.nodeDomain)">
              {{ scope.row.nodeTitle || scope.row.nodeName }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="封面" min-width="120">
          <template #default="scope">
            <el-image
              class="cover-image"
              :src="scope.row.nodeLogo"
              :preview-src-list="[scope.row.nodeLogo]"
              preview-teleported
              hide-on-click-modal
            />
          </template>
        </el-table-column>
        <el-table-column label="地址" min-width="300" show-overflow-tooltip>
          <template #default="scope">
            <span class="text-btn" @click="openNode(scope.row.nodeDomain)">
              {{ domain.replace("api", scope.row.nodeDomain) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="简介" min-width="300">
          <template #default="scope">
            <div class="intro" :title="scope.row.nodeShortDescription">{{ scope.row.nodeShortDescription }}</div>
          </template>
        </el-table-column>
        <el-table-column label="用户" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <span class="text-btn" @click="openPage('/user/user-management', { userId: scope.row.ownerUserId })">
              {{ scope.row.ownerUserName }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="运营展品数" min-width="120" align="right">
          <template #default="scope">
            <span class="text-btn" @click="openPage('/node/exhibit-management', { nodeId: scope.row.nodeId })">
              {{ scope.row.onlineExhibitCount }}/{{ scope.row.exhibitCount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column property="createDate" label="创建时间" min-width="160">
          <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="scope">
            <el-tooltip
              effect="dark"
              :content="`${scope.row.reason}${scope.row.remark ? '（' + scope.row.remark + '）' : ''}`"
              placement="top"
              v-if="[4, 5, 6, 12].includes(scope.row.status)"
            >
              {{ mappingMatching(statusMapping, scope.row.status) }}
            </el-tooltip>
            <span v-else>{{ mappingMatching(statusMapping, scope.row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" width="70">
          <template #default="scope">
            <i
              class="icon-btn admin icon-detail"
              title="查看更多信息"
              @click="openPage('/node/node-management', { nodeId: scope.row.nodeId })"
            />
            <i class="icon-btn admin icon-delete" title="移除" @click="removeSampleNode(scope.row.nodeId)" />
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

  <el-dialog v-model="nodePopupShow" title="添加示例节点" width="1000px" @close="closeNodePopup()">
    <div class="filter-bar" v-if="!popupData.showSelected">
      <form-item label="关键字搜索">
        <el-input
          style="width: 300px"
          v-model="popupSearchData.keywords"
          placeholder="请输入节点标题、授权标识、地址"
          clearable
          @keyup.enter="getPopupNodeList(true)"
        />
      </form-item>
      <form-item>
        <el-button type="primary" @click="getPopupNodeList(true)">搜索</el-button>
      </form-item>
    </div>

    <el-table
      ref="tableRef"
      :data="popupData.showSelected ? selectedpopupData : popupData.list"
      stripe
      @select="selectResources"
      @select-all="selectAllResources"
      border
      height="400"
    >
      <el-table-column type="selection" align="center" />
      <el-table-column label="节点标题" min-width="200" show-overflow-tooltip>
        <template #default="scope">
          <span class="text-btn" @click="openNode(scope.row.nodeDomain)">
            {{ scope.row.nodeTitle || scope.row.nodeName }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="封面" min-width="120">
        <template #default="scope">
          <el-image
            class="cover-image"
            :src="scope.row.nodeLogo"
            :preview-src-list="[scope.row.nodeLogo]"
            preview-teleported
            hide-on-click-modal
          />
        </template>
      </el-table-column>
      <el-table-column label="地址" min-width="300" show-overflow-tooltip>
        <template #default="scope">
          <span class="text-btn" @click="openNode(scope.row.nodeDomain)">
            {{ domain.replace("api", scope.row.nodeDomain) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="用户" min-width="200" show-overflow-tooltip>
        <template #default="scope">
          <span class="text-btn" @click="openPage('/user/user-management', { userId: scope.row.ownerUserId })">
            {{ scope.row.ownerUserName }}
          </span>
        </template>
      </el-table-column>
      <el-table-column property="createDate" label="创建时间" min-width="160">
        <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
      </el-table-column>
      <el-table-column label="状态">
        <template #default="scope">
          <el-tooltip
            effect="dark"
            :content="`${scope.row.reason}${scope.row.remark ? '（' + scope.row.remark + '）' : ''}`"
            placement="top"
            v-if="[4, 5, 6, 12].includes(scope.row.status)"
          >
            {{ mappingMatching(statusMapping, scope.row.status) }}
          </el-tooltip>
          <span v-else>{{ mappingMatching(statusMapping, scope.row.status) }}</span>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination-box">
      <div class="selected-tip">
        <template v-if="selectedpopupData.length">
          <div>已选{{ selectedpopupData.length }}项</div>
          <div class="text-btn" @click="switchShowSelected()">
            {{ popupData.showSelected ? "返回" : "查看所有已选" }}
          </div>
        </template>
      </div>

      <el-pagination
        layout="total, prev, pager, next, jumper"
        v-model:currentPage="popupSearchData.currentPage"
        :total="popupData.showSelected ? selectedpopupData.length : popupData.total"
        :page-size="popupSearchData.limit"
        @current-change="changePopupPage($event)"
        v-if="!popupData.showSelected"
      />
    </div>
    <div class="btns-area">
      <el-button @click="closeNodePopup()">取消</el-button>
      <el-button type="primary" @click="addSampleNode()">保存</el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { nextTick, reactive, ref, toRefs } from "vue";
import { formatDate, mappingMatching, relativeTime } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage, ElMessageBox, ElTable } from "element-plus";
import { NodeService } from "@/api/request";
import { dateRangeShortcuts } from "@/assets/data";
import { Node } from "@/typings/object";
import { NodeListParams, SetNodeTagParams } from "@/typings/params";

/** 节点列表参数 */
export interface MyNodeListParams extends NodeListParams {
  selectedTags?: string[];
  createDate?: string[];
}

/** 设置节点标签参数 */
export interface MySetNodeTagParams extends SetNodeTagParams {
  nodes: Node[];
  tags: string[];
  newTag?: "";
}

export default {
  setup() {
    const { openPage } = useMyRouter();
    const tableRef = ref<InstanceType<typeof ElTable>>();
    const assetsData = {
      statusOptions: [
        { value: 1, label: "公开" },
        { value: 2, label: "私密" },
        { value: 4, label: "封停" },
        { value: 8, label: "暂停运营" },
      ],
      statusMapping: [
        { value: 1, label: "公开" },
        { value: 2, label: "私密" },
        { value: 4, label: "封停" },
        { value: 5, label: "封停" },
        { value: 6, label: "封停" },
        { value: 8, label: "暂停运营" },
        { value: 12, label: "封停" },
      ],
      domain: process.env.VUE_APP_BASE_API as string,
    };
    const data = reactive({
      loading: false,
      tableData: [] as Node[],
      total: 0,
      selectedData: [] as Node[],
      searchData: { currentPage: 1, limit: 20 } as MyNodeListParams,
      setTagData: {} as MySetNodeTagParams,
      nodePopupShow: false,
      popupSearchData: { currentPage: 1, limit: 20 } as MyNodeListParams,
      popupData: {
        keywords: "",
        list: [] as Node[],
        total: 0,
        showSelected: false,
      },
      selectedpopupData: [] as Node[],
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        data.tableData = [];
        data.loading = true;
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        data.searchData.nodeType = 1;
        data.searchData.statusMode = 2;
        const result = await NodeService.getNodeList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data;

          if (dataList.length === 0) {
            data.total = 0;
            data.loading = false;
            return;
          }

          const ids = dataList
            .map((item: Node) => {
              return item.nodeId;
            })
            .join(",");
          const results = await Promise.all([
            NodeService.getNodeExhibitCount({ nodeIds: ids }),
            NodeService.getNodeExhibitSignCount({ licensorIds: ids }),
          ]);
          dataList.forEach((node: Node) => {
            const { nodeId } = node;
            const exhibitData = results[0].data.data.find(
              (item: { nodeId: number; count: number }) => item.nodeId === nodeId
            );
            node.onlineExhibitCount = exhibitData.onlineCount;
            node.exhibitCount = exhibitData.count;
            node.signCount = results[1].data.data.find(
              (item: { licensorId: string; count: number }) => item.licensorId === String(nodeId)
            ).count;
          });

          const bannedIds = dataList
            .filter((item: Node) => [4, 5, 6, 12].includes(item.status))
            .map((item: Node) => {
              return item.nodeId;
            })
            .join(",");
          if (bannedIds) {
            const bannedResult = await NodeService.getNodeRecordList({ nodeIds: bannedIds });
            bannedResult.data.data.forEach(
              (item: { nodeId: number; records: { reason: string; remark: string }[] }) => {
                const resource: Node = dataList.find((resource: Node) => resource.nodeId === item.nodeId);
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

      /** 打开节点 */
      openNode(domain: string) {
        const url = assetsData.domain.replace("api", domain);
        openPage(url);
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

      /** 选择表格项 */
      selectTable(selected: Node[]) {
        data.selectedData = selected;
      },

      /** 添加示例节点 */
      async addSampleNode() {
        const nodeIds = data.selectedpopupData.map((item) => item.nodeId);
        const params = { nodeIds, nodeType: 1 };
        const result = await NodeService.setNodeType(params);
        const { errcode, msg } = result.data;
        if (errcode === 0) {
          ElMessage.success(`添加成功`);
          this.closeNodePopup();
          this.getData(true);
        } else {
          ElMessage.error(msg);
        }
      },

      /** 移除示例节点 */
      removeSampleNode(nodeId?: number) {
        ElMessageBox.confirm(`确认移除${nodeId ? "此" : "选中"}条目吗？`, `移除示例节点`, {
          confirmButtonText: "移除",
          cancelButtonText: "取消",
        }).then(async () => {
          const nodeIds = nodeId ? [nodeId] : data.selectedData.map((item) => item.nodeId);
          const params = { nodeIds, nodeType: 0 };
          const result = await NodeService.setNodeType(params);
          const { errcode, msg } = result.data;
          if (errcode === 0) {
            ElMessage.success(`移除成功`);
            this.closeNodePopup();
            this.getData(true);
          } else {
            ElMessage.error(msg);
          }
        });
      },

      /** 打开节点列表弹窗 */
      openNodeListPopup() {
        data.nodePopupShow = true;
        this.getPopupNodeList(true);
      },

      /** 切换弹窗节点表格页码 */
      changePopupPage(value: number) {
        data.popupSearchData.currentPage = value;
        this.getPopupNodeList();
      },

      /** 获取弹窗节点列表 */
      async getPopupNodeList(init = false) {
        if (init) data.popupSearchData.currentPage = 1;
        const { currentPage, limit } = data.popupSearchData;
        data.popupSearchData.skip = (currentPage - 1) * limit;
        data.popupSearchData.nodeType = 0;
        const result = await NodeService.getNodeList(data.popupSearchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data;
          data.popupData = {
            keywords: data.popupData.keywords,
            list: dataList,
            total: totalItem,
            showSelected: false,
          };
          this.updateResourceSelections();
        }
      },

      /** 选择弹窗节点表格项 */
      selectResources(selected: Node[], row: Node) {
        const index = data.selectedpopupData.findIndex((item) => item.nodeId === row.nodeId);
        if (index === -1) {
          data.selectedpopupData.push(row);
        } else {
          data.selectedpopupData.splice(index, 1);
        }
      },

      /** 全选弹窗节点表格项 */
      selectAllResources(selected: Node[]) {
        const all = selected.length !== 0;
        data.popupData.list.forEach((row) => {
          const index = data.selectedpopupData.findIndex((selectedItem) => selectedItem.nodeId === row.nodeId);
          if (all && index === -1) {
            data.selectedpopupData.push(row);
          } else if (!all && index !== -1) {
            data.selectedpopupData.splice(index, 1);
          }
        });
      },

      /** 更新弹窗节点列表选中状态 */
      updateResourceSelections() {
        const list = data.popupData.showSelected ? data.selectedpopupData : data.popupData.list;
        list.forEach((row) => {
          const index = data.selectedpopupData.findIndex((item) => item.nodeId === row.nodeId);
          nextTick(() => {
            tableRef.value!.toggleRowSelection(row, index !== -1);
          });
        });
      },

      /** 关闭节点列表弹窗 */
      closeNodePopup() {
        if (tableRef.value) tableRef.value.clearSelection();
        data.nodePopupShow = false;
        data.selectedpopupData = [];
      },

      /** 切换弹窗节点列表显示内容 */
      switchShowSelected() {
        data.popupData.showSelected = !data.popupData.showSelected;
        this.updateResourceSelections();
      },
    };

    methods.getData(true);

    return {
      mappingMatching,
      tableRef,
      dateRangeShortcuts,
      ...assetsData,
      ...toRefs(data),
      ...methods,
      formatDate,
      openPage,
      relativeTime,
    };
  },
};
</script>

<style lang="scss" scoped>
.intro {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
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
