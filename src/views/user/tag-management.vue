<!-- 用户标签管理 -->
<template>
  <list-template>
    <template v-slot:barRight>
      <el-button type="primary" @click="openTagPopup()">创建标签</el-button>
    </template>

    <!-- <template v-slot:filterBar>
      <form-item label="关键字搜索">
        <el-input v-model="searchData.keywords" placeholder="请输入标签名称" clearable />
      </form-item>
      <form-item>
        <el-button type="primary" @click="getData()">搜索</el-button>
      </form-item>
    </template> -->

    <template v-slot:table>
      <el-table :data="tableData" stripe @selection-change="selectTable">
        <!-- <el-table-column type="selection" /> -->
        <el-table-column property="tag" label="标签" min-width="100" show-overflow-tooltip />
        <el-table-column property="totalSetCount" label="用户数" align="right" min-width="100" show-overflow-tooltip />
        <el-table-column label="类型" min-width="100" show-overflow-tooltip>
          <template #default="scope">
            {{ typeMapping.find((item) => item.value === scope.row.type).label }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" min-width="90">
          <template #default="scope">
            <div class="operate-btns">
              <el-button type="primary" @click="openTagPopup(scope.row)">编辑</el-button>
              <el-button type="danger" @click="deleteTag(scope.row.tagId)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <!-- <template v-slot:pagination>
      <el-pagination
        layout="total, prev, pager, next, jumper"
        v-model:currentPage="searchData.currentPage"
        :total="list.length"
        @current-change="changePage($event)"
      />
    </template> -->
  </list-template>

  <el-dialog v-model="tagPopupShow" :title="operateData.tagId ? '编辑标签' : '创建标签'" width="50%">
    <el-input v-model="operateData.tag" placeholder="请输入标签" />
    <template #footer>
      <el-button @click="tagPopupShow = false">取消</el-button>
      <el-button type="primary" @click="save()">保存</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineAsyncComponent, reactive, toRefs } from "vue-demi";
import { formatDate, relativeTime } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage, ElMessageBox } from "element-plus";
import { UserService } from "@/api/request";

/** 用户标签数据 */
export interface UserTag {
  tagId: string;
  tag: string;
  totalSetCount: number;
  type: 1 | 2;
}

export default {
  components: {
    "list-template": defineAsyncComponent(() => import("@/components/list-template.vue")),
    // "form-item": defineAsyncComponent(() => import("@/components/form-item.vue")),
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
      tableData: [] as UserTag[],
      selectedData: [] as UserTag[],
      searchData: {},
      operateData: {} as UserTag,
      tagPopupShow: false,
    });

    const methods = {
      // 获取页面数据
      async getData() {
        const result = await UserService.getUserTagsList();
        data.tableData = result.data.data;
      },

      // // 切换表格页码
      // changePage(e: number) {
      //   data.searchData.currentPage = e;
      //   this.getData();
      // },

      // 打开标签弹窗（有参数为编辑，反之为创建）
      openTagPopup(item?: UserTag) {
        data.operateData = { ...(item || ({} as UserTag)) };
        data.tagPopupShow = true;
      },

      // 删除操作
      deleteTag(id: string) {
        ElMessageBox.confirm("确认删除当前条目？", "删除标签", {
          confirmButtonText: "删除",
          cancelButtonText: "取消",
        }).then(async () => {
          const result = await UserService.deleteUserTag(id);
          const { errcode, msg } = result.data;
          if (errcode === 0) {
            this.getData();
          } else {
            ElMessage.error(msg);
          }
        });
      },

      // 保存
      async save() {
        const { tagId, tag } = data.operateData;
        let result;
        if (tagId) {
          result = await UserService.editUserTag(tagId, { tag });
        } else {
          result = await UserService.createUserTag({ tags: [tag] });
        }
        const { errcode, msg } = result.data;
        if (errcode === 0) {
          data.tagPopupShow = false;
          this.getData();
        } else {
          ElMessage.error(msg);
        }
      },

      // 选择表格项
      selectTable(selected: UserTag[]) {
        data.selectedData = selected;
      },
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

<style lang="scss" scoped>
.operate-btns {
  display: flex;

  button + button {
    margin-left: 10px;
  }
}
</style>
