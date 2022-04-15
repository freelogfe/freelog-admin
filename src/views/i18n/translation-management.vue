<!-- 翻译管理 -->
<template>
  <list-template>
    <template v-slot:hidden>
      <input id="copyInput" v-model="copyValue" />
      <input ref="uploader" type="file" accept=".xlsx, .xls" @change="uploadFile" />
    </template>

    <template v-slot:barLeft>
      <span class="selected-tip" v-show="selectedData.length">已选中{{ selectedData.length }}条</span>
    </template>

    <template v-slot:barRight>
      <el-button type="primary" @click="setTag()">新建翻译</el-button>
      <el-button type="primary" @click="importData()" :loading="importLoading">批量导入</el-button>
      <el-button type="primary" @click="exportData()" :loading="exportLoading">批量导出</el-button>
      <el-button type="primary" @click="setTag()">批量添加标签</el-button>
      <el-button type="primary" @click="switchPage('/i18n/tag-management')">管理标签</el-button>
    </template>

    <template v-slot:filterBar>
      <form-item label="关键字搜索">
        <el-input
          style="width: 250px"
          v-model="searchData.keywords"
          placeholder="请输入key、翻译内容"
          clearable
          @keyup.enter="getData()"
        />
      </form-item>
      <form-item label="标签">
        <el-select v-model="searchData.tags" multiple placeholder="请选择标签" clearable>
          <el-option v-for="item in translationTagsList" :key="item.tagId" :label="item.tag" :value="item.tagId" />
        </el-select>
      </form-item>
      <form-item label="状态">
        <el-select v-model="searchData.status" placeholder="请选择状态" clearable>
          <el-option v-for="item in translationTagsList" :key="item.tagId" :label="item.tag" :value="item.tagId" />
        </el-select>
      </form-item>
      <form-item>
        <el-button type="primary" @click="getData()">搜索</el-button>
        <el-button @click="clearSearch()">重置</el-button>
      </form-item>
    </template>

    <template v-slot:table>
      <div class="main-area">
        <el-table
          ref="tableRef"
          :style="{ width: activeItem ? '400px' : '100%' }"
          :data="tableData"
          stripe
          @selection-change="selectTable"
          highlight-current-row
          @row-click="clickRow($event)"
          v-loading="loading"
        >
          <el-table-column type="selection" />
          <el-table-column property="username" label="key" width="200" />
          <el-table-column property="username" label="zh-CN" width="200" v-if="!activeItem" />
          <el-table-column property="username" label="en-US" width="200" v-if="!activeItem" />
          <el-table-column property="username" label="描述" width="200" v-if="!activeItem" />
          <el-table-column label="标签" width="250" v-if="!activeItem">
            <template #default="scope">
              <div class="tags-box">
                <el-tag class="tag" v-for="item in scope.row.tags" :key="item.tagId">
                  {{ item.tag }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="状态">
            <template #default="scope">
              {{ statusMapping.find((item) => item.value === scope.row.status).label }}
            </template>
          </el-table-column>
        </el-table>

        <div class="edit-area" v-if="activeItem">
          <div class="edit-content">
            <div class="top-bar">
              <div class="item-info">
                <div class="item-key">
                  <span>{{ activeItem.username }}</span>
                  <el-icon class="icon-btn" title="复制" @click="copy(activeItem.username)">
                    <copy-document />
                  </el-icon>
                </div>
                <div class="item-status">
                  {{ statusMapping.find((item) => item.value === activeItem.status).label }}
                </div>
              </div>
              <div class="item-btns">
                <el-button @click="cancel()">取消</el-button>
                <el-button type="primary" @click="save(1)">保存</el-button>
                <el-button type="success" @click="save(2)">保存并提交</el-button>
              </div>
            </div>

            <div class="item-form">
              <div class="form-row">
                <div class="form-item">
                  <div class="item-label">Chinese, China(zh-CN) 默认语言</div>
                  <el-input v-model="activeItem.username" :rows="6" type="textarea" />
                </div>
                <div class="form-item">
                  <div class="item-label">English, United States(en-US)</div>
                  <el-input v-model="activeItem.username" :rows="6" type="textarea" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-item">
                  <div class="item-label">备注</div>
                  <el-input v-model="activeItem.remark" :rows="4" type="textarea" />
                </div>
                <div class="form-item">
                  <div class="item-label">标签</div>
                  <el-select style="width: 100%" v-model="activeItem.tags" multiple clearable>
                    <el-option
                      v-for="item in translationTagsList"
                      :key="item.tagId"
                      :label="item.tag"
                      :value="item.tagId"
                    />
                  </el-select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </list-template>

  <el-dialog v-model="setTagPopupShow" title="管理翻译标签">
    <el-select style="width: 100%" v-model="setTagData.tags" multiple clearable placeholder="请选择标签">
      <el-option v-for="item in translationTagsList" :key="item.tagId" :label="item.tag" :value="item.tagId" />
    </el-select>
    <el-input
      style="margin-top: 10px"
      v-model="setTagData.newTag"
      placeholder="输入标签按回车键确认"
      @keyup.enter="newTag()"
    />
    <template #footer>
      <el-button @click="setTagPopupShow = false">取消</el-button>
      <el-button type="primary" @click="setTagConfirm()">确认</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { nextTick, reactive, ref, toRefs } from "vue";
import { formatDate, relativeTime } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage, ElTable } from "element-plus";
import { UserService } from "@/api/request";
import { dateRangeShortcuts } from "@/assets/data";
import { ListParams } from "@/api/interface";
import { CopyDocument } from "@element-plus/icons-vue";
import XLSX from "xlsx";

/** 翻译数据 */
export interface Translation {
  userId: number;
  username: string;
  tags: any[];
  latestLoginDate: string;
  createdResourceCount: number;
  createdNodeCount: number;
  signedContractCount: number;
  tradeCount: number;
  balance: string;
  mobile: string;
  email: string;
  createDate: string;
  status: 0 | 1 | 2 | 3;
}

/** 翻译标签数据 */
export interface TranslationTag {
  tagId: string;
  tag: string;
}

export default {
  components: {
    CopyDocument,
  },

  setup() {
    const { switchPage } = useMyRouter();
    const assetsData = {
      statusMapping: [
        { value: 0, label: "正常" },
        { value: 1, label: "冻结" },
        { value: 2, label: "待审核" },
        { value: 3, label: "未通过" },
      ],
    };
    const data = reactive({
      loading: false,
      importLoading: false,
      exportLoading: false,
      tableData: [] as Translation[],
      selectedData: [] as Translation[],
      translationTagsList: [] as TranslationTag[],
      searchData: {
        limit: 100,
      } as ListParams,
      setTagData: {} as any,
      copyValue: "",
      activeItem: null as Translation | null,
      setTagPopupShow: false,
    });
    const tableRef = ref<InstanceType<typeof ElTable>>();
    const uploader = ref<InstanceType<any>>();

    const methods = {
      /** 获取列表数据 */
      async getData() {
        data.activeItem = null;
        data.tableData = [];
        data.loading = true;
        const { tags = [] } = data.searchData;
        data.searchData.tagIds = tags.join(",");
        const result = await UserService.getUserList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList } = result.data.data;

          if (dataList.length === 0) {
            data.loading = false;
            return;
          }

          data.tableData = dataList;
          data.loading = false;
        }
      },

      /** 重置 */
      clearSearch() {
        data.searchData = {
          limit: 100,
        };
        this.getData();
      },

      /** 复制 */
      copy(value: string) {
        data.copyValue = value;
        nextTick(() => {
          const input: any = document.getElementById("copyInput");
          input.select();
          document.execCommand("Copy");
          ElMessage.success(`${value}已复制`);
        });
      },

      /** 取消编辑 */
      cancel() {
        data.activeItem = null;
        // eslint-disable-next-line
        tableRef.value!.setCurrentRow(null);
      },

      /** 选择表格项 */
      selectTable(selected: Translation[]) {
        data.selectedData = selected;
      },

      /** 选择列表单项 */
      clickRow(item: Translation) {
        data.activeItem = { ...item };
      },

      /** 导入 */
      importData() {
        uploader.value.click();
      },

      /** 上传文件 */
      uploadFile(e: { target: { files: FileList } }) {
        const { files } = e.target;
        const rawFile = files[0];
        if (!rawFile) return;
        this.readerData(rawFile);
      },

      /** 读取数据 */
      readerData(rawFile: Blob) {
        data.importLoading = true;
        const reader = new FileReader();
        reader.readAsArrayBuffer(rawFile);
        reader.onload = (e: any) => {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const results = XLSX.utils.sheet_to_json(worksheet);
          data.importLoading = false;
          console.log(results);
        };
      },

      /** 导出 */
      exportData() {
        data.exportLoading = true;
        import("./Export2Excel").then((excel) => {
          const header = ["key*", "zh-CN*", "en-US", "description", "tag"];
          const keys = ["userId", "username", "mobile", "email", "tags"];
          const result = this.filterKeys(keys);
          excel.export_json_to_excel({
            header,
            data: result,
            filename: `freelog_keys_${formatDate(new Date())}`,
            autoWidth: true,
            bookType: "xlsx",
          });
          data.exportLoading = false;
        });
      },

      /** 筛选需要的字段 */
      filterKeys(keys: string[]) {
        return data.tableData.map((item: any) => keys.map((key) => item[key]));
      },

      /** 设置翻译标签 */
      setTag(item?: Translation) {
        if (item) {
          data.setTagData.translations = [item];
          data.setTagData.tags = item.tags.map((item) => item.tagId);
        } else {
          if (data.selectedData.length === 0) {
            ElMessage.info("请选择需要管理翻译标签的条目");
            return;
          }
          data.setTagData.translations = data.selectedData;
          data.setTagData.tags = [];
        }
        data.setTagPopupShow = true;
      },

      /** 添加新标签 */
      async newTag() {
        const { newTag } = data.setTagData;
        if (!newTag) return;

        const existTag = data.translationTagsList.find((item) => item.tag === newTag);

        if (existTag) {
          if (data.setTagData.tags.includes(existTag.tagId)) {
            // 输入的标签已选择
            return;
          }

          // 输入的标签已存在且未选择，直接选择该标签
          data.setTagData.tags.push(existTag.tagId);
          data.setTagData.newTag = "";
          return;
        }

        const result = await UserService.createUserTag({
          tags: [data.setTagData.newTag],
        });
        const { errcode } = result.data;
        if (errcode === 0) {
          const newTag = result.data.data[0];
          data.translationTagsList.push(newTag);
          data.setTagData.tags.push(newTag.tagId);
          data.setTagData.newTag = "";
        }
      },

      /** 设置翻译标签 */
      async setTagConfirm() {
        const { translations, tags } = data.setTagData;
        let addTags = [];
        if (translations.length === 1) {
          // 非批量操作，统计删除标签与添加标签
          const translation = translations[0];
          const deleteTags = [] as number[];
          translation.tags.forEach((item: { tagId: number }) => {
            const { tagId } = item;
            if (!tags.includes(tagId)) deleteTags.push(tagId);
          });
          tags.forEach((id: number) => {
            if (!translation.tags.find((item: { tagId: number }) => item.tagId === id)) {
              addTags.push(id);
            }
          });
          if (deleteTags.length !== 0) {
            // 存在删除标签，执行删除
            const result = await UserService.unsetTag(translation.userId, {
              tagIds: deleteTags,
            });
            const { errcode } = result.data;
            if (errcode !== 0) return;
            if (addTags.length === 0) {
              data.setTagPopupShow = false;
              this.getData();
            }
          }
        } else {
          // 批量操作，无删除标签，所有所选标签为添加标签
          addTags = tags;
        }
        if (addTags.length !== 0) {
          // 存在添加标签，执行添加
          const userIds = translations.map((item: Translation) => item.userId);
          const result = await UserService.setTag({ userIds, tagIds: addTags });
          const { errcode } = result.data;
          if (errcode === 0) {
            data.setTagPopupShow = false;
            this.getData();
          }
        }
      },

      /** 删除翻译标签 */
      async removeTag(userId: number, tagId: number) {
        const result = await UserService.unsetTag(userId, {
          tagIds: [tagId],
        });
        const { errcode } = result.data;
        if (errcode === 0) {
          const item = data.tableData.find((translation) => translation.userId === userId);
          if (!item) return;
          item.tags = item.tags.filter((tag) => tag.tagId !== tagId);
        }
      },
    };

    /** 获取翻译标签 */
    const getUserTags = async () => {
      const result = await UserService.getUserTagsList();
      data.translationTagsList = result.data.data;
    };

    methods.getData();
    getUserTags();

    return {
      dateRangeShortcuts,
      ...assetsData,
      ...toRefs(data),
      tableRef,
      uploader,
      ...methods,
      formatDate,
      switchPage,
      relativeTime,
    };
  },
};
</script>

<style lang="scss" scoped>
.main-area {
  width: 100%;
  display: flex;

  :deep .el-table__body tr.current-row > td.el-table__cell {
    background-color: #d7eaff;
  }

  .edit-area {
    flex: 1;
    border-radius: 6px;
    margin-left: 2px;
    padding: 20px;
    box-sizing: border-box;
    border-radius: 6px;
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);

    .edit-content {
      position: sticky;
      top: 20px;

      .top-bar {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;

        .item-info {
          display: flex;
          align-items: center;

          .item-key {
            font-size: 20px;
            font-weight: bold;
          }

          .item-status {
            margin-left: 20px;
            font-size: 14px;
          }
        }
      }

      .item-form {
        margin-top: 20px;

        .form-row {
          display: flex;

          & + .form-row {
            margin-top: 40px;
          }

          .form-item {
            flex: 1;

            & + .form-item {
              margin-left: 20px;
            }

            .item-label {
              font-size: 14px;
              color: #666;
              margin-bottom: 10px;
            }
          }
        }
      }
    }
  }
}
</style>
