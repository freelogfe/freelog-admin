<!-- 编辑资源类型 -->
<template>
  <edit-template>
    <template v-slot:title>{{ mode === "create" ? "创建资源类型" : "编辑资源类型" }}</template>

    <template v-slot:barRight>
      <el-button type="primary" @click="save()">{{ mode === "create" ? "创建" : "保存" }}</el-button>
    </template>

    <template v-slot:main>
      <form-item label="编号" v-if="mode === 'update'">
        <el-input style="width: 400px" v-model="formData.code" disabled />
        <span class="desc">系统自动分配</span>
      </form-item>
      <form-item label="名称">
        <el-input
          style="width: 400px"
          v-model="formData.name"
          placeholder="请输入名称"
          clearable
          :disabled="mode === 'update'"
        />
      </form-item>
      <form-item label="父类">
        <div class="cascader-panel" :class="{ disabled: mode === 'update' }">
          <template v-for="(list, index) in parentOptions" :key="list.level">
            <div class="list" v-if="index < 3">
              <el-scrollbar>
                <div
                  class="item"
                  :class="{ active: list.checked === item.code }"
                  v-for="item in list.list"
                  :key="item.code"
                  @click="selectParentType(item, list.level, true)"
                >
                  <div>
                    <span>{{ item.name }}</span>
                    <span class="stop-mark" v-if="item.status === 2">（已停用）</span>
                  </div>
                  <i class="admin icon-triangle-arrowright" v-if="index < 2 && item.children.length" />
                </div>
              </el-scrollbar>
            </div>
          </template>
        </div>
      </form-item>
      <form-item label="展示序号">
        <el-input-number
          style="width: 200px"
          v-model="formData.priority"
          placeholder="请输入展示序号"
          :controls="false"
          :min="1"
        />
        <span class="desc">序号越小，展示优先级越高</span>
      </form-item>
      <form-item label="是否启用">
        <el-radio-group v-model="formData.status">
          <el-radio :label="1">
            启用<span class="desc">在用户端资源类型选择器中显示，用户在创建资源是可以直接选择此资源类型</span>
          </el-radio>
          <el-radio style="margin-top: 10px" :label="2">
            停用<span class="desc">在用户端资源类型选择器中隐藏</span>
          </el-radio>
        </el-radio-group>
      </form-item>

      <div class="divider" />
      <div class="title">版本发行配置</div>
      <form-item label="标的物类型">
        <el-checkbox-group v-model="formData.subjectType">
          <div class="selection-line">
            <el-checkbox :label="1">独立资源</el-checkbox>
            <el-checkbox :label="4">集合资源</el-checkbox>
          </div>
        </el-checkbox-group>
      </form-item>
      <form-item label="文件提交方式" v-if="formData.resourceConfig">
        <el-checkbox-group v-model="formData.resourceConfig.fileCommitMode">
          <div class="selection-line">
            <el-checkbox :label="1">本地上传</el-checkbox>
            <el-checkbox :label="2">从存储空间导入</el-checkbox>
            <el-checkbox :label="4">文档编辑器</el-checkbox>
            <el-checkbox :label="8">漫画排版工具</el-checkbox>
            <el-checkbox :label="16">集合单品管理工具</el-checkbox>
          </div>
        </el-checkbox-group>
      </form-item>
      <form-item label="推荐上传格式（选填）">
        <el-input
          style="width: 400px"
          v-model="formData.formatsStr"
          placeholder="请输入推荐上传格式"
          clearable
          @input="formData.formatsStr = formData.formatsStr.replace('，', ',')"
        />
        <span class="desc">此设置用于筛选资源文件类型/格式, 输入“.扩展名”，用英文逗号（“,”）分隔</span>
      </form-item>
      <form-item label="文件大小限制" v-if="formData.resourceConfig">
        <el-input-number style="width: 100px" v-model="formData.resourceConfig.fileMaxSize" :controls="false" />
        <el-select v-model="formData.resourceConfig.fileMaxSizeUnit" style="width: 100px">
          <el-option v-for="item in fileMaxSizeUnitMapping" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </form-item>
      <form-item label="标准属性模板（选填）">
        <div class="btn-box">
          <div class="text-btn" @click="importParentType()"><i class="admin icon-import" />导入父类属性</div>
          <div class="text-btn" @click="openResourceList()"><i class="admin icon-plus" />添加属性</div>
        </div>
        <div id="sortableList" class="property-list">
          <div class="property-item" :data-id="item.key" v-for="(item, index) in formData.attrsArr" :key="item.key">
            {{ item.name }}
            <i class="delete-btn admin icon-X" @click="deletePropertyItem(index)" />
          </div>
        </div>
      </form-item>
      <template v-if="formData.resourceConfig">
        <form-item label="支持下载">
          <el-radio-group v-model="formData.resourceConfig.supportDownload">
            <div class="selection-line">
              <el-radio :label="2">是</el-radio>
              <el-radio :label="1">否</el-radio>
            </div>
          </el-radio-group>
        </form-item>
        <form-item label="支持编辑">
          <el-radio-group v-model="formData.resourceConfig.supportEdit">
            <div class="selection-line">
              <el-radio :label="2">是</el-radio>
              <el-radio :label="1">否</el-radio>
            </div>
          </el-radio-group>
        </form-item>
        <form-item label="自动生成封面">
          <el-radio-group v-model="formData.resourceConfig.autoGenerateCover">
            <div class="selection-line">
              <el-radio :label="2">是</el-radio>
              <el-radio :label="1">否</el-radio>
            </div>
          </el-radio-group>
        </form-item>
        <form-item label="支持批量发行">
          <el-radio-group v-model="formData.resourceConfig.supportCreateBatch">
            <div class="selection-line">
              <el-radio :label="2">是</el-radio>
              <el-radio :label="1">否</el-radio>
            </div>
          </el-radio-group>
        </form-item>
        <form-item label="支持可选配置">
          <el-radio-group v-model="formData.resourceConfig.supportOptionalConfig">
            <div class="selection-line">
              <el-radio :label="2">是</el-radio>
              <el-radio :label="1">否</el-radio>
            </div>
          </el-radio-group>
        </form-item>
      </template>
      <div class="divider" />
      <div class="title">展品展示设置</div>
      <template v-if="formData.presentableConfig">
        <form-item label="展示版本">
          <el-radio-group v-model="formData.presentableConfig.versionShowMode">
            <div class="selection-line">
              <el-radio :label="1">默认自动更新到最新版本</el-radio>
              <el-radio :label="0">默认手动更新到最新版本</el-radio>
            </div>
          </el-radio-group>
        </form-item>
      </template>
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
        <template #default="scope">{{ mappingMatching(insertModeMapping, scope.row.insertMode) }}</template>
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
import { ResourceService } from "@/api/request";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage, ElTable } from "element-plus";
import { CreateOrEditResourceTypeParams, ResourcePropertyListParams } from "@/typings/params";
import Sortable from "sortablejs";
import { ResourceProperty } from "@/typings/object";
import { mappingMatching } from "@/utils/common";

/** 父类选项 */
interface ParentType {
  code: string;
  name: string;
  parentCodeArr: string[];
  children: ParentType[];
}

/** 资源类型编辑数据 */
interface MyCreateOrEditResourceTypeParams extends CreateOrEditResourceTypeParams {
  formatsStr: string;
  parentCodeArr: string[];
  attrsArr: { name: string; key: string }[];
}

export default {
  setup() {
    const { query, switchPage } = useMyRouter();
    const tableRef = ref<InstanceType<typeof ElTable>>();
    const assetsData = {
      fileMaxSizeUnitMapping: [
        { value: 1, label: "MB" },
        { value: 2, label: "GB" },
      ],
      insertModeMapping: [
        { value: 1, label: "系统解析" },
        { value: 2, label: "手动录入" },
      ],
    };
    const data = reactive({
      loading: false,
      mode: "create" as "create" | "update",
      formData: {} as MyCreateOrEditResourceTypeParams,
      parentOptions: [] as any[],
      resourcePropertySearchData: { currentPage: 1, limit: 20, group: 1 } as ResourcePropertyListParams,
      resourcePropertyData: {
        keywords: "",
        list: [] as ResourceProperty[],
        total: 0,
        showSelected: false,
      },
      selectedResourcePropertyData: [] as { key: string; name: string }[],
      resourcePropertyPopupShow: false,
    });

    const methods = {
      /** 获取资源类型数据 */
      async getData() {
        const { code } = query.value;
        if (code) {
          // 编辑
          data.mode = "update";
          const result = await ResourceService.getResourceTypeData(code);
          const { errcode } = result.data;
          if (errcode === 0) {
            const { formats, attrs } = result.data.data;
            result.data.data.formatsStr = formats.join();
            result.data.data.attrsArr = [...attrs];
            data.formData = result.data.data;
            console.log(result.data.data)
          }
        } else {
          // 新建
          data.mode = "create";
          data.formData.formatsStr = "";
          data.formData.attrsArr = [];
          data.formData.subjectType = [];
          data.formData.presentableConfig = {
            versionShowMode: 1
          }
          data.formData.resourceConfig = {
            fileCommitMode: [1, 2],
            fileMaxSize: 200,
            fileMaxSizeUnit: 1,
            supportDownload: 1,
            supportEdit: 1,
            autoGenerateCover: 1,
            supportCreateBatch: 1,
            supportOptionalConfig: 1
          };
        }

        this.initParentList();

        setTimeout(() => {
          const sortable = new Sortable(document.getElementById("sortableList"), {
            animation: 150,
            // 结束拖拽
            onEnd() {
              const newKeyArr: string[] = sortable.toArray();
              const newAttrsArr: { name: string; key: string }[] = [];
              newKeyArr.forEach((key) => {
                const attr = data.formData.attrsArr.find((item) => item.key === key);
                if (attr) newAttrsArr.push(attr);
              });
              data.formData.attrsArr = newAttrsArr;
            },
          });
        }, 100);
      },

      /** 初始化父类选项数据 */
      async initParentList() {
        const result = await ResourceService.getResourceTypeGroupList({ codeOrName: "" });
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
      selectParentType(item: ParentType, level: number, manual = false) {
        if (data.mode === "update" && manual) return;

        data.parentOptions[level].checked = item.code;
        data.parentOptions.splice(level + 1);

        if (!item.code) {
          data.parentOptions.splice(1);
          return;
        }

        if (!item.children.length) return;

        data.parentOptions.push({ level: level + 1, list: item.children });
      },

      /** 导入父类属性 */
      async importParentType() {
        if (data.parentOptions[0].checked === undefined) {
          ElMessage("请选择父类");
          return;
        }

        let code = "";
        const parentTypeChecked = data.parentOptions.map((item) => item.checked);
        for (let i = parentTypeChecked.length - 1; i >= 0; i--) {
          if (parentTypeChecked[i] !== undefined) {
            code = parentTypeChecked[i];
            break;
          }
        }
        const result = await ResourceService.getAttributesOfResourceType(code);
        const { errcode } = result.data;
        if (errcode === 0) {
          result.data.data.forEach((item: { name: string; key: string }) => {
            const index = data.formData.attrsArr.findIndex((attrs) => attrs.key === item.key);
            if (index !== -1) return;
            data.formData.attrsArr.push(item);
          });
        }
      },

      /** 打开资源属性列表 */
      openResourceList() {
        data.resourcePropertyPopupShow = true;
        this.getResourcePropertyList(true);
        data.selectedResourcePropertyData = [...data.formData.attrsArr];
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
          const index = data.selectedResourcePropertyData.findIndex((item) => item.key === row.key);
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
      selectResources(selected: ResourceProperty[], row: ResourceProperty) {
        const index = data.selectedResourcePropertyData.findIndex((item) => item.key === row.key);
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
          const index = data.selectedResourcePropertyData.findIndex((selectedItem) => selectedItem.key === row.key);
          if (all && index === -1) {
            data.selectedResourcePropertyData.push(row);
          } else if (!all && index !== -1) {
            data.selectedResourcePropertyData.splice(index, 1);
          }
        });
      },

      /** 保存资源属性 */
      saveResourceProperty() {
        data.formData.attrsArr = [...data.selectedResourcePropertyData];
        data.resourcePropertyPopupShow = false;
      },

      /** 删除标准属性 */
      deletePropertyItem(index: number) {
        data.formData.attrsArr.splice(index, 1);
      },

      /**
       * 保存
       * @params type 保存类型 1-创建 2-保存
       */
      async save() {
        if (!validate()) return;

        const { formatsStr, attrsArr } = data.formData;
        data.formData.formats = formatsStr.split(",");
        if (attrsArr) data.formData.attrs = attrsArr.map((item) => item.key);
        const parentTypeChecked = data.parentOptions.map((item) => item.checked);
        for (let i = parentTypeChecked.length - 1; i >= 0; i--) {
          if (parentTypeChecked[i] !== undefined) {
            data.formData.parentCode = parentTypeChecked[i];
            break;
          }
        }
        const result = await ResourceService.createOrEditResourceType(data.formData, data.mode);
        const { errcode } = result.data;
        if (errcode === 0) {
          const msg = data.mode === "create" ? "创建成功" : "保存成功";
          ElMessage.success(msg);
          switchPage("/resource/type-management");
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
          son.parentCodeArr = [...parentCodeArr, son.code];
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
      const {
        name,
        priority,
        status,
        resourceConfig: { fileCommitMode },
        subjectType
      } = data.formData;
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
      } else if (fileCommitMode.length === 0) {
        ElMessage("请选择文件提交方式");
        return false;
      } else if (subjectType.length === 0) {
        ElMessage("请选择标的物类型");
        return false
      }
      return true;
    };

    methods.getData();

    return {
      mappingMatching,
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
    flex: 1;
    height: 200px;
    overflow-y: auto;
    overflow-x: hidden;

    .item {
      width: 100%;
      color: #606266;
      min-height: 34px;
      padding: 5px 20px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: space-between;
      word-break: break-all;
      cursor: pointer;

      &:hover {
        background-color: #f5f7fa;
      }

      &.active {
        color: #fff;
        background-color: #7bbdff;
      }

      .admin {
        font-size: 12px;
      }

      .stop-mark {
        color: red;
      }
    }

    & + .list {
      border-left: 1px solid #e4e7ed;
    }
  }

  &.disabled {
    background-color: #f5f7fa;

    .item {
      cursor: not-allowed;
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

    .admin {
      font-size: 14px;
      margin-right: 5px;
    }
  }

  .text-btn + .text-btn {
    margin-left: 20px;
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
    min-height: 26px;
    margin: 8px;
    border-radius: 4px;
    background: #ecf5ff;
    border: 1px solid #d9ecff;
    color: #409eff;
    display: flex;
    align-items: center;
    cursor: default;

    .delete-btn {
      flex-shrink: 0;
      font-size: 12px;
      height: 18px;
      width: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #409eff;
      border-radius: 50%;
      margin-left: 6px;
      cursor: pointer;

      &:hover {
        color: #fff;
        background: #409eff;
      }
    }
  }
}

.desc {
  margin-left: 20px;
  color: #bbb;
}

.divider {
  width: 100%;
  margin: 20px 0;
  height: 1px;
  background-color: #eee;
}

.title {
  font-size: 18px;
  color: #333;
  font-weight: bold;
  margin-bottom: 20px;
}

.selection-line {
  display: flex;

  .el-radio {
    margin-top: 0 !important;
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
