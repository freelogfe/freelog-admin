<!-- 翻译管理 -->
<template>
  <list-template>
    <template v-slot:hidden>
      <input id="copyInput" v-model="copyValue" />
    </template>

    <template v-slot:barLeft>
      <template v-if="selectedData.length">
        <el-button type="primary" @click="batchAddTag()">添加标签</el-button>
        <span class="selected-tip">已选中{{ selectedData.length }}条</span>
      </template>
      <span class="selected-tip" v-else>共{{ tableData.length }}条</span>
    </template>

    <template v-slot:barRight>
      <el-button type="primary" @click="switchPage('/i18n/tag-management')">管理标签</el-button>
      <el-button type="primary" @click="publishAll()">批量提交</el-button>
      <el-button type="primary" @click="importFile()">导入</el-button>
      <el-button type="primary" @click="exportData()" :loading="exportLoading">导出</el-button>
      <el-button type="primary" @click="createTranslation()">新建翻译</el-button>
    </template>

    <template v-slot:filterBar>
      <div class="filter-controls">
        <form-item label="key">
          <el-input
            style="width: 250px"
            v-model="searchData.key"
            placeholder="请输入key"
            clearable
            @keyup.enter="getData()"
          />
        </form-item>
        <form-item label="译文">
          <el-input
            style="width: 250px"
            v-model="searchData.content"
            placeholder="请输入译文"
            clearable
            @keyup.enter="getData()"
          />
        </form-item>
        <form-item label="标签">
          <el-select v-model="searchData.tagIds" multiple placeholder="请选择标签" clearable>
            <el-option v-for="item in translationTagsList" :key="item._id" :label="item.tagName" :value="item._id" />
          </el-select>
        </form-item>
        <form-item label="状态">
          <el-select v-model="searchData.status" placeholder="请选择状态" clearable>
            <el-option v-for="item in statusMapping" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </form-item>
      </div>
      <div class="filter-btns">
        <el-button type="primary" @click="getData()">搜索</el-button>
        <el-button @click="clearSearch()">重置</el-button>
      </div>
    </template>

    <template v-slot:table>
      <div class="main-area">
        <el-table
          ref="tableRef"
          :style="{ width: editData ? '400px' : '100%' }"
          :data="tableData"
          stripe
          @selection-change="selectTable"
          highlight-current-row
          @row-click="clickRow($event)"
          v-loading="loading"
        >
          <el-table-column type="selection" />
          <el-table-column property="key" label="key" min-width="200" />
          <el-table-column label="zh-CN" min-width="300" v-if="!editData">
            <template #default="scope">
              {{ scope.row.value.zh ? scope.row.value.zh.content || "-" : "-" }}
            </template>
          </el-table-column>
          <el-table-column label="en-US" min-width="300" v-if="!editData">
            <template #default="scope">
              {{ scope.row.value.en ? scope.row.value.en.content || "-" : "-" }}
            </template>
          </el-table-column>
          <el-table-column label="标签" min-width="100" v-if="!editData">
            <template #default="scope">
              <div class="tags-box" v-if="scope.row.i18nTags.length">
                <el-tag class="tag" v-for="item in scope.row.i18nTags" :key="item._id">
                  {{ item.tagName }}
                </el-tag>
              </div>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column property="comment" label="描述" min-width="100" v-if="!editData">
            <template #default="scope">
              {{ scope.row.comment || "-" }}
            </template>
          </el-table-column>
          <el-table-column label="状态">
            <template #default="scope">
              <span v-if="scope.row.status !== 3">
                {{ statusMapping.find((item) => item.value === scope.row.status).label }}
              </span>
            </template>
          </el-table-column>
        </el-table>

        <div class="edit-area" v-if="newTranslationShow">
          <div class="edit-content">
            <div class="top-bar">
              <div class="title">新建翻译</div>
              <div class="btns">
                <el-button @click="cancel()">取消</el-button>
                <el-button type="primary" @click="save()">保存</el-button>
              </div>
            </div>

            <div class="item-form">
              <div class="form-item">
                <div class="item-label">key</div>
                <el-input v-model="editData.key" placeholder="请输入key" />
              </div>
              <div class="form-item">
                <div class="item-label">默认译文 Chinese, China(zh-CN)</div>
                <el-input v-model="editData.value.zh.content" :rows="6" type="textarea" placeholder="请输入中文译文" />
              </div>
              <div class="form-item">
                <div class="item-label">备注</div>
                <el-input v-model="editData.comment" placeholder="请输入备注" :rows="4" type="textarea" />
              </div>
              <div class="form-item">
                <div class="item-label">标签</div>
                <div class="tag-area">
                  <el-select style="width: 100%" v-model="editData.tagIds" placeholder="请选择标签" multiple clearable>
                    <el-option
                      v-for="item in translationTagsList"
                      :key="item._id"
                      :label="item.tagName"
                      :value="item._id"
                    />
                  </el-select>
                  <el-input
                    style="margin-top: 10px"
                    v-model="setTagData.newTag"
                    placeholder="输入标签按回车键确认"
                    @keyup.enter="newTag('editData')"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="edit-area" v-if="editTranslationShow">
          <div class="edit-content">
            <div class="top-bar">
              <div class="item-info">
                <div class="item-key">
                  <span>{{ editData.key }}</span>
                  <el-icon class="icon-btn" title="复制" @click="copy(editData.key)">
                    <copy-document />
                  </el-icon>
                </div>
                <div class="item-status">
                  {{ statusMapping.find((item) => item.value === editData.status).label }}
                </div>
              </div>
              <div class="btns">
                <el-button @click="cancel()">取消</el-button>
                <el-button type="primary" @click="save()">保存</el-button>
                <el-button
                  type="success"
                  @click="save(true)"
                  :disabled="!editData.value.zh.content || !editData.value.en.content"
                >
                  保存并提交
                </el-button>
              </div>
            </div>

            <div class="item-form">
              <div class="form-row">
                <div class="form-item">
                  <div class="item-label">Chinese, China(zh-CN) 默认语言</div>
                  <el-input
                    v-model="editData.value.zh.content"
                    :rows="6"
                    type="textarea"
                    placeholder="请输入中文译文"
                  />
                </div>
                <div class="form-item">
                  <div class="item-label">English, United States(en-US)</div>
                  <el-input
                    v-model="editData.value.en.content"
                    :rows="6"
                    type="textarea"
                    placeholder="请输入英文译文"
                  />
                </div>
              </div>
              <div class="form-row">
                <div class="form-item">
                  <div class="item-label">备注</div>
                  <el-input v-model="editData.comment" placeholder="请输入备注" :rows="4" type="textarea" />
                </div>
                <div class="form-item">
                  <div class="item-label">标签</div>
                  <div class="tag-area">
                    <el-select
                      style="width: 100%"
                      v-model="editData.tagIds"
                      placeholder="请选择标签"
                      multiple
                      clearable
                    >
                      <el-option
                        v-for="item in translationTagsList"
                        :key="item._id"
                        :label="item.tagName"
                        :value="item._id"
                      />
                    </el-select>
                    <el-input
                      style="margin-top: 10px"
                      v-model="setTagData.newTag"
                      placeholder="输入标签按回车键确认"
                      @keyup.enter="newTag('editData')"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </list-template>

  <el-dialog v-model="addTagPopupShow" title="添加标签">
    <div class="tag-area">
      <el-select style="width: 100%" v-model="setTagData.tagIds" multiple clearable placeholder="请选择标签">
        <el-option v-for="item in translationTagsList" :key="item._id" :label="item.tagName" :value="item._id" />
      </el-select>
      <el-input
        style="margin-top: 10px"
        v-model="setTagData.newTag"
        placeholder="输入标签按回车键确认"
        @keyup.enter="newTag('setTagData')"
      />
    </div>
    <template #footer>
      <el-button @click="addTagPopupShow = false">取消</el-button>
      <el-button type="primary" @click="batchAddTagConfirm()">确认</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="importPopupShow" title="导入翻译">
    <el-upload
      ref="upload"
      :limit="1"
      action
      multiple
      drag
      accept=".xlsx,.xls"
      :show-file-list="false"
      :before-upload="beforeUpload"
      @change="uploadFile"
    >
      <template v-if="importData.file">
        <el-icon class="el-icon--upload"><document /></el-icon>
        <div class="el-upload__text">
          <em>{{ importData.file.name }}</em>
        </div>
      </template>
      <template v-else>
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">支持格式：XLSX(.xlsx)、XLS(.xls)</div>
      </template>
    </el-upload>
    <div class="form-item">
      <div class="item-label">标签</div>
      <div class="tag-area">
        <el-select style="width: 100%" v-model="importData.tagIds" placeholder="请选择标签" multiple clearable>
          <el-option v-for="item in translationTagsList" :key="item._id" :label="item.tagName" :value="item._id" />
        </el-select>
        <el-input
          style="margin-top: 10px"
          v-model="setTagData.newTag"
          placeholder="输入标签按回车键确认"
          @keyup.enter="newTag('importData')"
        />
      </div>
    </div>
    <div class="form-item">
      <div class="item-label">如果需要通过文档覆盖更新已存在的翻译条目，请勾选以下选项：</div>
      <el-checkbox-group v-model="importData.type">
        <el-checkbox :label="1">更新译文</el-checkbox>
        <el-checkbox :label="10">更新描述</el-checkbox>
        <el-checkbox :label="100">更新标签</el-checkbox>
      </el-checkbox-group>
    </div>
    <template #footer>
      <el-button @click="importPopupShow = false">取消</el-button>
      <el-button type="primary" @click="dealImportData()" :loading="importLoading">导入</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { nextTick, reactive, ref, toRefs } from "vue";
import { formatDate, relativeTime } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage, ElMessageBox, ElTable } from "element-plus";
import { InternationalizationService } from "@/api/request";
import { dateRangeShortcuts } from "@/assets/data";
import { CopyDocument, UploadFilled, Document } from "@element-plus/icons-vue";
import XLSX from "xlsx";
import { Translation, TranslationTag } from "@/typings/object";
import { CreateOrEditTranslationParams, TranslationListParams } from "@/typings/params";

/** 添加/编辑翻译参数 */
export interface MyCreateOrEditTranslationParams extends CreateOrEditTranslationParams {
  status?: 1 | 2 | 3;
}

/** 添加翻译标签参数 */
export interface MySetTranslationTagParams {
  translations: Translation[];
  tagIds: string[];
  newTag: "";
}

/** 导入参数 */
export interface ImportParams {
  file: File | null;
  tagIds: string[];
  type: number[];
}

/** 导入数据 */
export interface ImportData {
  "key*"?: string;
  "zh-CN*"?: string;
  "en-US"?: string;
  description?: string;
  tag?: string | number;
}

export default {
  components: {
    CopyDocument,
    UploadFilled,
    Document,
  },

  setup() {
    const { query, switchPage } = useMyRouter();
    const assetsData = {
      statusMapping: [
        { value: 1, label: "待翻译" },
        { value: 2, label: "待提交" },
        { value: 3, label: "已提交" },
      ],
    };
    const data = reactive({
      loading: false,
      importLoading: false,
      exportLoading: false,
      tableData: [] as Translation[],
      selectedData: [] as Translation[],
      translationTagsList: [] as TranslationTag[],
      searchData: {} as TranslationListParams,
      copyValue: "",
      editData: null as MyCreateOrEditTranslationParams | null,
      setTagData: {} as MySetTranslationTagParams,
      importData: {} as ImportParams,
      newTranslationShow: false,
      editTranslationShow: false,
      addTagPopupShow: false,
      importPopupShow: false,
      scrollTop: 0,
    });
    const tableRef = ref<InstanceType<typeof ElTable>>();

    const methods = {
      /** 获取列表数据 */
      async getData() {
        data.newTranslationShow = false;
        data.editTranslationShow = false;
        data.editData = null;
        data.tableData = [];
        data.loading = true;
        const result = await InternationalizationService.getTranslationList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          data.tableData = result.data.data;
          data.loading = false;
        }
      },

      /** 重置 */
      clearSearch() {
        data.searchData = {} as TranslationListParams;
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
        data.editData = null;
        data.newTranslationShow = false;
        data.editTranslationShow = false;
        // eslint-disable-next-line
        tableRef.value!.setCurrentRow(null);
      },

      /** 选择表格项 */
      selectTable(selected: Translation[]) {
        data.selectedData = selected;
      },

      /** 选择列表单项 */
      clickRow(item: Translation) {
        data.scrollTop = (document.getElementById("listTemplate") as any).scrollTop;
        const { _id, key, value, comment, i18nTags, status } = item;
        data.editData = {
          _id,
          key,
          value: {
            zh: value.zh || { isDefault: true, content: "" },
            en: value.en || { isDefault: false, content: "" },
          },
          comment,
          tagIds: i18nTags.map((item) => item._id),
          needPublish: false,
          status,
        };
        data.setTagData.newTag = "";
        data.newTranslationShow = false;
        data.editTranslationShow = true;
      },

      /** 批量提交所有待提交的条目 */
      async publishAll() {
        const result = await InternationalizationService.publishPreparative();
        const { errcode } = result.data;
        if (errcode !== 0) return;

        ElMessage.success("提交成功");
        this.getData();
      },

      /** 导入 */
      importFile() {
        data.importData = { file: null, type: [], tagIds: [] };
        data.setTagData.newTag = "";
        data.importPopupShow = true;
      },

      /** 上传文件前验证类型 */
      beforeUpload(rawFile: File) {
        if (
          !["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"].includes(
            rawFile.type
          )
        ) {
          ElMessage.error("请上传.xlsx或.xls文件");
          return false;
        }
        return true;
      },

      /** 上传文件 */
      uploadFile(file: { raw: File }) {
        data.importData.file = file.raw;
      },

      /** 处理导入数据 */
      dealImportData() {
        const { file } = data.importData;
        if (!file) {
          ElMessage("请上传文件");
          return;
        }

        data.importLoading = true;
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = (e: any) => {
          const readerData = e.target.result;
          const workbook = XLSX.read(readerData, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const results: ImportData[] = XLSX.utils.sheet_to_json(worksheet);
          this.importOperate(results);
        };
      },

      /** 导入数据 */
      async importOperate(results: ImportData[]) {
        if (results.length === 0) {
          ElMessage("文件无内容");
          data.importLoading = false;
          return;
        }

        const listData: MyCreateOrEditTranslationParams[] = [];
        const noKeyErrors: number[] = [];
        const keyInvalidErrors: string[] = [];
        let keyRepeatErrors: MyCreateOrEditTranslationParams[] = [];
        const newTags: string[] = [];
        let tagMappings: any = {};
        let tags = [];
        let tagsStr = "";
        results.forEach((item, index) => {
          item["key*"] = (item["key*"] as string).trim();
          if (!item["key*"]) {
            noKeyErrors.push(index);
            return;
          } else if (!validateKey(item["key*"])) {
            keyInvalidErrors.push(item["key*"]);
            return;
          }
          tagsStr += item.tag + ",";
        });
        // 整理出所有文件中绑定的标签
        tags = tagsStr.split(",");
        // 去重
        tags = [...new Set(tags.filter((tag) => tag))];
        // 到已有翻译标签数据中查找
        tags.forEach((item) => {
          const tag = data.translationTagsList.find((tag) => tag.tagName === item);
          if (tag) {
            // 已存在的记下 id
            tagMappings[item] = tag._id;
          } else {
            // 未存在的记下标签名以便之后添加
            newTags.push(item);
          }
        });
        if (newTags.length) {
          // 将未存在的所有标签创建
          const newTagResult = await InternationalizationService.batchCreateTranslationTag({ tagNames: newTags });
          const { errcode } = newTagResult.data;
          if (errcode !== 0) return;

          newTagResult.data.data.forEach((item: TranslationTag) => {
            const { tagName, _id } = item;
            tagMappings[tagName] = _id;
            data.translationTagsList.push(item);
          });
        }

        // 最后整理数据
        const validResults = results.filter((item) => item["key*"] && validateKey(item["key*"]));
        if (validResults.length !== 0) {
          validResults.forEach((item) => {
            const { description = "", tag = "" } = item;
            // 默认加上已选中的标签
            const tagIds: string[] = [...data.importData.tagIds];
            String(tag)
              .split(",")
              .forEach((tag) => {
                if (tag) tagIds.push(tagMappings[tag]);
              });
            const translation: CreateOrEditTranslationParams = {
              key: String(item["key*"]),
              value: {
                zh: { isDefault: true, content: item["zh-CN*"] ? String(item["zh-CN*"]) : "" },
                en: { isDefault: false, content: item["en-US"] ? String(item["en-US"]) : "" },
              },
              comment: String(description),
              tagIds: [...new Set(tagIds)],
              needPublish: false,
            };
            listData.push(translation);
          });
          const { type } = data.importData;
          let flag = 0;
          if (type && type.length) {
            flag = parseInt(String(type.reduce((a, b) => a + b)), 2);
          }
          const newTranslationResult = await InternationalizationService.batchCreateTranslation({
            flag,
            i18nConfigs: listData,
          });
          const { errcode, data: errors, msg } = newTranslationResult.data;
          if (errcode !== 0) {
            ElMessage.error(msg);
            return;
          }
          keyRepeatErrors = errors;
        }

        let errMsg = "";
        if (noKeyErrors.length) {
          errMsg = `${noKeyErrors
            .map((item) => `- <strong><i>第${item + 1}行</i></strong>`)
            .join("、")} 数据导入失败，原因：key缺失。<br>`;
        }
        if (keyInvalidErrors.length) {
          errMsg += `- key为 <strong><i>${keyInvalidErrors
            .map((item) => `${item}`)
            .join(
              "、"
            )}</i></strong> 的数据导入失败，原因：key名称只能使用字母、数字、下划线(_)、中划线(-)以及英文句号(.)。<br>`;
        }
        if (keyRepeatErrors.length) {
          errMsg += `- key为 <strong><i>${keyRepeatErrors
            .map((item: MyCreateOrEditTranslationParams) => `${item.key}`)
            .join("、")}</i></strong> 的数据导入失败，原因：key已存在。`;
        }
        if (errMsg) {
          ElMessageBox.alert(errMsg, "导入出错", {
            confirmButtonText: "知道了",
            showClose: false,
            dangerouslyUseHTMLString: true,
            customStyle: { "max-height": "400px", "overflow-y": "auto" },
            callback: () => {
              this.getData();
            },
          });
        } else {
          ElMessage.success("导入成功");
          this.getData();
        }
        data.importLoading = false;
        data.importPopupShow = false;
      },

      /** 导出 */
      exportData() {
        data.exportLoading = true;
        import("./Export2Excel").then((excel) => {
          const header = ["key*", "zh-CN*", "en-US", "description", "tag"];
          const keys = ["key", "zh", "en", "comment", "tag"];
          const result = this.filterKeys(keys);
          excel.export_json_to_excel({
            header,
            data: result,
            filename: `freelog_keys_${formatDate(new Date(), "YYYYMMDDhhmm")}`,
            autoWidth: true,
            bookType: "xlsx",
          });
          data.exportLoading = false;
        });
      },

      /** 筛选需要的字段 */
      filterKeys(keys: string[]) {
        return data.tableData.map((item: any) =>
          keys.map((key) => {
            if (["zh", "en"].includes(key)) {
              return item.value[key] ? item.value[key].content : "";
            } else if (key === "tag") {
              return item.i18nTags.map((tag: TranslationTag) => tag.tagName);
            } else {
              return item[key];
            }
          })
        );
      },

      /** 创建翻译 */
      createTranslation() {
        data.editData = {
          key: "",
          value: {
            zh: { isDefault: true, content: "" },
            en: { isDefault: false, content: "" },
          },
          comment: "",
          tagIds: [],
          needPublish: false,
        };
        data.setTagData.newTag = "";
        data.newTranslationShow = true;
        data.editTranslationShow = false;
      },

      /** 保存 */
      async save(needPublish = false) {
        if (!data.editData) return;

        data.editData.key = (data.editData.key as string).trim();
        if (!validate()) return;

        const { _id } = data.editData;
        data.editData.needPublish = needPublish;
        let result;
        if (_id) {
          // 编辑
          result = await InternationalizationService.editTranslation(data.editData);
        } else {
          // 创建
          result = await InternationalizationService.createTranslation(data.editData);
        }
        const { errcode } = result.data;
        if (errcode === 0) {
          data.newTranslationShow = false;
          data.editTranslationShow = false;
          data.editData = null;
          ElMessage.success("保存成功");
          if (_id) {
            // 编辑，不刷新列表
            const result = await InternationalizationService.getTranslationList(data.searchData);
            const { errcode, data: listData } = result.data;
            if (errcode === 0) {
              const newRow = listData.find((item: Translation) => item._id === _id);
              const index = data.tableData.findIndex((item: Translation) => item._id === _id);
              data.tableData[index] = newRow;
            }
            (document.getElementById("listTemplate") as any).scrollTo({ top: data.scrollTop });
          } else {
            // 新增，刷新列表
            this.getData();
          }
        }
      },

      /** 批量添加翻译标签 */
      batchAddTag() {
        data.setTagData.translations = data.selectedData;
        data.setTagData.tagIds = [];
        data.addTagPopupShow = true;
      },

      /** 添加新标签 */
      async newTag(type: "editData" | "setTagData") {
        const { newTag } = data.setTagData;
        if (!newTag) return;

        const object = data[type] as MyCreateOrEditTranslationParams | MySetTranslationTagParams;
        const existTag = data.translationTagsList.find((item) => item.tagName === newTag);
        if (existTag) {
          if (object.tagIds.includes(existTag._id)) {
            // 输入的标签已选择
            return;
          }

          // 输入的标签已存在且未选择，直接选择该标签
          object.tagIds.push(existTag._id);
          data.setTagData.newTag = "";
          return;
        }

        const result = await InternationalizationService.createTranslationTag({
          tagName: data.setTagData.newTag,
        });
        const { errcode } = result.data;
        if (errcode === 0) {
          const tag = result.data.data;
          data.translationTagsList.push(tag);
          object.tagIds.push(tag._id);
          data.setTagData.newTag = "";
        }
      },

      /** 设置翻译标签 */
      async batchAddTagConfirm() {
        const { translations, tagIds } = data.setTagData;
        if (tagIds.length !== 0) {
          // 存在添加标签，执行添加
          const _ids = translations.map((item: Translation) => item._id);
          const result = await InternationalizationService.setTranslationTag({
            _ids,
            tagIds,
          });
          const { errcode } = result.data;
          if (errcode === 0) {
            data.addTagPopupShow = false;
            this.getData();
          }
        }
      },
    };

    /** 获取翻译标签 */
    const getTranslationTags = async () => {
      const result = await InternationalizationService.getAllTranslationTagList();
      data.translationTagsList = result.data.data;
    };

    /** 表单验证 */
    const validate = () => {
      const { key } = data.editData as MyCreateOrEditTranslationParams;
      if (!key) {
        ElMessage("请输入key");
        return false;
      }
      if (!validateKey(key)) {
        ElMessage("key名称只能使用字母、数字、下划线(_)、中划线(-)以及英文句号(.)");
        return false;
      }
      return true;
    };

    /** 检验key是否有效 */
    const validateKey = (key: string) => {
      return (key.match(/[0-9a-zA-Z_\-.]/g) || []).length === key.length;
    };

    data.searchData.tagIds = query.value.tag ? [query.value.tag] : [];
    methods.getData();
    getTranslationTags();

    return {
      dateRangeShortcuts,
      ...assetsData,
      ...toRefs(data),
      tableRef,
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

        .title {
          font-size: 20px;
          font-weight: bold;
        }
      }

      .item-form {
        margin-top: 20px;

        .form-row {
          display: flex;

          & + .form-row {
            margin-top: 20px;
          }

          .form-item + .form-item {
            margin-left: 20px;
          }
        }
      }
    }
  }
}

.tag-area {
  width: 100%;
  border-radius: 4px;
  box-shadow: 0 0 0 1px #dcdfe6;

  :deep .el-input__inner {
    box-shadow: none !important;
  }
}

.form-item {
  flex: 1;

  .item-label {
    font-size: 14px;
    color: #666;
    margin-top: 20px;
    margin-bottom: 10px;
  }
}
</style>
