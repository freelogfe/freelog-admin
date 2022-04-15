<!-- 翻译标签管理 -->
<template>
  <list-template>
    <template v-slot:barLeft>
      <span class="selected-tip" v-show="selectedData.length">已选中{{ selectedData.length }}条</span>
    </template>

    <template v-slot:barRight>
      <el-button type="primary" @click="batchDelete()">批量删除</el-button>
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
        <el-table-column label="标签" width="100">
          <template #default="scope">
            <span
              class="text-btn"
              @click="
                switchPage('/user/user-management', {
                  tag: scope.row.tagId,
                })
              "
            >
              {{ scope.row.tag }}
            </span>
          </template>
        </el-table-column>
        <el-table-column property="totalSetCount" label="用户数" align="right" min-width="100" show-overflow-tooltip />
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
    <el-input v-model="operateData.tag" placeholder="请输入标签" @keyup.enter="save()" />
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
import { UserService } from "@/api/request";
import { Operation, Edit, Delete } from "@element-plus/icons-vue";
import { ListParams } from "@/api/interface";

/** 用户标签数据 */
export interface UserTag {
  tagId: number;
  tag: string;
  totalSetCount: number;
  type: 1 | 2;
}

export default {
  components: {
    Operation,
    Edit,
    Delete,
  },

  setup() {
    const { switchPage } = useMyRouter();
    const assetsData = {
      typeMapping: [
        { value: 1, label: "手动" },
        { value: 2, label: "自动" },
      ],
    };
    const data = reactive({
      loading: false,
      tableData: [] as UserTag[],
      selectedData: [] as UserTag[],
      searchData: {
        currentPage: 1,
        limit: 20,
      } as ListParams,
      operateData: {} as UserTag,
      tagPopupShow: false,
    });

    const methods = {
      /** 获取页面数据 */
      async getData(init = false) {
        data.tableData = [];
        data.loading = true;
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        const result = await UserService.getUserTagsList();
        const { errcode } = result.data;
        if (errcode === 0) {
          data.tableData = result.data.data;
          data.loading = false;
        }
      },

      /** 打开标签弹窗（有参数为编辑，反之为创建） */
      openTagPopup(item?: UserTag) {
        data.operateData = { ...(item || ({} as UserTag)) };
        data.tagPopupShow = true;
      },

      /** 删除操作 */
      deleteTag(tags: UserTag[]) {
        const tagName = tags.map((item) => "【" + item.tag + "】").join("、");
        ElMessageBox.confirm(`确认删除${tagName}？`, "删除标签", {
          confirmButtonText: "删除",
          cancelButtonText: "取消",
        }).then(async () => {
          const ids = tags.map((item) => item.tagId);
          const result = await UserService.deleteUserTag({ tagIds: ids });
          const { errcode } = result.data;
          if (errcode === 0) {
            this.getData();
          }
        });
      },

      /** 保存 */
      async save() {
        if (!validate()) return;

        const { tagId, tag } = data.operateData;
        let result;
        if (tagId) {
          result = await UserService.editUserTag(tagId, { tag });
        } else {
          result = await UserService.createUserTag({ tags: [tag] });
        }
        const { errcode } = result.data;
        if (errcode === 0) {
          data.tagPopupShow = false;
          this.getData();
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

      /** 选择表格项 */
      selectTable(selected: UserTag[]) {
        data.selectedData = selected;
      },

      /** 批量编辑标签 */
      batchDelete() {
        if (data.selectedData.length === 0) {
          ElMessage.info("请选择需要删除的标签");
          return;
        }

        this.deleteTag(data.selectedData);
      },
    };

    /** 表单验证 */
    const validate = () => {
      const { tag } = data.operateData;
      if (!tag) {
        ElMessage("请输入标签");
        return false;
      }
      return true;
    };

    methods.getData();

    return {
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
