<!-- 用户标签管理 -->
<template>
  <list-template>
    <template v-slot:barRight>
      <el-button type="primary" @click="openTagPopup()">创建标签</el-button>
    </template>

    <template v-slot:filterBar>
      <form-item label="关键字搜索">
        <el-input v-model="searchData.keywords" placeholder="请输入标签名称" clearable />
      </form-item>
      <form-item>
        <el-button type="primary" @click="getData()">搜索</el-button>
      </form-item>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" stripe @selection-change="selectTable">
        <el-table-column type="selection" />
        <el-table-column property="biaoqian" label="标签" min-width="100" show-overflow-tooltip />
        <el-table-column property="yonghushu" label="用户数" align="right" min-width="100" show-overflow-tooltip />
        <el-table-column property="leixing" label="类型" min-width="100" show-overflow-tooltip />
        <el-table-column label="操作" fixed="right" min-width="90">
          <template #default="scope">
            <div class="operate-btns">
              <el-button type="primary" @click="openTagPopup(scope.row)">编辑</el-button>
              <el-button type="danger" @click="deleteTag(scope.row.biaoqian)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <template v-slot:pagination>
      <el-pagination
        layout="total, prev, pager, next, jumper"
        v-model:currentPage="searchData.currentPage"
        :total="list.length"
        @current-change="changePage($event)"
      />
    </template>
  </list-template>

  <el-dialog v-model="tagPopupShow" :title="operateData.id ? '编辑标签' : '创建标签'" width="50%">
    <el-input v-model="operateData.biaoqian" placeholder="请输入标签" />
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
import { ElMessageBox } from "element-plus";

export default {
  components: {
    "list-template": defineAsyncComponent(() => import("@/components/list-template.vue")),
    "form-item": defineAsyncComponent(() => import("@/components/form-item.vue")),
  },

  setup() {
    const { switchPage } = useMyRouter();
    const data = reactive({
      list: [
        {
          biaoqian: "节点商",
          yonghushu: 20,
          leixing: "手动",
        },
        {
          biaoqian: "测试",
          yonghushu: 100,
          leixing: "自动",
        },
        {
          biaoqian: "资源作者",
          yonghushu: 20,
          leixing: "手动",
        },
        {
          biaoqian: "消费者",
          yonghushu: 10,
          leixing: "手动",
        },
      ],
      tableData: [] as any[],
      selectedData: [] as any[],
      searchData: {
        currentPage: 1,
      },
      operateData: {
        id: "",
        biaoqian: "",
      },
      tagPopupShow: false,
    });

    const methods = {
      // 获取页面数据
      getData() {
        const lastIndex = data.searchData.currentPage * 10 - 1;
        const result = data.list.slice(lastIndex - 9, lastIndex);
        data.tableData = result;
      },

      // 切换表格页码
      changePage(e: number) {
        data.searchData.currentPage = e;
        this.getData();
      },

      // 打开标签弹窗（有参数为编辑，反之为创建）
      openTagPopup(item?: any) {
        data.operateData.id = item?.biaoqian || "";
        data.operateData.biaoqian = item?.biaoqian || "";
        data.tagPopupShow = true;
      },

      // 删除操作
      deleteTag(id: string) {
        ElMessageBox.confirm("确认删除当前条目？", "删除标签", {
          confirmButtonText: "删除",
          cancelButtonText: "取消",
        }).then(() => {
          console.error(id);
        });
      },

      // 保存
      save() {
        console.error(data.operateData);
      },

      // 选择表格项
      selectTable(selected: any[]) {
        data.selectedData = selected;
      },
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

<style lang="scss" scoped>
.operate-btns {
  display: flex;

  button + button {
    margin-left: 10px;
  }
}
</style>
