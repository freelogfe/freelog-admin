<!-- 翻译标签管理 -->
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
        <el-table-column label="标签" min-width="100" show-overflow-tooltip>
          <template #default="scope">
            <span
              class="text-btn"
              @click="
                switchPage('/i18n/translation-management', {
                  tag: scope.row.tagName,
                })
              "
            >
              {{ scope.row.tagName }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="" align="right">
          <template #default="scope">{{ scope.row.num }} keys</template>
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

  <el-dialog v-model="tagPopupShow" :title="operateData._id ? '编辑标签' : '创建标签'">
    <el-input v-model="operateData.tagName" placeholder="请输入标签" @keyup.enter="save()" />
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
import { InternationalizationService, NodeService } from "@/api/request";
import { Operation, Edit, Delete } from "@element-plus/icons-vue";
import { TranslationTag } from "@/typings/object";
import { ListParams } from "@/typings/params";

export default {
  components: {
    Operation,
    Edit,
    Delete,
  },

  setup() {
    const { switchPage } = useMyRouter();
    const data = reactive({
      loading: false,
      tableData: [] as TranslationTag[],
      total: 0,
      selectedData: [] as TranslationTag[],
      searchData: { currentPage: 1, limit: 20 } as ListParams,
      operateData: {} as TranslationTag,
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
        const result = await InternationalizationService.getTranslationTagList(data.searchData);
        const {
          errcode,
          data: { i18nTags, num },
        } = result.data;
        if (errcode === 0) {
          if (i18nTags.length === 0) {
            data.loading = false;
            return;
          }

          data.tableData = i18nTags;
          data.total = num;
          data.loading = false;
        }
      },

      /** 重置 */
      clearSearch() {
        data.searchData = { currentPage: 1, limit: 20 };
        this.getData(true);
      },

      /** 切换表格页码 */
      changePage(value: number) {
        data.searchData.currentPage = value;
        this.getData();
      },

      /** 打开标签弹窗（有参数为编辑，反之为创建） */
      openTagPopup(item?: TranslationTag) {
        data.operateData = { ...(item || ({} as TranslationTag)) };
        data.tagPopupShow = true;
      },

      /** 删除操作 */
      deleteTag(tags: TranslationTag[]) {
        const tagName = tags.map((item) => "【" + item.tagName + "】").join("、");
        ElMessageBox.confirm(`确认删除${tagName}？`, "删除标签", {
          confirmButtonText: "删除",
          cancelButtonText: "取消",
        }).then(async () => {
          const _ids = tags.map((item) => item._id);
          const result = await InternationalizationService.deleteTranslationTag({ _ids });
          const { errcode } = result.data;
          if (errcode === 0) {
            this.getData();
          }
        });
      },

      /** 保存 */
      async save() {
        if (!validate()) return;

        const { _id, tagName } = data.operateData;
        let result;
        if (_id) {
          result = await InternationalizationService.editTranslationTag({ _id, tagName });
        } else {
          result = await InternationalizationService.createTranslationTag({ tagName });
        }
        const { errcode } = result.data;
        if (errcode === 0) {
          data.tagPopupShow = false;
          this.getData();
        }
      },

      /** 选择表格项 */
      selectTable(selected: TranslationTag[]) {
        data.selectedData = selected;
      },
    };

    /** 表单验证 */
    const validate = () => {
      const { tagName } = data.operateData;
      if (!tagName) {
        ElMessage("请输入标签");
        return false;
      }
      return true;
    };

    methods.getData(true);

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
