<!-- 资源标签管理 -->
<template>
  <list-template>
    <template v-slot:barLeft v-if="selectedData.length">
      <el-button type="primary" @click="batchEditTags()">编辑</el-button>
      <span class="selected-tip">已选中{{ selectedData.length }}条</span>
    </template>

    <template v-slot:barRight>
      <el-button type="primary" @click="openTagPopup()">创建标签</el-button>
    </template>

    <template v-slot:filterBar>
      <div class="filter-controls">
        <form-item label="关键字搜索">
          <el-input v-model="searchData.keywords" placeholder="请输入标签名" clearable @keyup.enter="getData(true)" />
        </form-item>
        <form-item label="类型">
          <el-select v-model="searchData.tagType" placeholder="请选择类型" clearable>
            <el-option v-for="item in tagTypeMapping" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </form-item>
        <form-item label="操作权限">
          <el-select v-model="searchData.authority" placeholder="请选择操作权限" clearable>
            <el-option v-for="item in authorityMapping" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </form-item>
        <form-item label="资源类型">
          <el-cascader
            v-model="searchData.type"
            placeholder="请选择资源类型"
            :options="resourceTypeList"
            :props="{ label: 'name', value: 'name' }"
            clearable
          />
        </form-item>
      </div>
      <div class="filter-btns">
        <el-button type="primary" @click="getData(true)">搜索</el-button>
        <el-button @click="clearSearch()">重置</el-button>
      </div>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" stripe @selection-change="selectTable" v-loading="loading">
        <el-table-column type="selection" />
        <el-table-column label="标签" min-width="100" show-overflow-tooltip>
          <template #default="scope">
            <span class="text-btn" @click="openPage('/resource/resource-management', { tag: scope.row.tagName })">
              {{ scope.row.tagName }}
            </span>
          </template>
        </el-table-column>
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
        <el-table-column fixed="right" width="40">
          <template #default="scope">
            <i class="icon-btn admin icon-edit" title="编辑" @click="openTagPopup(scope.row)" />
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

  <el-dialog v-model="tagPopupShow" :title="operateData.tagId || operateData.tagIds ? '编辑标签' : '创建标签'">
    <div class="tag-popup-body">
      <form-item label="标签名称">
        <div class="tag-name" v-if="operateData.tagId || operateData.tagIds">
          {{ operateData.tagName }}
        </div>
        <el-input v-model="operateData.tagName" placeholder="请输入标签" @keyup.enter="save()" v-else />
      </form-item>
      <form-item label="标签说明">
        <el-input v-model="operateData.tagNote" placeholder="请输入标签说明" @keyup.enter="save()" />
      </form-item>
      <form-item label="标签类型">
        <el-select style="width: 100%" v-model="operateData.tagType" clearable placeholder="请选择标签类型">
          <el-option v-for="item in tagTypeMapping" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </form-item>
      <form-item label="操作权限">
        <el-select style="width: 100%" v-model="operateData.authority" clearable placeholder="请选择操作权限">
          <el-option v-for="item in authorityMapping" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </form-item>
      <form-item label="适用资源类型">
        <el-select
          style="width: 100%"
          v-model="operateData.resourceRangeType"
          clearable
          placeholder="请选择适用资源类型"
          @change="operateData.resourceRange = []"
        >
          <el-option
            v-for="item in resourceRangeTypeMapping"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </form-item>
      <form-item v-show="operateData.resourceRangeType === 1">
        <el-tree
          ref="resourceTypeTree"
          :data="[{ name: '全部', children: resourceTypeList }]"
          node-key="name"
          :default-expanded-keys="['全部']"
          :props="{ label: 'name' }"
          show-checkbox
        />
      </form-item>
    </div>
    <template #footer>
      <el-button @click="tagPopupShow = false">取消</el-button>
      <el-button type="primary" @click="save()">保存</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { nextTick, reactive, ref, toRefs } from "vue";
import { formatDate, mappingMatching, relativeTime } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ResourceService } from "@/api/request";
import { ElMessage, ElTree } from "element-plus";
import { ResourceTag, ResourceType } from "@/typings/object";
import { OperateResourceTagParams, ResourceTagListParams } from "@/typings/params";

/** 获取资源标签参数 */
export interface MyResourceTagListParams extends ResourceTagListParams {
  type?: string[];
}

/** 资源标签操作参数 */
export interface MyOperateResourceTagParams extends OperateResourceTagParams {
  tagId?: string;
}

export default {
  setup() {
    const { openPage } = useMyRouter();
    const assetsData = {
      tagTypeMapping: [
        { value: 1, label: "分类标签" },
        { value: 2, label: "运营标签" },
      ],
      authorityMapping: [
        { value: 1, label: "公开" },
        { value: 2, label: "隐藏" },
        { value: 3, label: "仅管理员可见" },
      ],
      resourceRangeTypeMapping: [
        { value: 1, label: "部分类型" },
        // { value: 2, label: "排除类型" },
        { value: 3, label: "所有类型" },
      ],
      typeMapping: [
        { value: 1, label: "分类" },
        { value: 2, label: "运营" },
      ],
    };
    const data = reactive({
      loading: false,
      tableData: [] as ResourceTag[],
      total: 0,
      selectedData: [] as ResourceTag[],
      searchData: { currentPage: 1, limit: 20 } as MyResourceTagListParams,
      resourceTypeList: [] as ResourceType[],
      operateData: {} as MyOperateResourceTagParams,
      tagPopupShow: false,
    });
    const resourceTypeTree = ref<InstanceType<typeof ElTree>>();

    const methods = {
      /** 获取页面数据 */
      async getData(init = false) {
        data.tableData = [];
        data.loading = true;
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit, type } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        if (type) {
          data.searchData.resourceType = type ? type[type.length - 1] : "";
        } else {
          delete data.searchData.resourceType;
        }
        const result = await ResourceService.getResourcesTagsList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data;

          if (dataList.length === 0) {
            data.total = 0;
            data.loading = false;
            return;
          }

          const ids = dataList
            .map((item: ResourceTag) => {
              return item.tagId;
            })
            .join(",");
          const results = await ResourceService.getResourcesTagUseCount({
            tagIds: ids,
          });
          dataList.forEach((tag: ResourceTag) => {
            const { tagId } = tag;
            tag.count = results.data.data.find((item: { tagId: string; count: number }) => item.tagId === tagId).count;
          });

          data.tableData = dataList;
          data.total = totalItem;
          data.loading = false;
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

      /** 切换表格页码 */
      changePage(value: number) {
        data.searchData.currentPage = value;
        this.getData();
      },

      /** 选择表格项 */
      selectTable(selected: ResourceTag[]) {
        data.selectedData = selected;
      },

      /** 打开标签弹窗（有参数为编辑，反之为创建） */
      openTagPopup(item?: ResourceTag) {
        data.operateData = { ...(item || ({} as ResourceTag)) };
        if (item) {
          data.operateData.tagIds = [item.tagId];
          nextTick(() => {
            resourceTypeTree.value!.setCheckedKeys(item.resourceRange, false);
          });
        }
        data.tagPopupShow = true;
      },

      /** 批量编辑标签 */
      batchEditTags() {
        data.operateData = {
          tagIds: data.selectedData.map((item) => item.tagId),
          tagName: data.selectedData.map((item) => item.tagName).join("、"),
        };
        data.tagPopupShow = true;
      },

      /** 保存 */
      async save() {
        data.operateData.resourceRange = resourceTypeTree.value!.getCheckedKeys(false) as string[];
        if (!validate()) return;

        const { tagIds } = data.operateData;
        let result;
        if (tagIds) {
          // 编辑
          result = await ResourceService.updateResourceTag(data.operateData);
        } else {
          // 创建
          result = await ResourceService.createResourceTag(data.operateData);
        }
        const { errcode } = result.data;
        if (errcode === 0) {
          data.tagPopupShow = false;
          this.getData(true);
        }
      },
    };

    /** 表单验证 */
    const validate = () => {
      const { tagName, tagType, authority, resourceRangeType, resourceRange = [] } = data.operateData;
      if (!tagName) {
        ElMessage("请输入标签");
        return false;
      }
      if (!tagType) {
        ElMessage("请选择标签类型");
        return false;
      }
      if (!authority) {
        ElMessage("请选择操作权限");
        return false;
      }
      if (!resourceRangeType || (resourceRangeType === 1 && resourceRange.length === 0)) {
        ElMessage("请选择适用类型");
        return false;
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

    methods.getData(true);
    getResourceTypes();

    return {
      mappingMatching,
      ...assetsData,
      ...toRefs(data),
      resourceTypeTree,
      ...methods,
      formatDate,
      openPage,
      relativeTime,
    };
  },
};
</script>

<style lang="scss" scoped>
.tag-popup-body {
  max-height: 50vh;
  overflow-y: auto;

  .tag-name {
    line-height: 32px;
    font-weight: bold;
  }
}
</style>
