<!-- 节点管理 -->
<template>
  <list-template>
    <template v-slot:barLeft>
      <span class="selected-tip" v-show="selectedData.length">已选中{{ selectedData.length }}条</span>
    </template>

    <template v-slot:barRight>
      <el-button type="primary" @click="setTag()">批量添加节点标签</el-button>
      <el-button type="primary" @click="switchPage('/node/tag-management')">管理标签</el-button>
    </template>

    <template v-slot:filterBar>
      <form-item label="关键字搜索">
        <el-input
          v-model="searchData.keywords"
          placeholder="请输入节点名、地址"
          clearable
          @keyup.enter="getData(true)"
        />
      </form-item>
      <form-item label="标签">
        <el-select v-model="searchData.selectedTags" multiple placeholder="请选择标签" clearable>
          <el-option v-for="item in nodeTagsList" :key="item" :value="item" />
        </el-select>
      </form-item>
      <form-item label="创建时间">
        <el-date-picker
          v-model="searchData.createDate"
          type="daterange"
          unlink-panels
          range-separator="-"
          format="YYYY/MM/DD"
          start-placeholder="起始日期"
          end-placeholder="截止日期"
          :shortcuts="dateRangeShortcuts"
        />
      </form-item>
      <form-item>
        <el-button type="primary" @click="getData(true)">搜索</el-button>
        <el-button @click="clearSearch()">重置</el-button>
      </form-item>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" stripe @selection-change="selectTable">
        <el-table-column type="selection" />
        <el-table-column label="节点" width="150" show-overflow-tooltip>
          <template #default="scope">
            <el-button type="text" @click="openPage(scope.row.nodeDomain)">{{ scope.row.nodeName }} </el-button>
          </template>
        </el-table-column>
        <el-table-column label="地址" width="300" show-overflow-tooltip>
          <template #default="scope">
            <el-button type="text" @click="openPage(scope.row.nodeDomain)"
              >{{ domain.replace("api", scope.row.nodeDomain) }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="标签" width="250">
          <template #default="scope">
            <div class="tags-box">
              <el-tag
                class="tag"
                closable
                v-for="item in scope.row.tags"
                :key="item"
                @close="removeTag(scope.row.nodeId, item)"
              >
                {{ item }}
              </el-tag>
            </div>
            <el-icon class="icon-btn" title="管理标签" @click="setTag(scope.row)">
              <edit />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column label="用户" width="200" show-overflow-tooltip>
          <template #default="scope">
            <el-button
              type="text"
              @click="
                switchPage('/user/user-management', {
                  keywords: scope.row.ownerUserName,
                })
              "
              >{{ scope.row.ownerUserName }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="运营展品数" width="120" align="right">
          <template #default="scope">
            <el-button
              type="text"
              @click="
                switchPage('/node/exhibit-management', {
                  keywords: scope.row.nodeName,
                })
              "
              >{{ scope.row.exhibitCount }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="需方合约数" width="120" align="right">
          <template #default="scope">
            <el-button
              type="text"
              @click="
                switchPage('/contract/contract-management', {
                  keywordsType: 3,
                  keywords: scope.row.nodeName,
                })
              "
              >{{ scope.row.signCount }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column property="createDate" label="创建时间" width="160">
          <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="scope">
            <el-tooltip
              effect="dark"
              :content="`${scope.row.reason}${scope.row.remark ? '（' + scope.row.remark + '）' : ''}`"
              placement="top"
              v-if="[5, 6].includes(scope.row.status)"
            >
              {{ statusMapping.find((item) => item.value === scope.row.status).label }}
            </el-tooltip>
            <span v-else>{{ statusMapping.find((item) => item.value === scope.row.status).label }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" width="40">
          <template #header>
            <el-icon class="operation-icon" title="操作">
              <operation />
            </el-icon>
          </template>
          <template #default="scope">
            <el-icon
              class="icon-btn"
              title="封禁"
              @click="banNode(scope.row.nodeId)"
              v-if="![5, 6].includes(scope.row.status)"
            >
              <close />
            </el-icon>
            <el-icon
              class="icon-btn"
              title="解禁"
              @click="restore(scope.row.nodeId)"
              v-if="[5, 6].includes(scope.row.status)"
            >
              <check />
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

  <el-dialog v-model="setTagPopupShow" title="管理节点标签">
    <el-select style="width: 100%" v-model="setTagData.tags" multiple placeholder="请选择标签">
      <el-option v-for="item in nodeTagsList" :key="item" :value="item" />
    </el-select>
    <el-input
      style="margin-top: 10px"
      v-model="setTagData.newTag"
      placeholder="输入标签按回车键确认"
      @keyup.enter="newTag()"
    />
    <template #footer>
      <el-button @click="setTagPopupShow = false">取消</el-button>
      <el-button type="primary" @click="setTagConfirm()">确认</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="banPopupShow" title="封禁节点" width="800px">
    <form-item label="封禁原因">
      <el-radio-group v-model="operateData.reason">
        <el-radio label="抄袭、侵权"></el-radio>
        <el-radio label="色情、暴力"></el-radio>
        <el-radio label="不实信息"></el-radio>
        <el-radio label="恶意营销"></el-radio>
        <el-radio label="垃圾广告"></el-radio>
        <el-radio label="欺诈"></el-radio>
        <el-radio label="其他违法违规"></el-radio>
      </el-radio-group>
    </form-item>
    <form-item label="备注">
      <el-input
        v-model="operateData.remark"
        :autosize="{ minRows: 2, maxRows: 4 }"
        type="textarea"
        placeholder="请输入备注（选填）"
      />
    </form-item>
    <template #footer>
      <el-button @click="banPopupShow = false">取消</el-button>
      <el-button type="primary" @click="operateConfirm(1)">封禁</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { reactive, toRefs } from "vue";
import { dateRange, formatDate, relativeTime } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage, ElMessageBox } from "element-plus";
import { NodeService } from "@/api/request";
import { dateRangeShortcuts } from "@/assets/data";
import { Operation, Edit, Close, Check } from "@element-plus/icons-vue";
import { ListParams, OperateParams } from "@/api/interface";

/** 节点数据 */
interface Node {
  nodeId: number;
  nodeName: string;
  nodeDomain: string;
  nodeThemeId: string;
  ownerUserId: number;
  ownerUserName: string;
  status: number;
  createDate: string;
  tags: string[];
  exhibitCount: number;
  signCount: number;
  reason: string;
  remark: string;
}

/** 节点标签数据 */
interface NodeTag {
  tagId: string;
  tag: string;
}

export default {
  components: {
    Operation,
    Edit,
    Close,
    Check,
  },

  setup() {
    const { query, switchPage } = useMyRouter();
    const assetsData = {
      statusMapping: [
        { value: 1, label: "下线" },
        { value: 2, label: "上线" },
        { value: 5, label: "封禁" },
        { value: 6, label: "封禁" },
      ],
      domain: process.env.VUE_APP_BASE_API as string,
    };
    const data = reactive({
      tableData: [] as Node[],
      total: 0,
      selectedData: [] as Node[],
      nodeTagsList: [] as NodeTag[],
      searchData: {
        currentPage: 1,
        limit: 20,
      } as ListParams,
      setTagData: {} as any,
      operateData: {} as OperateParams,
      setTagPopupShow: false,
      banPopupShow: false,
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit, selectedTags = [], createDate } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        data.searchData.tags = selectedTags.join(",");
        [data.searchData.startCreateDate, data.searchData.endCreateDate] = dateRange(createDate);
        const result = await NodeService.getNodeList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data;

          if (dataList.length === 0) {
            data.tableData = [];
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
            node.exhibitCount = results[0].data.data.find(
              (item: { nodeId: number; count: number }) => item.nodeId === nodeId
            ).count;
            node.signCount = results[1].data.data.find(
              (item: { licensorId: string; count: number }) => item.licensorId === String(nodeId)
            ).count;
          });

          const bannedIds = dataList
            .filter((item: Node) => [5, 6].includes(item.status))
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
        }
      },

      /** 打开新页面 */
      openPage(domain: string) {
        const url = assetsData.domain.replace("api", domain);
        window.open(url);
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

      /** 封禁操作 */
      banNode(nodeId: string) {
        data.operateData = { nodeId };
        data.banPopupShow = true;
      },

      /** 解封操作 */
      restore(nodeId: string) {
        ElMessageBox.confirm("确认要解除该节点的封禁吗？", "解封封禁", {
          confirmButtonText: "解封",
          cancelButtonText: "取消",
        }).then(() => {
          data.operateData.nodeId = nodeId;
          this.operateConfirm(2);
        });
      },

      /** 操作（封禁/解封） */
      async operateConfirm(type: 1 | 2) {
        const { nodeId, reason, remark } = data.operateData;
        let result = null;
        if (type === 1) {
          result = await NodeService.banNode(nodeId, { reason, remark });
        } else {
          result = await NodeService.restoreNode(nodeId);
        }
        const { errcode } = result.data;
        if (errcode === 0) {
          data.banPopupShow = false;
          this.getData();
        }
      },

      /** 选择表格项 */
      selectTable(selected: Node[]) {
        data.selectedData = selected;
      },

      /** 设置节点标签 */
      setTag(item?: Node) {
        if (item) {
          data.setTagData.nodes = [item];
          data.setTagData.tags = [...item.tags];
        } else {
          if (data.selectedData.length === 0) {
            ElMessage.info("请选择需要管理节点标签的条目");
            return;
          }
          data.setTagData.nodes = data.selectedData;
          data.setTagData.tags = [];
        }
        data.setTagPopupShow = true;
      },

      /** 添加新标签 */
      async newTag() {
        const { newTag } = data.setTagData;
        if (!newTag) return;

        const existTag = data.nodeTagsList.find((item) => item === newTag);

        if (existTag) {
          if (data.setTagData.tags.includes(existTag)) {
            // 输入的标签已选择
            return;
          }

          // 输入的标签已存在且未选择，直接选择该标签
          data.setTagData.tags.push(existTag);
          data.setTagData.newTag = "";
          return;
        }

        const result = await NodeService.createNodeTag({
          tags: [newTag],
        });
        const { errcode } = result.data;
        if (errcode === 0) {
          data.nodeTagsList.push(newTag);
          data.setTagData.tags.push(newTag);
          data.setTagData.newTag = "";
        }
      },

      /** 设置节点标签 */
      async setTagConfirm() {
        const { nodes, tags } = data.setTagData;
        let addTags = [];
        if (nodes.length === 1) {
          // 非批量操作，统计删除标签与添加标签
          const node = nodes[0];
          const deleteTags = [] as string[];
          node.tags.forEach((item: string) => {
            if (!tags.includes(item)) deleteTags.push(item);
          });
          tags.forEach((tag: string) => {
            if (!node.tags.find((item: string) => item === tag)) {
              addTags.push(tag);
            }
          });
          if (deleteTags.length !== 0) {
            // 存在删除标签，执行删除
            const result = await NodeService.setNodeTag({
              tagNames: deleteTags,
              nodeIds: [node.nodeId],
              setType: 2,
            });
            const { errcode } = result.data;
            if (errcode !== 0) return;
            if (addTags.length === 0) {
              data.setTagPopupShow = false;
              this.getData();
            }
          }
        } else {
          // 批量操作，无删除标签，所有所选标签为添加标签
          addTags = tags;
        }
        if (addTags.length !== 0) {
          // 存在添加标签，执行添加
          const nodeIds = nodes.map((item: Node) => item.nodeId);
          const result = await NodeService.setNodeTag({
            tagNames: addTags,
            nodeIds,
            setType: 1,
          });
          const { errcode } = result.data;
          if (errcode === 0) {
            data.setTagPopupShow = false;
            this.getData();
          }
        }
      },

      /** 删除节点标签 */
      async removeTag(nodeId: number, tagName: string) {
        const result = await NodeService.setNodeTag({
          tagNames: [tagName],
          nodeIds: [nodeId],
          setType: 2,
        });
        const { errcode } = result.data;
        if (errcode === 0) {
          const item = data.tableData.find((node) => node.nodeId === nodeId);
          if (!item) return;
          item.tags = item.tags.filter((tag) => tag !== tagName);
        }
      },
    };

    /** 获取节点标签 */
    const getNodeTags = async () => {
      const result = await NodeService.getNodeTagsList();
      data.nodeTagsList = result.data.data.map((item: { tagName: string }) => item.tagName);
    };

    data.searchData.keywords = query.value.keywords;
    data.searchData.ownerUserId = query.value.userId;
    if (query.value.tag) data.searchData.selectedTags = [query.value.tag];
    methods.getData(true);
    getNodeTags();

    return {
      dateRangeShortcuts,
      ...assetsData,
      ...toRefs(data),
      ...methods,
      formatDate,
      switchPage,
      relativeTime,
    };
  },
};
</script>
