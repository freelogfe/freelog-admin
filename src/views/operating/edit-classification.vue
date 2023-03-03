<!-- 编辑运营分类 -->
<template>
  <edit-template>
    <template v-slot:title>{{ mode === "create" ? "创建运营分类" : "编辑运营分类" }}</template>

    <template v-slot:barRight>
      <el-button type="primary" @click="save()">{{ mode === "create" ? "创建" : "保存" }}</el-button>
    </template>

    <template v-slot:main>
      <form-item label="编号" v-if="mode === 'update'">
        <el-input style="width: 400px" v-model="formData.code" disabled />
        <span class="desc">系统自动分配</span>
      </form-item>
      <form-item label="名称">
        <el-input style="width: 400px" v-model="formData.name" placeholder="请输入名称" clearable />
      </form-item>
      <form-item label="父类">
        <div class="cascader-panel">
          <div class="list" v-for="list in parentOptions" :key="list.level">
            <div
              class="item"
              :class="{ active: list.checked === item.code }"
              v-for="item in list.list"
              :key="item.code"
              @click="selectParentType(item, list.level)"
            >
              {{ item.name }}
            </div>
          </div>
        </div>
      </form-item>
      <form-item label="映射来源">
        <div class="btn-box">
          <div class="text-btn" @click="openResourceList()">
            <el-icon><plus /></el-icon>添加来源
          </div>
        </div>
        <div id="sortableList" class="property-list">
          <div class="property-item" :data-id="item" v-for="(item, index) in formData.sourcesArr" :key="item.identity">
            <el-icon class="handle"><DCaret /></el-icon>
            {{ item.name }}
            <el-icon class="delete-btn" @click="deletePropertyItem(index)"><close /></el-icon>
          </div>
        </div>
      </form-item>
      <form-item label="展示序号">
        <el-input-number
          style="width: 200px"
          v-model="formData.priority"
          placeholder="请输入展示序号"
          controls-position="right"
        />
        <span class="desc">序号越小，展示优先级越高</span>
      </form-item>
      <form-item label="是否启用">
        <el-radio-group v-model="formData.status">
          <el-radio :label="1"> 启用<span class="desc">在资源市场分类筛选器中显示</span> </el-radio>
          <el-radio style="margin-top: 10px" :label="2">
            停用<span class="desc">在资源市场分类筛选器中隐藏</span>
          </el-radio>
        </el-radio-group>
      </form-item>
    </template>
  </edit-template>

  <el-dialog v-model="resourcePropertyPopupShow" title="选择属性" width="1000px" @close="closeResourcePropertyPopup()">
    <div class="filter-bar" v-if="!resourcePropertyData.showSelected">
      <form-item label="关键字搜索">
        <el-input
          v-model="resourcePropertySearchData.nameOrKey"
          placeholder="请输入属性名称、属性键"
          clearable
          @keyup.enter="getResourcePropertyList(true)"
        />
      </form-item>
      <form-item>
        <el-button type="primary" @click="getResourcePropertyList(true)">搜索</el-button>
      </form-item>
    </div>

    <el-table
      ref="tableRef"
      :data="resourcePropertyData.showSelected ? selectedResourcePropertyData : resourcePropertyData.list"
      stripe
      @select="selectResources"
      @select-all="selectAllResources"
      border
      height="400"
    >
      <el-table-column type="selection" align="center" />
      <el-table-column label="属性名称" min-width="200">
        <template #default="scope">{{ scope.row.name || "-" }}</template>
      </el-table-column>
      <el-table-column label="属性键" min-width="200">
        <template #default="scope">{{ scope.row.key || "-" }}</template>
      </el-table-column>
      <el-table-column label="关联资源类型" min-width="200">
        <template #default="scope">{{ scope.row.dependencies || "-" }}</template>
      </el-table-column>
      <el-table-column label="录入方式" min-width="200">
        <template #default="scope">
          {{ insertModeMapping.find((item) => item.value === scope.row.insertMode).label }}
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination-box">
      <div class="selected-tip">
        <template v-if="selectedResourcePropertyData.length">
          <div>已选{{ selectedResourcePropertyData.length }}项</div>
          <div class="text-btn" @click="switchShowSelected()">
            {{ resourcePropertyData.showSelected ? "返回" : "查看所有已选" }}
          </div>
        </template>
      </div>

      <el-pagination
        layout="total, prev, pager, next, jumper"
        v-model:currentPage="resourcePropertySearchData.currentPage"
        :total="resourcePropertyData.showSelected ? selectedResourcePropertyData.length : resourcePropertyData.total"
        :page-size="resourcePropertySearchData.limit"
        @current-change="changeResourcePage($event)"
        v-if="!resourcePropertyData.showSelected"
      />
    </div>
    <div class="btns-area">
      <el-button @click="closeResourcePropertyPopup()">取消</el-button>
      <el-button type="primary" @click="saveResourceProperty()">保存</el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { nextTick, reactive, ref, toRefs } from "vue";
import { ActivitiesService, ResourceService } from "@/api/request";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage, ElTable } from "element-plus";
import { CreateOrEditClassificationParams, ResourcePropertyListParams } from "@/typings/params";
import Sortable from "sortablejs";
import { Plus, DCaret, Close } from "@element-plus/icons-vue";
import { ResourceProperty } from "@/typings/object";

/** 父类选项 */
interface ParentType {
  code: string;
  name: string;
  parentCodeArr: string[];
  children: ParentType[];
}

/** 运营分类编辑数据 */
interface MyCreateOrEditClassificationParams extends CreateOrEditClassificationParams {
  parentCodeArr: string[];
  sourcesArr: { name: string; identity: string; type: number }[];
}

export default {
  components: {
    Plus,
    DCaret,
    Close,
  },

  setup() {
    const { query, switchPage } = useMyRouter();
    const tableRef = ref<InstanceType<typeof ElTable>>();
    const assetsData = {
      insertModeMapping: [{ value: 1, label: "系统解析" }],
    };
    const data = reactive({
      loading: false,
      mode: "create" as "create" | "update",
      formData: {} as MyCreateOrEditClassificationParams,
      parentOptions: [] as any[],
      resourcePropertySearchData: { currentPage: 1, limit: 20, group: 1 } as ResourcePropertyListParams,
      resourcePropertyData: {
        keywords: "",
        list: [] as { name: string; identity: string; type: number }[],
        total: 0,
        showSelected: false,
      },
      selectedResourcePropertyData: [] as { name: string; identity: string; type: number }[],
      resourcePropertyPopupShow: false,
    });

    const methods = {
      /** 获取运营分类数据 */
      async getData() {
        const { code } = query.value;
        if (code) {
          // 编辑
          data.mode = "update";
          const result = await ActivitiesService.getClassificationData(code);
          const { errcode } = result.data;
          if (errcode === 0) {
            const { sources } = result.data.data;
            data.formData = result.data.data;
            data.formData.sourcesArr = [...sources];
          }
        } else {
          // 新建
          data.mode = "create";
          data.formData.sourcesArr = [];
        }

        this.initParentList();

        setTimeout(() => {
          const sortable = new Sortable(document.getElementById("sortableList"), {
            // 拖拽处
            handle: ".handle",
            // 结束拖拽
            onEnd() {
              data.formData.sourcesArr = sortable.toArray();
            },
          });
        }, 100);
      },

      /** 初始化父类选项数据 */
      async initParentList() {
        const result = await ActivitiesService.getClassificationGroupList("");
        const { errcode } = result.data;
        if (errcode === 0) {
          const defaultOption: ParentType = { code: "", name: "无", children: [], parentCodeArr: [""] };

          result.data.data.forEach((item: ParentType) => {
            item.parentCodeArr = [item.code];
          });
          const list = [defaultOption, ...result.data.data];
          data.parentOptions = [{ level: 0, list }];
          dealParentCodeArr(list);
        }
      },

      /** 选择父类 */
      selectParentType(item: ParentType, level: number) {
        data.parentOptions[level].checked = item.code;
        data.parentOptions.splice(level + 1);

        if (!item.code) {
          data.parentOptions.splice(1);
          return;
        }

        if (!item.children.length) return;
        
        data.parentOptions.push({ level: level + 1, list: item.children });
      },

      /** 打开资源属性列表 */
      openResourceList() {
        data.resourcePropertyPopupShow = true;
        this.getResourcePropertyList(true);
        data.selectedResourcePropertyData = [...data.formData.sourcesArr];
      },

      /** 获取资源属性列表 */
      async getResourcePropertyList(init = false) {
        if (init) data.resourcePropertySearchData.currentPage = 1;
        const { currentPage, limit } = data.resourcePropertySearchData;
        data.resourcePropertySearchData.skip = (currentPage - 1) * limit;
        const result = await ResourceService.getResourcePropertyList(data.resourcePropertySearchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data.resourceAttrs;
          data.resourcePropertyData = {
            keywords: data.resourcePropertyData.keywords,
            list: dataList,
            total: totalItem,
            showSelected: false,
          };
          this.updateResourceSelections();
        }
      },

      /** 更新资源属性列表选中状态 */
      updateResourceSelections() {
        const list = data.resourcePropertyData.showSelected
          ? data.selectedResourcePropertyData
          : data.resourcePropertyData.list;
        list.forEach((row) => {
          const index = data.selectedResourcePropertyData.findIndex((item) => item.identity === row.identity);
          nextTick(() => {
            tableRef.value!.toggleRowSelection(row, index !== -1);
          });
        });
      },

      /** 切换资源属性表格页码 */
      changeResourcePage(value: number) {
        data.resourcePropertySearchData.currentPage = value;
        this.getResourcePropertyList();
      },

      /** 关闭资源属性列表弹窗 */
      closeResourcePropertyPopup() {
        tableRef.value!.clearSelection();
        data.resourcePropertyPopupShow = false;
        data.selectedResourcePropertyData = [];
      },

      /** 切换资源属性列表显示内容 */
      switchShowSelected() {
        data.resourcePropertyData.showSelected = !data.resourcePropertyData.showSelected;
        this.updateResourceSelections();
      },

      /** 选择资源属性表格项 */
      selectResources(selected: ResourceProperty[], row: { name: string; identity: string; type: number }) {
        const index = data.selectedResourcePropertyData.findIndex((item) => item.identity === row.identity);
        if (index === -1) {
          data.selectedResourcePropertyData.push(row);
        } else {
          data.selectedResourcePropertyData.splice(index, 1);
        }
      },

      /** 全选资源属性表格项 */
      selectAllResources(selected: ResourceProperty[]) {
        const all = selected.length !== 0;
        data.resourcePropertyData.list.forEach((row) => {
          const index = data.selectedResourcePropertyData.findIndex(
            (selectedItem) => selectedItem.identity === row.identity
          );
          if (all && index === -1) {
            data.selectedResourcePropertyData.push(row);
          } else if (!all && index !== -1) {
            data.selectedResourcePropertyData.splice(index, 1);
          }
        });
      },

      /** 保存资源属性 */
      saveResourceProperty() {
        data.formData.sourcesArr = [...data.selectedResourcePropertyData];
        data.resourcePropertyPopupShow = false;
      },

      /** 删除标准属性 */
      deletePropertyItem(index: number) {
        data.formData.sourcesArr?.splice(index, 1);
      },

      /**
       * 保存
       * @params type 保存类型 1-创建 2-保存
       */
      async save() {
        if (!validate()) return;

        const { sourcesArr } = data.formData;
        if (sourcesArr) data.formData.sources = sourcesArr.map((item) => item.name);
        const parentTypeChecked = data.parentOptions.map((item) => item.checked);
        for (let i = parentTypeChecked.length - 1; i >= 0; i--) {
          if (parentTypeChecked[i] !== undefined) {
            data.formData.parentCode = parentTypeChecked[i];
            break;
          }
        }
        const result = await ActivitiesService.createOrEditClassification(data.formData, data.mode);
        const { errcode } = result.data;
        if (errcode === 0) {
          const msg = data.mode === "create" ? "创建成功" : "保存成功";
          ElMessage.success(msg);
          switchPage("/operating/classification-management");
        }
      },
    };

    /** 整理类型父类编号数组 */
    const dealParentCodeArr = (list: ParentType[]) => {
      const { code: currentCode } = query.value;
      const { parentCode } = data.formData;

      list.forEach(async (item, index) => {
        const { code, parentCodeArr } = item;

        if (data.mode === "update" && currentCode === item.code) {
          // 过滤自身
          list.splice(index, 1);
          return;
        }

        item.children.forEach((son: ParentType) => {
          son.parentCodeArr = [...item.parentCodeArr, son.code];
        });
        if (parentCode === code) {
          const checkedArr = parentCodeArr;
          checkedArr.forEach((checked, index) => {
            const checkedItem = data.parentOptions[index].list.find((parent: ParentType) => parent.code === checked);
            methods.selectParentType(checkedItem, index);
          });
        }
        dealParentCodeArr(item.children);
      });
    };

    /** 表单验证 */
    const validate = () => {
      const { name, priority, status } = data.formData;
      if (!name) {
        ElMessage("请输入名称");
        return false;
      } else if (data.parentOptions[0].checked === undefined) {
        ElMessage("请选择父类");
        return false;
      } else if (!priority) {
        ElMessage("请输入展示序号");
        return false;
      } else if (!status) {
        ElMessage("请选择是否启用");
        return false;
      }
      return true;
    };

    methods.getData();

    return {
      tableRef,
      ...assetsData,
      ...toRefs(data),
      ...methods,
    };
  },
};
</script>

<style lang="scss" scoped>
.el-radio {
  width: 100%;
}

.cascader-panel {
  width: 100%;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: flex;

  .list {
    height: 200px;
    overflow-y: auto;
    overflow-x: hidden;

    .item {
      width: 180px;
      color: #606266;
      height: 34px;
      line-height: 34px;
      padding: 0 20px;
      cursor: pointer;

      &:hover {
        background-color: #f5f7fa;
      }

      &.active {
        color: #fff;
        background-color: #7bbdff;
      }
    }

    & + .list {
      border-left: 1px solid #e4e7ed;
    }
  }
}

.btn-box {
  width: 500px;
  display: flex;
  justify-content: flex-end;

  .text-btn {
    display: flex;
    align-items: center;

    i {
      margin-right: 5px;
    }
  }
}

.property-list {
  width: 500px;
  min-height: 50px;
  border: 1px solid #ddd;
  border-radius: 4px;
  display: flex;
  flex-wrap: wrap;
  padding: 0 10px;
  box-sizing: border-box;

  .property-item {
    padding: 0 8px;
    margin: 10px;
    border-radius: 4px;
    background: #ddd;
    display: flex;
    align-items: center;
    cursor: default;

    .handle {
      color: #f9f9f9;
      margin-right: 5px;
      cursor: grab;
    }

    .delete-btn {
      color: #999;
      margin-left: 5px;
      cursor: pointer;

      &:hover {
        color: #666;
      }
    }
  }
}

.desc {
  margin-left: 20px;
  color: #bbb;
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
