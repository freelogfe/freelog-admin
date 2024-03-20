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
          <template v-for="(list, index) in parentOptions" :key="list.level">
            <div class="list" v-if="index < 4">
              <div
                class="item"
                :class="{ active: list.checked === item.code }"
                v-for="item in list.list"
                :key="item.code"
                @click="selectParentType(item, list.level)"
              >
                {{ item.name }}
                <i class="admin icon-triangle-arrowright" v-if="index < 3 && item.children.length" />
              </div>
            </div>
          </template>
        </div>
      </form-item>
      <form-item label="映射来源">
        <div class="btn-box">
          <div class="text-btn" @click="openSourcesPopup()"><i class="admin icon-plus" />添加来源</div>
        </div>
        <div id="sortableList" class="property-list">
          <div
            class="property-item"
            :class="{ special: [4, 5, 6, 7].includes(item.type) }"
            :data-id="item.identity + item.name"
            v-for="(item, index) in formData.sourcesArr"
            :key="item.identity"
          >
            <template v-if="[1, 2, 4, 5, 6, 7].includes(item.type)">
              <i class="admin icon-type" />
              <span v-if="item.type === 4">所有基础类型</span>
              <span v-else-if="item.type === 5">{{ item.name }}/所有基础类型</span>
              <span v-else-if="item.type === 6">所有自定义类型</span>
              <span v-else-if="item.type === 7">{{ item.name }}/所有自定义类型</span>
              <span v-else>
                {{ item.parentChain.map((item) => item.name).join("/") }}
              </span>
            </template>
            <template v-if="item.type === 3">
              <i class="admin icon-tag" />
              {{ item.name }}
            </template>
            <i class="delete-btn admin icon-X" @click="deleteSources(index)" />
          </div>
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
        <el-radio-group
          v-model="formData.status"
          @change="
            formData.setStartTime = false;
            formData.myStartTime = null;
            formData.setLimitTime = false;
            formData.myLimitTime = null;
          "
        >
          <el-radio :label="1">启用<span class="desc">在资源市场分类筛选器中显示</span></el-radio>
          <template v-if="formData.status === 1">
            <el-checkbox
              style="margin-left: 20px"
              v-model="formData.setStartTime"
              label="设置启用时间"
              @change="formData.myStartTime = null"
            />
            <el-date-picker
              style="margin-left: 20px"
              v-model="formData.myStartTime"
              type="datetime"
              placeholder="请选择启用时间"
              v-if="formData.setStartTime"
            />
          </template>
          <el-radio style="margin-top: 10px" :label="2">
            停用<span class="desc">在资源市场分类筛选器中隐藏</span>
          </el-radio>
          <template v-if="formData.status === 2">
            <el-checkbox
              style="margin-left: 20px"
              v-model="formData.setLimitTime"
              label="设置停用时间"
              @change="formData.myLimitTime = null"
            />
            <el-date-picker
              style="margin-left: 20px"
              v-model="formData.myLimitTime"
              type="datetime"
              placeholder="请选择停用时间"
              v-if="formData.setLimitTime"
            />
          </template>
        </el-radio-group>
      </form-item>
    </template>
  </edit-template>

  <el-dialog v-model="sourcesPopupShow" title="选择映射来源" width="1200px" @close="closeSourcesPopup()">
    <el-tabs v-model="popupSearchData.category">
      <el-tab-pane label="基础资源类型" :name="1"></el-tab-pane>
      <el-tab-pane label="自定义资源类型" :name="2"></el-tab-pane>
      <el-tab-pane label="资源标签" :name="3"></el-tab-pane>
    </el-tabs>
    <div class="filter-bar" v-if="!popupData.showSelected">
      <form-item label="关键字搜索" v-if="[1, 2].includes(popupSearchData.category)">
        <el-input
          v-model="popupSearchData.codeOrName"
          placeholder="请输入类型编号、名称"
          clearable
          @keyup.enter="getSourcesData()"
        />
      </form-item>
      <template v-if="popupSearchData.category === 3">
        <form-item label="关键字搜索">
          <el-input
            v-model="popupSearchData.keywords"
            placeholder="请输入标签名"
            clearable
            @keyup.enter="getSourcesData()"
          />
        </form-item>
        <form-item label="类型">
          <el-select v-model="popupSearchData.tagType" placeholder="请选择类型" clearable>
            <el-option v-for="item in tagTypeMapping" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </form-item>
        <form-item label="操作权限">
          <el-select v-model="popupSearchData.authority" placeholder="请选择操作权限" clearable>
            <el-option v-for="item in authorityMapping" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </form-item>
        <form-item label="资源类型">
          <el-cascader
            v-model="popupSearchData.type"
            placeholder="请选择资源类型"
            :options="resourceTypeList"
            :props="{ label: 'name', value: 'name' }"
            clearable
          />
        </form-item>
      </template>
      <form-item>
        <el-button type="primary" @click="getSourcesData()">搜索</el-button>
      </form-item>
      <form-item>
        <el-button @click="clearPopupSearch()">重置</el-button>
      </form-item>
    </div>

    <div class="cascader-panel in-popup" v-show="[1, 2].includes(popupSearchData.category)">
      <div class="list" v-for="list in resourcesTypeOptions" :key="list.level">
        <template v-for="item in list.list" :key="item.code">
          <div
            class="item"
            :class="{
              active: selectedResourceType
                .map((selected) => selected.code + selected.name)
                .includes(item.code + item.name),
            }"
            @click="clickParentResourcesType(item, list.level)"
            v-if="item.category === popupSearchData.category"
          >
            <div>
              <span>{{ item.name }}</span>
              <span class="stop-mark" v-if="item.status === 2">（已停用）</span>
            </div>
            <i
              class="admin icon-triangle-arrowright"
              v-if="item.children.length || (popupSearchData.category === 2 && item.code && list.level === 0)"
            />
          </div>
        </template>
      </div>
    </div>

    <el-table
      ref="tableRef"
      :data="popupData.showSelected ? selectedResourceTags : popupData.list"
      stripe
      @select="selectResourceTags"
      @select-all="selectAllResourceTags"
      border
      height="400"
      v-show="popupSearchData.category === 3"
    >
      <el-table-column type="selection" align="center" />
      <el-table-column label="标签" property="tagName" min-width="100" show-overflow-tooltip />
      <el-table-column property="count" label="使用次数" align="right" show-overflow-tooltip />
      <el-table-column label="类型">
        <template #default="scope">{{ mappingMatching(typeMapping, scope.row.tagType) }}</template>
      </el-table-column>
      <el-table-column label="操作权限">
        <template #default="scope">{{ mappingMatching(authorityMapping, scope.row.authority) }}</template>
      </el-table-column>
      <el-table-column label="适用类型">
        <template #default="scope">
          <span
            v-if="
              scope.row.resourceRangeType === 3 ||
              (scope.row.resourceRangeType === 1 && scope.row.resourceRange[0] === '全部')
            "
            >所有</span
          >
          <span v-else-if="scope.row.resourceRangeType === 1">{{
            scope.row.resourceRange.length ? scope.row.resourceRange.join("、") : "-"
          }}</span>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination-box">
      <div class="selected-tip">
        <template v-if="selectedResourceTags.length">
          <div>已选{{ selectedResourceTags.length }}项</div>
          <div class="text-btn" @click="switchShowSelected()">
            {{ popupData.showSelected ? "返回" : "查看所有已选" }}
          </div>
        </template>
      </div>

      <el-pagination
        layout="total, prev, pager, next, jumper"
        v-model:currentPage="popupSearchData.currentPage"
        :total="popupData.showSelected ? selectedResourceTags.length : popupData.total"
        :page-size="popupSearchData.limit"
        @current-change="changeSourcesPage($event)"
        v-if="!popupData.showSelected && popupSearchData.category === 3"
      />
    </div>
    <div class="btns-area">
      <el-button @click="closeSourcesPopup()">取消</el-button>
      <el-button type="primary" @click="saveSources()">保存</el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { nextTick, reactive, ref, toRefs, watch } from "vue";
import { ActivitiesService, ResourceService } from "@/api/request";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage, ElTable } from "element-plus";
import { CreateOrEditClassificationParams, ResourceTagListParams } from "@/typings/params";
import Sortable from "sortablejs";
import { ResourceTag, ResourceType } from "@/typings/object";
import { formatDate, mappingMatching } from "@/utils/common";

/** 运营分类编辑数据 */
interface MyCreateOrEditClassificationParams extends CreateOrEditClassificationParams {
  parentCodeArr: string[];
  sourcesArr: Sources[];
  setStartTime: boolean;
  myStartTime: string | null;
  setLimitTime: boolean;
  myLimitTime: string | null;
}

/** 弹窗参数 */
export interface MyPopupSearchParams extends ResourceTagListParams {
  category: number;
  codeOrName?: string;
  type?: string[];
}

/** 父类选项 */
interface ParentType {
  code: string;
  name: string;
  parentCodeArr: string[];
  children: ParentType[];
  parentChain: { code: string; name: string }[];
  category?: number;
}

/** 映射来源 */
interface Sources {
  identity: string;
  type: number;
  name: string;
  parentChain: { code: string; name: string }[];
}

/** 资源类型 */
export interface MyResourceType extends ResourceType {
  parentChain: { code: string; name: string }[];
}

export default {
  setup() {
    const { query, switchPage } = useMyRouter();
    const tableRef = ref<InstanceType<typeof ElTable>>();
    const assetsData = {
      insertModeMapping: [
        { value: 1, label: "系统解析" },
        { value: 2, label: "手动录入" },
      ],
      tagTypeMapping: [
        { value: 1, label: "分类标签" },
        { value: 2, label: "运营标签" },
      ],
      authorityMapping: [
        { value: 1, label: "公开" },
        { value: 2, label: "隐藏" },
        { value: 3, label: "仅管理员可见" },
      ],
      typeMapping: [
        { value: 1, label: "分类" },
        { value: 2, label: "运营" },
      ],
    };
    const data = reactive({
      loading: false,
      mode: "create" as "create" | "update",
      formData: {} as MyCreateOrEditClassificationParams,
      parentOptions: [] as any[],
      popupSearchData: { currentPage: 1, limit: 20, category: 1 } as MyPopupSearchParams,
      resourceTypeList: [] as ResourceType[],
      resourcesTypeOptions: [] as any[],
      popupData: {
        list: [] as ResourceTag[],
        total: 0,
        showSelected: false,
      },
      selectedResourceType: [] as MyResourceType[],
      selectedResourceTags: [] as ResourceTag[],
      sourcesPopupShow: false,
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
            const { sources, startTime, limitTime } = result.data.data;
            data.formData = result.data.data;
            sources.forEach((item: Sources) => {
              item.parentChain.reverse();
            });
            data.formData.sourcesArr = [...sources];
            if (startTime) {
              data.formData.setStartTime = true;
              data.formData.myStartTime = startTime;
            }
            if (limitTime) {
              data.formData.setLimitTime = true;
              data.formData.myLimitTime = limitTime;
            }
          }
        } else {
          // 新建
          data.mode = "create";
          data.formData.sourcesArr = [];
        }

        this.initParentList();

        setTimeout(() => {
          const sortable = new Sortable(document.getElementById("sortableList"), {
            animation: 150,
            // 结束拖拽
            onEnd() {
              const newKeyArr: string[] = sortable.toArray();
              const newAttrsArr: Sources[] = [];
              newKeyArr.forEach((identity) => {
                const attr = data.formData.sourcesArr.find((item) => identity === item.identity + item.name);
                if (attr) newAttrsArr.push(attr);
              });
              data.formData.sourcesArr = newAttrsArr;
            },
          });
        }, 100);
      },

      /** 初始化父类选项数据 */
      async initParentList() {
        const result = await ActivitiesService.getClassificationGroupList("");
        const { errcode } = result.data;
        if (errcode === 0) {
          const defaultOption: ParentType = {
            code: "",
            name: "无",
            children: [],
            parentCodeArr: [""],
            parentChain: [],
          };

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

      /** 打开映射来源弹窗 */
      openSourcesPopup() {
        data.popupSearchData.category = 1;
        data.sourcesPopupShow = true;
        this.getSourcesData();
        data.selectedResourceType = [];
        data.selectedResourceTags = [];
      },

      /** 获取资源标签数据 */
      async getSourcesData() {
        const { category } = data.popupSearchData;
        if (category === 1) {
          this.getBasicResourceTypeList();
        } else if (category === 2) {
          this.getCustomResourceTypeList();
        } else if (category === 3) {
          this.getResourceTagsData(true);
        }
      },

      /** 初始化基础资源类型选项数据 */
      async getBasicResourceTypeList() {
        const { codeOrName = "", category } = data.popupSearchData;
        const result = await ResourceService.getResourceTypeGroupList({ codeOrName, category });
        const { errcode } = result.data;
        if (errcode === 0) {
          const defaultOption: ParentType = {
            code: "",
            name: "所有类型",
            children: [],
            parentCodeArr: [""],
            parentChain: [{ code: "", name: "所有类型" }],
            category,
          };
          const list = [defaultOption, ...result.data.data];
          data.resourcesTypeOptions = [{ level: 0, list }];
        }
      },

      /** 初始化自定义资源类型选项数据 */
      async getCustomResourceTypeList() {
        const { codeOrName = "", category } = data.popupSearchData;
        const basicResult = await ResourceService.getResourceTypeGroupList({ codeOrName, category: 1 });
        if (basicResult.data.errcode !== 0) return;

        const customResult = await ResourceService.getResourceTypeGroupList({ codeOrName, category });
        if (basicResult.data.errcode !== 0) return;

        const basicList = transferTypeWithChildren([...basicResult.data.data]);
        const customList = [...customResult.data.data];
        const typeList = concatTypes(basicList, customList);

        const defaultOption: ParentType = {
          code: "",
          name: "所有类型",
          children: [],
          parentCodeArr: [""],
          parentChain: [{ code: "", name: "所有类型" }],
          category,
        };
        const list = [defaultOption, ...typeList];
        data.resourcesTypeOptions = [{ level: 0, list }];
      },

      /** 获取资源标签数据 */
      async getResourceTagsData(init = false) {
        if (init) data.popupSearchData.currentPage = 1;
        const { currentPage, limit, type } = data.popupSearchData;
        data.popupSearchData.skip = (currentPage - 1) * limit;
        if (type) {
          data.popupSearchData.resourceType = type ? type[type.length - 1] : "";
        } else {
          delete data.popupSearchData.resourceType;
        }
        const result = await ResourceService.getResourcesTagsList(data.popupSearchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data;

          const ids = dataList.map((item: ResourceTag) => item.tagId).join(",");
          if (ids) {
            const results = await ResourceService.getResourcesTagUseCount({
              tagIds: ids,
            });
            dataList.forEach((tag: ResourceTag) => {
              const { tagId } = tag;
              tag.count = results.data.data.find(
                (item: { tagId: string; count: number }) => item.tagId === tagId
              ).count;
            });
          }

          data.popupData = {
            list: dataList,
            total: totalItem,
            showSelected: false,
          };
          this.updateSourcesSelections();
        }
      },

      /** 重置 */
      clearPopupSearch() {
        const { category } = data.popupSearchData;
        data.popupSearchData = {
          currentPage: 1,
          limit: 20,
          category,
        };
        this.getSourcesData();
      },

      /** 更新映射来源列表选中状态 */
      updateSourcesSelections() {
        const list = data.popupData.showSelected ? data.selectedResourceTags : data.popupData.list;
        list.forEach((row) => {
          const index = data.selectedResourceTags.findIndex((item) => item.tagId === row.tagId);
          nextTick(() => {
            tableRef.value!.toggleRowSelection(row, index !== -1);
          });
        });
      },

      /** 切换映射来源表格页码 */
      changeSourcesPage(value: number) {
        data.popupSearchData.currentPage = value;
        this.getResourceTagsData();
      },

      /** 关闭映射来源弹窗 */
      closeSourcesPopup() {
        tableRef.value!.clearSelection();
        data.sourcesPopupShow = false;
        data.selectedResourceType = [];
        data.selectedResourceTags = [];
      },

      /** 选择资源类型父类 */
      clickParentResourcesType(item: MyResourceType, level: number) {
        data.resourcesTypeOptions[level].checked = item.code;
        data.resourcesTypeOptions.splice(level + 1);

        if (item.children!.length || (data.popupSearchData.category === 2 && item.code && level === 0)) {
          // 选择非叶子类型 或 自定义类型第一级类型
          const defaultOption: ParentType = {
            code: item.code,
            name: "所有子类型",
            children: [],
            parentCodeArr: [""],
            parentChain: [
              { code: item.code, name: item.name },
              { code: item.code, name: "所有子类型" },
            ],
            category: data.popupSearchData.category,
          };
          const list = [defaultOption, ...(item.children || [])];
          data.resourcesTypeOptions.push({ level: level + 1, list });
        } else {
          if (item.name === "所有类型") {
            // 选择【所有类型】
            data.selectedResourceType = [item];
          } else if (item.name === "所有子类型") {
            // 选择【所有子类型】
            /** 清除已选的同父类子类型 */
            for (let i = data.selectedResourceType.length - 1; i >= 0; i--) {
              if (item.code === data.selectedResourceType[i].parentCode) {
                data.selectedResourceType.splice(i, 1);
              }
            }
            data.selectedResourceType.push(item);
          } else {
            // 选择常规叶子类型
            /** 清除已选的【所有类型】 */
            const allTypeIndex = data.selectedResourceType.findIndex((selected) => selected.name === "所有类型");
            if (allTypeIndex !== -1) data.selectedResourceType.splice(allTypeIndex, 1);
            /** 清除已选的【所有子类型】 */
            const allSubTypeIndex = data.selectedResourceType.findIndex(
              (selected) => selected.name === "所有子类型" && item.parentCode === selected.code
            );
            if (allSubTypeIndex !== -1) data.selectedResourceType.splice(allTypeIndex, 1);

            const index = data.selectedResourceType.findIndex((selected) => selected.code === item.code);
            if (index === -1) {
              // 非选中状态
              const parentChain: { code: string; name: string }[] = [];
              data.resourcesTypeOptions.forEach((group) => {
                const checkedType = group.list.find((type: MyResourceType) => type.code === group.checked);
                parentChain.push({ code: checkedType.code, name: checkedType.name });
              });
              data.selectedResourceType.push({ ...item, parentChain });
            } else {
              // 已选中状态
              data.selectedResourceType.splice(index, 1);
            }
          }
        }
      },

      /** 切换资源标签列表显示内容 */
      switchShowSelected() {
        data.popupData.showSelected = !data.popupData.showSelected;
        this.updateSourcesSelections();
      },

      /** 选择资源标签表格项 */
      selectResourceTags(selected: ResourceTag[], row: ResourceTag) {
        const index = data.selectedResourceTags.findIndex((item) => item.tagId === row.tagId);
        if (index === -1) {
          data.selectedResourceTags.push(row);
        } else {
          data.selectedResourceTags.splice(index, 1);
        }
      },

      /** 全选资源标签表格项 */
      selectAllResourceTags(selected: ResourceTag[]) {
        const all = selected.length !== 0;
        data.popupData.list.forEach((row) => {
          const index = data.selectedResourceTags.findIndex((selectedItem) => selectedItem.tagId === row.tagId);
          if (all && index === -1) {
            data.selectedResourceTags.push(row);
          } else if (!all && index !== -1) {
            data.selectedResourceTags.splice(index, 1);
          }
        });
      },

      /** 保存映射来源 */
      saveSources() {
        const { category } = data.popupSearchData;
        if ([1, 2].includes(category)) {
          data.selectedResourceType.forEach((selected) => {
            let type = category;
            let name = selected.name;
            if (selected.name === "所有类型") type = category === 1 ? 4 : 6;
            if (selected.name === "所有子类型") {
              type = category === 1 ? 5 : 7;
              name = selected.parentChain[selected.parentChain.length - 2].name;
            }
            const index = data.formData.sourcesArr.findIndex(
              (item) => selected.code === item.identity && type === item.type
            );
            if (index !== -1) return;

            data.formData.sourcesArr.push({
              identity: selected.code,
              name,
              type,
              parentChain: selected.parentChain || [],
            });
          });
        } else if (category === 3) {
          data.selectedResourceTags.forEach((selected) => {
            const index = data.formData.sourcesArr.findIndex((item) => selected.tagId === item.identity);
            if (index !== -1) return;

            data.formData.sourcesArr.push({
              identity: selected.tagId,
              name: selected.tagName,
              type: 3,
              parentChain: [],
            });
          });
        }
        data.sourcesPopupShow = false;
      },

      /** 删除映射来源*/
      deleteSources(index: number) {
        data.formData.sourcesArr.splice(index, 1);
      },

      /**
       * 保存
       * @params type 保存类型 1-创建 2-保存
       */
      async save() {
        if (!validate()) return;

        const { sourcesArr, status, setStartTime, myStartTime, setLimitTime, myLimitTime } = data.formData;
        if (sourcesArr) data.formData.sources = sourcesArr;
        if (status === 1) delete data.formData.limitTime;
        if (status === 2) delete data.formData.startTime;
        if (status === 1 && setStartTime && myStartTime) data.formData.startTime = formatDate(myStartTime);
        if (status === 1 && !setStartTime) delete data.formData.startTime;
        if (status === 2 && setLimitTime && myLimitTime) data.formData.limitTime = formatDate(myLimitTime);
        if (status === 2 && !setLimitTime) delete data.formData.limitTime;
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
          switchPage("/operation/classification-management");
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
      const { name, priority, status, setStartTime, myStartTime, setLimitTime, myLimitTime } = data.formData;
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
      } else if (status === 1 && setStartTime && !myStartTime) {
        ElMessage("请选择启用时间");
        return false;
      } else if (status === 2 && setLimitTime && !myLimitTime) {
        ElMessage("请选择停用时间");
        return false;
      } else if (myStartTime) {
        const startTime = new Date(myStartTime).getTime();
        const now = Date.now();
        if (startTime <= now) {
          ElMessage("启用时间不可早于当前时间");
          return false;
        }
      } else if (myLimitTime) {
        const limitTime = new Date(myLimitTime).getTime();
        const now = Date.now();
        if (limitTime <= now) {
          ElMessage("停用时间不可早于当前时间");
          return false;
        }
      }
      return true;
    };

    /** 获取资源类型 */
    const getResourceTypes = async () => {
      const result = await ResourceService.getResourceTypeGroupList({ codeOrName: "" });
      const { errcode } = result.data;
      if (errcode === 0) {
        data.resourceTypeList = result.data.data;
      }
    };

    /** 转换资源类型中有子级的选项 */
    const transferTypeWithChildren = (items: ParentType[], first = true) => {
      items.forEach((item) => {
        if (first) {
          item.category = 2;
        } else {
          item.category = item.children.length ? 2 : 1;
        }
        if (item.children.length) item.children = transferTypeWithChildren(item.children, false);
      });

      return items;
    };

    /** 结合基础资源类型与自定义资源类型 */
    const concatTypes = (basicItems: ParentType[], customItems: ParentType[]) => {
      const items: ParentType[] = [...basicItems];
      customItems.forEach((custom) => {
        const index = items.findIndex((basic) => basic.code === custom.code);
        if (index !== -1) {
          items[index].children = concatTypes(items[index].children, custom.children);
        } else {
          items.push(custom);
        }
      });

      return items;
    };

    watch(
      () => data.popupSearchData.category,
      (cur) => {
        data.popupSearchData = {
          currentPage: 1,
          limit: 20,
          category: cur,
        };
        data.selectedResourceType = [];
        data.selectedResourceTags = [];
        methods.getSourcesData();
      }
    );

    methods.getData();
    getResourceTypes();

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

  &.in-popup .list {
    height: 400px;
  }

  .list {
    height: 200px;
    overflow-y: auto;
    overflow-x: hidden;

    .item {
      width: 180px;
      color: #606266;
      min-height: 34px;
      line-height: 34px;
      padding: 5px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;

      & + .item {
        margin-top: 2px;
      }

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
    color: #606266;
    display: flex;
    align-items: center;
    cursor: default;

    &.special {
      color: #9090ff;

      .admin {
        color: #9090ff;
      }
    }

    .admin {
      font-size: 16px;
      margin-right: 5px;
    }

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
