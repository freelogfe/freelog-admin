<!-- 资源标签管理 -->
<template>
  <list-template>
    <template v-slot:barRight>
      <el-button type="primary" @click="openTagPopup()">创建标签</el-button>
    </template>

    <template v-slot:filterBar>
      <form-item label="关键字搜索">
        <el-input v-model="searchData.keywords" placeholder="请输入标签名称" clearable />
      </form-item>
      <form-item label="资源类型">
        <el-select v-model="searchData.ziyuanleixing" clearable placeholder="请选择资源类型">
          <el-option v-for="item in resourceTypeMapping" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </form-item>
      <form-item label="操作权限">
        <el-select v-model="searchData.caozuoquanxian" clearable placeholder="请选择操作权限">
          <el-option
            v-for="item in operatePermissionMapping"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </form-item>
      <form-item label="类型">
        <el-select v-model="searchData.leixing" clearable placeholder="请选择类型">
          <el-option v-for="item in typeMapping" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </form-item>
      <form-item>
        <el-button type="primary" @click="getData()">搜索</el-button>
      </form-item>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" stripe @selection-change="selectTable">
        <el-table-column type="selection" />
        <el-table-column property="biaoqian" label="标签" show-overflow-tooltip />
        <el-table-column property="ziyuanshu" label="资源数" align="right" show-overflow-tooltip />
        <el-table-column label="类型">
          <template #default="scope">
            {{ typeMapping.find((item) => item.value === scope.row.leixing).label }}
          </template>
        </el-table-column>
        <el-table-column label="操作权限">
          <template #default="scope">
            {{ operatePermissionMapping.find((item) => item.value === scope.row.caozuoquanxian).label }}
          </template>
        </el-table-column>
        <el-table-column label="适用类型">
          <template #default="scope">
            {{ scope.row.ziyuanleixing.join("、") }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="90">
          <template #default="scope">
            <div class="operate-btns">
              <el-button type="primary" @click="openTagPopup(scope.row)">编辑</el-button>
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
    <div class="popup-item">
      <div class="item-label">标签名称</div>
      <div class="item-value">
        <el-input v-model="operateData.biaoqianmingcheng" placeholder="请输入标签名称" v-if="!operateData.id" />
        <span v-else>{{ operateData.biaoqianmingcheng }}</span>
      </div>
    </div>
    <div class="popup-item">
      <div class="item-label">标签类型</div>
      <div class="item-value">
        <el-select style="width: 100%" v-model="operateData.leixing" clearable placeholder="请选择标签类型">
          <el-option v-for="item in typeMapping" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
    </div>
    <div class="popup-item">
      <div class="item-label">操作权限</div>
      <div class="item-value">
        <el-select style="width: 100%" v-model="operateData.caozuoquanxian" clearable placeholder="请选择操作权限">
          <el-option
            v-for="item in operatePermissionMapping"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
    </div>
    <div class="popup-item">
      <div class="item-label">适用资源类型</div>
      <div class="item-value">
        <el-checkbox
          v-model="operateData.checkAll"
          :indeterminate="operateData.isIndeterminate"
          @change="checkAllChange"
        >
          Check all
        </el-checkbox>
        <el-checkbox-group v-model="operateData.shiyongziyuanleixing" @change="checkChange">
          <el-checkbox v-for="item in ziyuanleixingArr" :key="item" :label="item">
            {{ item }}
          </el-checkbox>
        </el-checkbox-group>
        <el-checkbox v-model="operateData.weilaixinzengleixing">未来新增类型</el-checkbox>
      </div>
    </div>
    <template #footer>
      <el-button @click="auditPopupShow = false">取消</el-button>
      <el-button type="primary" @click="save()">保存</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineAsyncComponent, reactive, toRefs } from "vue-demi";
import { formatDate, relativeTime } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";

export default {
  components: {
    "list-template": defineAsyncComponent(() => import("@/components/list-template.vue")),
    "form-item": defineAsyncComponent(() => import("@/components/form-item.vue")),
  },

  setup() {
    const { switchPage } = useMyRouter();
    const data = reactive({
      resourceTypeMapping: [
        { value: 1, label: "image" },
        { value: 2, label: "txt" },
        { value: 3, label: "markdown" },
        { value: 4, label: "audio" },
        { value: 5, label: "video" },
        { value: 6, label: "widget" },
        { value: 7, label: "theme" },
      ],
      operatePermissionMapping: [
        { value: 1, label: "公开" },
        { value: 2, label: "隐藏" },
        { value: 3, label: "仅管理员可见" },
      ],
      typeMapping: [
        { value: 1, label: "分类标签" },
        { value: 2, label: "运营标签" },
      ],
      list: [
        {
          biaoqian: "摄影",
          ziyuanshu: 20,
          leixing: 1,
          caozuoquanxian: 1,
          ziyuanleixing: ["image"],
        },
        {
          biaoqian: "精选",
          ziyuanshu: 100,
          leixing: 1,
          caozuoquanxian: 2,
          ziyuanleixing: ["theme"],
        },
        {
          biaoqian: "资源作者",
          ziyuanshu: 20,
          leixing: 2,
          caozuoquanxian: 3,
          ziyuanleixing: ["txt", "markdown"],
        },
        {
          biaoqian: "消费者",
          ziyuanshu: 10,
          leixing: 2,
          caozuoquanxian: 1,
          ziyuanleixing: ["txt", "markdown", "image"],
        },
      ],
      tableData: [] as any[],
      selectedData: [] as any[],
      searchData: {
        currentPage: 1,
      },
      operateData: {
        id: "",
        biaoqianmingcheng: "",
        leixing: null as number | null,
        caozuoquanxian: null as number | null,
        checkAll: false,
        isIndeterminate: false,
        shiyongziyuanleixing: [] as string[],
        weilaixinzengleixing: false,
      },
      ziyuanleixingArr: ["image", "txt", "markdown", "audio", "video", "widget", "theme"],
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
        data.operateData.biaoqianmingcheng = item?.biaoqian || "";
        data.operateData.leixing = item?.leixing || null;
        data.operateData.caozuoquanxian = item?.caozuoquanxian || null;
        data.operateData.shiyongziyuanleixing = item?.ziyuanleixing || [];
        data.tagPopupShow = true;
      },

      // 保存
      save() {
        console.error(data.operateData);
      },

      // 选择表格项
      selectTable(selected: any[]) {
        data.selectedData = selected;
      },

      // 切换全选
      checkAllChange(checkAll: boolean) {
        data.operateData.shiyongziyuanleixing = checkAll ? data.ziyuanleixingArr : [];
        data.operateData.isIndeterminate = false;
      },

      // 选择多选项
      checkChange(checked: string[]) {
        const checkedCount = checked.length;
        data.operateData.checkAll = checkedCount === data.ziyuanleixingArr.length;
        data.operateData.isIndeterminate = checkedCount > 0 && checkedCount < data.ziyuanleixingArr.length;
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

.popup-item {
  display: flex;

  & + .popup-item {
    margin-top: 20px;
  }

  .item-label {
    width: 100px;
    line-height: 32px;
  }

  .item-value {
    flex: 1;
  }
}
</style>
