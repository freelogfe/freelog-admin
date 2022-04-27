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
        <el-select v-model="searchData.resourceType" placeholder="请选择资源类型" clearable>
          <el-option v-for="item in resourceTypeList" :key="item" :value="item" />
        </el-select>
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
                switchPage('/resource/resource-management', {
                  tag: scope.row.tagName,
                })
              "
            >
              {{ scope.row.tagName }}
            </span>
          </template>
        </el-table-column>
        <el-table-column property="count" label="使用次数" align="right" show-overflow-tooltip />
        <el-table-column label="类型">
          <template #default="scope">
            {{ typeMapping.find((item) => item.value === scope.row.tagType).label }}
          </template>
        </el-table-column>
        <el-table-column label="操作权限">
          <template #default="scope">
            {{ authorityMapping.find((item) => item.value === scope.row.authority).label }}
          </template>
        </el-table-column>
        <el-table-column label="适用类型" show-overflow-tooltip>
          <template #default="scope">
            <span v-if="scope.row.resourceRangeType === 3">所有</span>
            <span v-if="scope.row.resourceRangeType === 1">{{
              scope.row.resourceRange.length ? scope.row.resourceRange.join("、") : "-"
            }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" width="40">
          <template #header>
            <el-icon class="operation-icon" title="操作">
              <operation />
            </el-icon>
          </template>
          <template #default="scope">
            <el-icon class="icon-btn" title="编辑" @click="openTagPopup(scope.row)">
              <edit />
            </el-icon>
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
    <form-item label="标签名称">
      <div class="tag-name" v-if="operateData.tagId || operateData.tagIds">
        {{ operateData.tagName }}
      </div>
      <el-input v-model="operateData.tagName" placeholder="请输入标签" @keyup.enter="save()" v-else />
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
      <el-select style="width: 100%" v-model="operateData.resourceRangeType" clearable placeholder="请选择适用资源类型">
        <el-option v-for="item in resourceRangeTypeMapping" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </form-item>
    <form-item v-show="operateData.resourceRangeType === 1">
      <el-checkbox v-model="operateData.checkAll" :indeterminate="operateData.isIndeterminate" @change="checkAllChange">
        全选
      </el-checkbox>
      <el-checkbox-group v-model="operateData.resourceRange" @change="checkChange">
        <el-checkbox v-for="item in resourceTypeList" :key="item" :label="item">
          {{ item }}
        </el-checkbox>
      </el-checkbox-group>
    </form-item>
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
import { ResourceService } from "@/api/request";
import { Operation, Edit } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { ResourceTag } from "@/typings/object";
import { OperateResourceTagParams, ResourceTagListParams } from "@/typings/params";

/** 创建/编辑资源标签参数 */
export interface MyOperateResourceTag extends OperateResourceTagParams {
  checkAll?: boolean;
  isIndeterminate?: boolean;
}

export default {
  components: {
    Operation,
    Edit,
  },

  setup() {
    const { switchPage } = useMyRouter();
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
      resourceTypeList: ["image", "audio", "video", "markdown", "widget", "theme"],
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
      searchData: { currentPage: 1, limit: 20 } as ResourceTagListParams,
      operateData: {} as MyOperateResourceTag,
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
        const result = await ResourceService.getResourcesTagsList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data;

          if (dataList.length === 0) {
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

      // 切换全选
      checkAllChange(checkAll: boolean) {
        data.operateData.resourceRange = checkAll ? assetsData.resourceTypeList : [];
        data.operateData.isIndeterminate = false;
      },

      // 选择多选项
      checkChange(checked: string[]) {
        const checkedCount = checked.length;
        data.operateData.checkAll = checkedCount === assetsData.resourceTypeList.length;
        data.operateData.isIndeterminate = checkedCount > 0 && checkedCount < assetsData.resourceTypeList.length;
      },

      /** 打开标签弹窗（有参数为编辑，反之为创建） */
      openTagPopup(item?: ResourceTag) {
        data.operateData = {
          ...(item || ({} as ResourceTag)),
          checkAll: false,
        };
        if (item) {
          data.operateData.tagIds = [item.tagId];
          data.operateData.checkAll = item.resourceRange.length === assetsData.resourceTypeList.length;
        }
        data.tagPopupShow = true;
      },

      /** 批量编辑标签 */
      batchEditTags() {
        data.operateData = {
          tagIds: data.selectedData.map((item) => item.tagId),
          tagName: data.selectedData.map((item) => item.tagName).join("、"),
          checkAll: false,
        };
        data.tagPopupShow = true;
      },

      /** 保存 */
      async save() {
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
          this.getData();
        }
      },
    };

    /** 表单验证 */
    const validate = () => {
      const { tagIds, tagName, tagType, authority, resourceRange } = data.operateData;
      if (!tagName) {
        ElMessage("请输入标签");
        return false;
      }
      if (tagIds) return true;

      if (!tagType) {
        ElMessage("请选择标签类型");
        return false;
      }
      if (!authority) {
        ElMessage("请选择操作权限");
        return false;
      }
      if (!resourceRange) {
        ElMessage("请选择适用类型");
        return false;
      }
      return true;
    };

    methods.getData(true);

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
.tag-name {
  line-height: 32px;
  font-weight: bold;
}
</style>
