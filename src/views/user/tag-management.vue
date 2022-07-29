<!-- 用户标签管理 -->
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
      <div class="filter-controls">
        <form-item label="关键字搜索">
          <el-input
            style="width: 250px"
            v-model="keywords"
            placeholder="请输入标签名称"
            clearable
            @keyup.enter="getData(false)"
          />
        </form-item>
      </div>
      <div class="filter-btns">
        <el-button type="primary" @click="getData(false)">搜索</el-button>
        <el-button @click="clearSearch()">重置</el-button>
      </div>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" stripe @selection-change="selectTable" v-loading="loading">
        <el-table-column type="selection" />
        <el-table-column label="标签" min-width="100">
          <template #default="scope">
            <span class="text-btn" @click="switchPage('/user/user-management', { tag: scope.row.tagId })">
              {{ scope.row.tag }}
            </span>
          </template>
        </el-table-column>
        <el-table-column property="totalSetCount" label="用户数" align="right" min-width="100" show-overflow-tooltip />
        <el-table-column label="类型" min-width="100" show-overflow-tooltip>
          <template #default="scope">
            {{ typeMapping.find((item) => item.value === scope.row.type).label }}
          </template>
        </el-table-column>
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
import { UserTag } from "@/typings/object";

/** 编辑标签参数 */
interface EditTag {
  tagId: number;
  tag: string;
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
      keywords: "",
      tableData: [] as UserTag[],
      selectedData: [] as UserTag[],
      operateData: {} as EditTag,
      tagPopupShow: false,
    });

    const methods = {
      /** 获取页面数据 */
      async getData(init = true) {
        data.loading = true;
        const result = await UserService.getUserTagsList();
        const listData = result.data.data;
        if (init) {
          data.tableData = listData;
        } else {
          data.tableData = data.keywords
            ? listData.filter((item: UserTag) => item.tag.includes(data.keywords))
            : listData;
        }
        data.loading = false;
      },

      /** 重置搜索 */
      clearSearch() {
        data.keywords = "";
        this.getData();
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

      /** 选择表格项 */
      selectTable(selected: UserTag[]) {
        data.selectedData = selected;
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
