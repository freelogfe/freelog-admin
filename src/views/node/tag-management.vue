<!-- 节点标签管理 -->
<template>
  <list-template>
    <template v-slot:barLeft v-if="selectedData.length">
      <el-button type="primary" @click="deleteTag(selectedData)">删除</el-button>
      <span class="selected-tip">已选中{{ selectedData.length }}条</span>
    </template>

    <template v-slot:barRight>
      <el-button type="primary" @click="openTagPopup()">创建标签</el-button>
    </template>

    <template v-slot:filterBar>
      <form-item label="关键字搜索">
        <el-input v-model="searchData.keywords" placeholder="请输入标签名" clearable @keyup.enter="getData(true)" />
      </form-item>
      <form-item>
        <el-button type="primary" @click="getData(true)">搜索</el-button>
        <el-button @click="clearSearch()">重置</el-button>
      </form-item>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" stripe @selection-change="selectTable" v-loading="loading">
        <el-table-column type="selection" />
        <el-table-column label="标签" min-width="100" show-overflow-tooltip>
          <template #default="scope">
            <span
              class="text-btn"
              @click="
                switchPage('/node/node-management', {
                  tag: scope.row.tagName,
                })
              "
            >
              {{ scope.row.tagName }}
            </span>
          </template>
        </el-table-column>
        <el-table-column property="count" label="节点数" align="right" />
        <el-table-column fixed="right" width="70">
          <template #header>
            <el-icon class="operation-icon" title="操作">
              <operation />
            </el-icon>
          </template>
          <template #default="scope">
            <el-icon class="icon-btn" title="编辑" @click="openTagPopup(scope.row)">
              <edit />
            </el-icon>
            <el-icon class="icon-btn" title="删除" @click="deleteTag([scope.row])">
              <delete />
            </el-icon>
          </template>
        </el-table-column>
      </el-table>
    </template>
  </list-template>

  <el-dialog v-model="tagPopupShow" :title="operateData.tagId ? '编辑标签' : '创建标签'">
    <el-input v-model="operateData.tagName" placeholder="请输入标签" @keyup.enter="save()" />
    <template #footer>
      <el-button @click="tagPopupShow = false">取消</el-button>
      <el-button type="primary" @click="save()">保存</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { reactive, toRefs } from "vue";
import { formatDate, relativeTime } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage, ElMessageBox } from "element-plus";
import { NodeService } from "@/api/request";
import { Operation, Edit, Delete } from "@element-plus/icons-vue";
import { NodeTag } from "@/typings/object";

export default {
  components: {
    Operation,
    Edit,
    Delete,
  },

  setup() {
    const { switchPage } = useMyRouter();
    const data = reactive({
      loading: false,
      tableData: [] as NodeTag[],
      selectedData: [] as NodeTag[],
      searchData: { keywords: "" } as { keywords: string },
      operateData: {} as NodeTag,
      tagPopupShow: false,
    });

    const methods = {
      /** 获取页面数据 */
      async getData() {
        data.tableData = [];
        data.loading = true;
        const result = await NodeService.getNodeTagsList();
        const { errcode, data: dataList } = result.data;
        if (errcode === 0) {
          if (dataList.length === 0) {
            data.loading = false;
            return;
          }

          const ids = dataList
            .map((item: NodeTag) => {
              return item.tagId;
            })
            .join(",");
          const results = await NodeService.getNodeTagUseCount({
            tagIds: ids,
          });
          dataList.forEach((tag: NodeTag) => {
            const { tagId } = tag;
            tag.count = results.data.data.find((item: { tagId: string; count: number }) => item.tagId === tagId).count;
          });

          const { keywords } = data.searchData;
          if (keywords) {
            data.tableData = dataList.filter((item: NodeTag) => item.tagName === keywords);
          } else {
            data.tableData = dataList;
          }
          data.loading = false;
        }
      },

      /** 重置 */
      clearSearch() {
        data.searchData = { keywords: "" };
        this.getData();
      },

      /** 打开标签弹窗（有参数为编辑，反之为创建） */
      openTagPopup(item?: NodeTag) {
        data.operateData = { ...(item || ({} as NodeTag)) };
        data.tagPopupShow = true;
      },

      /** 删除操作 */
      deleteTag(tags: NodeTag[]) {
        const tagName = tags.map((item) => "【" + item.tagName + "】").join("、");
        ElMessageBox.confirm(`确认删除${tagName}？`, "删除标签", {
          confirmButtonText: "删除",
          cancelButtonText: "取消",
        }).then(async () => {
          const ids = tags.map((item) => item.tagId).join(",");
          const result = await NodeService.deleteNodeTag({ tagIds: ids });
          const { errcode } = result.data;
          if (errcode === 0) {
            this.getData();
          }
        });
      },

      /** 保存 */
      async save() {
        if (!validate()) return;

        const { tagId, tagName } = data.operateData;
        let result;
        if (tagId) {
          result = await NodeService.editNodeTag(tagId, { tagName });
        } else {
          result = await NodeService.createNodeTag({ tags: [tagName] });
        }
        const { errcode } = result.data;
        if (errcode === 0) {
          data.tagPopupShow = false;
          this.getData();
        }
      },

      /** 选择表格项 */
      selectTable(selected: NodeTag[]) {
        data.selectedData = selected;
      },
    };

    /** 表单验证 */
    const validate = () => {
      const { tagName } = data.operateData;
      if (!tagName) {
        ElMessage("请输入标签");
        return false;
      }
      return true;
    };

    methods.getData();

    return {
      ...toRefs(data),
      ...methods,
      formatDate,
      switchPage,
      relativeTime,
    };
  },
};
</script>
