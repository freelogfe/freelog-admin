<!-- 资源管理 -->
<template>
  <list-template>
    <template v-slot:barLeft v-if="selectedData.length">
      <el-button type="primary" @click="setTag()">添加标签</el-button>
      <el-button type="primary" @click="openGradePopup()">评级</el-button>
      <el-button type="primary" @click="banResources()">封禁</el-button>
      <el-button type="primary" @click="restore()">解封</el-button>
      <span class="selected-tip">已选中{{ selectedData.length }}条</span>
    </template>

    <template v-slot:barRight>
      <el-button type="primary" @click="switchPage('/resource/tag-management')">管理标签</el-button>
    </template>

    <template v-slot:filterBar>
      <div class="filter-controls">
        <form-item label="关键字搜索">
          <el-input
            v-model="searchData.keywords"
            placeholder="请输入用户名、资源名"
            clearable
            @keyup.enter="getData(true)"
          />
        </form-item>
        <form-item label="标签">
          <el-select v-model="searchData.selectedTags" multiple placeholder="请选择标签" clearable>
            <el-option v-for="item in resourceTagsList" :key="item" :value="item" />
          </el-select>
        </form-item>
        <form-item label="类型">
          <el-cascader
            v-model="searchData.type"
            placeholder="请选择类型"
            :options="resourceTypeList"
            :props="{ checkStrictly: true, label: 'name', value: 'name' }"
            clearable
          />
        </form-item>
        <form-item label="创建时间">
          <el-date-picker
            v-model="searchData.createDate"
            type="daterange"
            unlink-panels
            range-separator="-"
            format="YYYY/MM/DD"
            start-placeholder="起始日期"
            end-placeholder="截止日期"
            :shortcuts="dateRangeShortcuts"
          />
        </form-item>
        <form-item label="排序">
          <el-select v-model="searchData.sort" placeholder="请选择排序方式" clearable>
            <el-option v-for="item in sortTypeList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </form-item>
        <form-item label="状态">
          <el-select v-model="searchData.status" placeholder="请选择状态" clearable>
            <el-option v-for="item in statusMapping" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </form-item>
      </div>
      <div class="filter-btns">
        <el-button type="primary" @click="getData(true)">搜索</el-button>
        <el-button @click="clearSearch()">重置</el-button>
      </div>
    </template>

    <template v-slot:table>
      <el-table ref="tableRef" :data="tableData" stripe @selection-change="selectTable" v-loading="loading">
        <el-table-column type="selection" />
        <el-table-column label="资源" min-width="250">
          <template #default="scope">
            <div class="resource-name">
              <span class="text-btn" @click="openPage('/user/user-management', { userId: scope.row.userId })">
                {{ scope.row.username }}
              </span>
              <span class="divider">/</span>
              <span class="text-btn" @click="openResourceDetail(scope.row.resourceId)">
                {{ scope.row.resourceNameAbbreviation }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="标签" min-width="250">
          <template #default="scope">
            <div class="tags-box">
              <el-tag
                class="tag"
                closable
                v-for="item in scope.row.tags"
                :key="item"
                @close="removeTag(scope.row.resourceId, item)"
                :title="item"
              >
                {{ item }}
              </el-tag>
            </div>
            <i class="icon-btn admin icon-edit" title="管理标签" @click="setTag(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column label="封面" min-width="120">
          <template #default="scope">
            <el-image
              class="cover-image"
              :src="scope.row.coverImages[0]"
              :preview-src-list="scope.row.coverImages"
              preview-teleported
              hide-on-click-modal
            />
          </template>
        </el-table-column>
        <el-table-column label="类型" min-width="150" show-overflow-tooltip>
          <template #default="scope">{{ scope.row.resourceType.join("/") }}</template>
        </el-table-column>
        <el-table-column label="评级" min-width="150" show-overflow-tooltip>
          <template #default="scope">
            <span v-if="scope.row.operationType">
              {{ mappingMatching(operationTypeMapping, scope.row.operationType) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="需方合约数" min-width="120" align="right">
          <template #default="scope">
            <span
              class="text-btn"
              @click="openPage('/contract/contract-management', { licensorId: scope.row.resourceId })"
            >
              {{ scope.row.signCount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column property="collectCount" label="收藏数" align="right" min-width="120" />
        <el-table-column label="最新版本" min-width="100">
          <template #default="scope">
            <div class="table-cell-item">
              <span>{{ scope.row.latestVersion || "-" }}</span>
              <i
                class="icon-btn admin icon-history"
                title="查看历史记录"
                @click="viewHistory(scope.row)"
                v-if="scope.row.resourceVersions.length"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column property="updateDate" label="更新时间" min-width="160">
          <template #default="scope">{{ relativeTime(scope.row.updateDate) }}</template>
        </el-table-column>
        <el-table-column property="createDate" label="创建时间" min-width="160">
          <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="scope">
            <el-tooltip
              effect="dark"
              :content="`${scope.row.reason}${scope.row.remark ? '（' + scope.row.remark + '）' : ''}`"
              placement="top"
              v-if="scope.row.status === 2"
            >
              {{ mappingMatching(statusMapping, scope.row.status) }}
            </el-tooltip>
            <span v-else>{{ mappingMatching(statusMapping, scope.row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" width="70">
          <template #default="scope">
            <i
              class="icon-btn admin icon-strategy"
              title="查看授权策略"
              @click="viewPolicy(scope.row)"
              v-if="scope.row.policies.length"
            />
            <i
              class="icon-btn admin icon-stop"
              title="封禁"
              @click="banResources(scope.row.resourceId)"
              v-if="scope.row.status !== 2"
            />
            <i
              class="icon-btn admin icon-restore"
              title="解禁"
              @click="restore(scope.row.resourceId)"
              v-if="scope.row.status === 2"
            />
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

  <el-dialog v-model="setTagPopupShow" title="管理资源标签">
    <div class="tag-area">
      <el-select style="width: 100%" v-model="setTagData.tags" multiple placeholder="请选择标签">
        <el-option v-for="item in resourceTagsList" :key="item" :value="item" />
      </el-select>
      <el-input
        style="margin-top: 10px"
        v-model="setTagData.newTag"
        placeholder="输入标签按回车键确认"
        @keyup.enter="newTag()"
      />
    </div>
    <template #footer>
      <el-button @click="setTagPopupShow = false">取消</el-button>
      <el-button type="primary" @click="setTagConfirm()">确认</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="policyPopupShow" title="授权策略" width="80%">
    <div class="policy-box">
      <div class="policy-item" v-for="item in policyData" :key="item.policyId">
        <div class="policy-top">
          <div class="policy-name" :title="item.policyName">
            {{ item.policyName }}
          </div>
          <div class="policy-status" :class="{ active: item.status === 1 }">
            <span v-if="item.status === 1">已启用</span>
            <span v-if="item.status === 0">未启用</span>
          </div>
        </div>
        <div class="policy-code" v-html="item.policyText"></div>
      </div>
    </div>
  </el-dialog>

  <el-dialog v-model="banPopupShow" title="封禁资源" width="800px">
    <form-item label="封禁原因">
      <el-radio-group v-model="operateData.reason">
        <el-radio label="抄袭、侵权"></el-radio>
        <el-radio label="欺诈"></el-radio>
        <el-radio label="垃圾广告"></el-radio>
        <el-radio label="色情、暴力"></el-radio>
        <el-radio label="不实信息"></el-radio>
      </el-radio-group>
    </form-item>
    <form-item label="备注">
      <el-input
        v-model="operateData.remark"
        :autosize="{ minRows: 2, maxRows: 4 }"
        type="textarea"
        placeholder="请输入备注（选填）"
      />
    </form-item>
    <template #footer>
      <el-button @click="banPopupShow = false">取消</el-button>
      <el-button type="primary" @click="operateConfirm(1)">封禁</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="gradePopupShow" title="资源评级" width="500px">
    <el-radio-group class="grade-radio-group" v-model="operateData.grade">
      <el-radio :label="1">1：违规</el-radio>
      <el-radio :label="2">2：低质量</el-radio>
      <el-radio :label="3">3：正常</el-radio>
      <el-radio :label="4">4：优良</el-radio>
      <el-radio :label="5">5：编辑精选</el-radio>
    </el-radio-group>
    <template #footer>
      <el-button @click="gradePopupShow = false">取消</el-button>
      <el-button type="primary" @click="setGrade()">确认</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="versionData.versionPopupShow" title="版本历史记录" width="840px" destroy-on-close>
    <div class="version-history">
      <el-scrollbar class="side-bar">
        <div
          class="version-item"
          :class="{ active: versionData.activeIndex === index }"
          v-for="(item, index) in versionData.versionList"
          :key="item.versionId"
          @click="getVersionFile(item)"
        >
          <div class="version">
            <div class="version-name" :title="item.version">{{ item.version }}</div>
            <a :href="getFileUrl(item.versionId)" download @click.stop>
              <i class="icon-btn admin icon-download" title="下载" />
            </a>
          </div>
          <div class="create-date">{{ relativeTime(item.createDate) }}</div>
        </div>
      </el-scrollbar>
      <el-scrollbar
        class="version-content"
        v-loading="versionData.loading"
        v-if="currentVersionData.mime && currentVersionData.mime.startsWith('text')"
      >
        <my-markdown :data="versionData" @done="versionData.loading = false" />
      </el-scrollbar>
      <div class="version-content media" v-loading="versionData.loading" v-else>
        <el-image
          style="width: 570px; height: 570px"
          fit="contain"
          :src="currentVersionData.content"
          :preview-src-list="[currentVersionData.content]"
          preview-teleported
          hide-on-click-modal
          v-if="currentVersionData.mime && currentVersionData.mime.startsWith('image')"
        />
        <video
          style="width: 100%"
          :src="currentVersionData.content"
          controls
          v-else-if="currentVersionData.mime && currentVersionData.mime.startsWith('video')"
        />
        <audio
          :src="currentVersionData.content"
          controls
          v-else-if="currentVersionData.mime && currentVersionData.mime.startsWith('audio')"
        />
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { dateRange, formatDate, mappingMatching, relativeTime } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage, ElMessageBox, ElTable } from "element-plus";
import { ResourceService, ContractsService, ActivitiesService } from "@/api/request";
import { dateRangeShortcuts } from "@/assets/data";
import { reactive, toRefs, computed, defineAsyncComponent, ref } from "vue";
import { Policy, Resource, ResourceTag, ResourceType, ResourceVersion } from "@/typings/object";
import {
  ResourceListParams,
  OperateResourceParams,
  ResourceTagListParams,
  SetResourceTagParams,
  setResourceGradeParams,
} from "@/typings/params";

/** 资源列表参数 */
export interface MyResourceListParams extends ResourceListParams {
  createDate?: string[];
  selectedTags?: string[];
  type?: string[];
}

/** 设置资源标签参数 */
export interface MySetResourceTagParams extends SetResourceTagParams {
  resources: Resource[];
  tags: string[];
  newTag?: "";
}

export default {
  components: {
    "my-markdown": defineAsyncComponent(() => import("@/components/markdown.vue")),
  },

  setup() {
    const { query, switchPage, openPage } = useMyRouter();
    const tableRef = ref<InstanceType<typeof ElTable>>();
    const assetsData = {
      statusMapping: [
        { value: 0, label: "待发行" },
        { value: 1, label: "上架" },
        { value: 2, label: "冻结" },
        { value: 4, label: "下架" },
      ],
      operationTypeMapping: [
        { value: 1, label: "1：违规" },
        { value: 2, label: "2：低质量" },
        { value: 3, label: "3：正常" },
        { value: 4, label: "4：优良" },
        { value: 5, label: "5：编辑精选" },
      ],
      sortTypeList: [
        { value: "updateDate:1", label: "更新时间升序" },
        { value: "updateDate:-1", label: "更新时间降序" },
        { value: "createDate:1", label: "创建时间升序" },
        { value: "createDate:-1", label: "创建时间降序" },
      ],
    };
    const data = reactive({
      loading: false,
      tableData: [] as Resource[],
      total: 0,
      selectedData: [] as Resource[],
      resourceTagsList: [] as ResourceTag[],
      searchData: { currentPage: 1, limit: 20 } as MyResourceListParams,
      resourceTypeList: [] as ResourceType[],
      versionData: {
        resourceId: "",
        activeIndex: 0,
        versionList: [] as ResourceVersion[],
        versionPopupShow: false,
        loading: false,
      },
      setTagData: {} as MySetResourceTagParams,
      policyData: [] as Policy[],
      operateData: {} as OperateResourceParams,
      setTagPopupShow: false,
      policyPopupShow: false,
      banPopupShow: false,
      gradePopupShow: false,
    });
    const currentVersionData = computed(() => {
      const { versionList, activeIndex } = data.versionData;
      return versionList[activeIndex];
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        data.tableData = [];
        data.loading = true;
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit, sort, selectedTags = [], createDate, type, status } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        if (!sort) delete data.searchData.sort;
        data.searchData.tags = selectedTags.join(",");
        [data.searchData.startCreateDate, data.searchData.endCreateDate] = dateRange(createDate);
        if (type) {
          data.searchData.resourceType = type ? type[type.length - 1] : "";
        } else {
          delete data.searchData.resourceType;
        }
        if (!status && status !== 0) delete data.searchData.status;

        const result = await ResourceService.getResourceList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data;

          if (dataList.length === 0) {
            data.total = 0;
            data.loading = false;
            return;
          }

          const ids = dataList
            .map((item: Resource) => {
              return item.resourceId;
            })
            .join(",");
          const results = await Promise.all([
            ContractsService.getSubjectSignCount({
              subjectIds: ids,
              subjectType: 1,
            }),
            ResourceService.getResourcesCollectCount({ resourceIds: ids }),
            ResourceService.searchChoiceness(ids),
          ]);
          dataList.forEach((resource: Resource) => {
            const { resourceId } = resource;
            resource.resourceNameAbbreviation = resource.resourceName.split("/")[1];
            resource.resourceVersions.reverse();
            resource.signCount = results[0].data.data.find(
              (item: { subjectId: string; count: number }) => item.subjectId === resourceId
            ).count;
            resource.collectCount = results[1].data.data.find(
              (item: { resourceId: string; count: number }) => item.resourceId === resourceId
            ).count;
            resource.choiceness =
              results[2].data.data.findIndex((item: { resourceId: string }) => item.resourceId === resourceId) !== -1;
          });
          const bannedIds = dataList
            .filter((item: Resource) => item.status === 2)
            .map((item: Resource) => item.resourceId)
            .join(",");

          if (bannedIds) {
            const bannedResult = await ResourceService.getResourceRecordList({ resourceIds: bannedIds });
            bannedResult.data.data.forEach(
              (item: { resourceId: string; records: { reason: string; remark: string }[] }) => {
                const resource: Resource = dataList.find(
                  (resource: Resource) => resource.resourceId === item.resourceId
                );
                resource.reason = item.records[0].reason;
                resource.remark = item.records[0].remark;
              }
            );
          }

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

      /** 打开资源详情 */
      openResourceDetail(resourceId: string) {
        const domain = (process.env.VUE_APP_BASE_API as string).replace("api", "console");
        const url = `${domain}/resource/details/${resourceId}`;
        openPage(url);
      },

      /** 打开资源评级弹窗 */
      openGradePopup() {
        data.operateData.grade = null;
        data.gradePopupShow = true;
      },

      /** 资源评级 */
      async setGrade() {
        const { grade: type } = data.operateData;
        if (!type) return ElMessage("请选择评级");

        const params: setResourceGradeParams = { type, resourceIds: data.selectedData.map((item) => item.resourceId) };
        const result = await ActivitiesService.setResourceGrade(params);
        const { errcode, msg } = result.data;
        if (errcode === 0) {
          data.gradePopupShow = false;
          ElMessage.success(`设置成功`);
          data.selectedData.forEach((item) => {
            item.operationType = type;
          });
          tableRef.value!.clearSelection();
        } else {
          ElMessage.error(msg);
        }
      },

      /** 封禁操作 */
      banResources(resourceId?: string) {
        data.operateData.resourceIds = resourceId ? [resourceId] : data.selectedData.map((item) => item.resourceId);
        data.banPopupShow = true;
      },

      /** 解封操作 */
      restore(resourceId?: string) {
        ElMessageBox.confirm(`确认要解除${resourceId ? "此" : "选中"}资源的封禁吗？`, "解封封禁", {
          confirmButtonText: "解封",
          cancelButtonText: "取消",
        }).then(() => {
          data.operateData.resourceIds = resourceId ? [resourceId] : data.selectedData.map((item) => item.resourceId);
          this.operateConfirm(2);
        });
      },

      /** 操作（封禁/解封） */
      async operateConfirm(type: 1 | 2) {
        const { resourceIds, reason, remark } = data.operateData;
        const params = { resourceIds, reason, remark, operationType: type };
        const result = await ResourceService.updateResources(params);
        const { errcode } = result.data;
        if (errcode === 0) {
          data.banPopupShow = false;
          this.getData(true);
        }
      },

      /** 选择表格项 */
      selectTable(selected: Resource[]) {
        data.selectedData = selected;
      },

      /** 设置资源标签 */
      setTag(item?: Resource) {
        if (item) {
          data.setTagData.resources = [item];
          data.setTagData.tags = [...item.tags];
        } else {
          data.setTagData.resources = data.selectedData;
          data.setTagData.tags = [];
        }
        data.setTagData.newTag = "";
        data.setTagPopupShow = true;
      },

      /** 添加新标签 */
      async newTag() {
        const { newTag } = data.setTagData;
        if (!newTag) return;

        const existTag = data.resourceTagsList.find((item) => item === newTag);

        if (existTag) {
          if (data.setTagData.tags.includes(newTag)) {
            // 输入的标签已选择
            return;
          }

          // 输入的标签已存在且未选择，直接选择该标签
          data.setTagData.tags.push(newTag);
          data.setTagData.newTag = "";
          return;
        }

        const result = await ResourceService.createResourceTag({
          tagName: newTag,
          tagType: 2,
          resourceRange: [],
          resourceRangeType: 3,
          authority: 3,
        });
        const { errcode } = result.data;
        if (errcode === 0) {
          data.resourceTagsList.push(newTag);
          data.setTagData.tags.push(newTag);
          data.setTagData.newTag = "";
        }
      },

      /** 设置资源标签 */
      async setTagConfirm() {
        const { resources, tags } = data.setTagData;
        let addTags: string[] = [];
        if (resources.length === 1) {
          // 非批量操作，统计删除标签与添加标签
          const resource = resources[0];
          const deleteTags = [] as string[];
          resource.tags.forEach((item: string) => {
            if (!tags.includes(item)) deleteTags.push(item);
          });
          tags.forEach((tag: string) => {
            if (!resource.tags.find((item: string) => item === tag)) {
              addTags.push(tag);
            }
          });
          if (deleteTags.length !== 0) {
            // 存在删除标签，执行删除
            const result = await ResourceService.setResourceTag({
              tagNames: deleteTags,
              resourceIds: [resource.resourceId],
              setType: 2,
            });
            const { errcode } = result.data;
            if (errcode !== 0) return;
            if (addTags.length === 0) {
              data.setTagPopupShow = false;
              this.getData(true);
            }
          }
        } else {
          // 批量操作，无删除标签，所有所选标签为添加标签
          addTags = tags;
        }
        if (addTags.length !== 0) {
          // 存在添加标签，执行添加
          const resourceIds = resources.map((item: Resource) => item.resourceId);
          const result = await ResourceService.setResourceTag({
            tagNames: addTags,
            resourceIds: resourceIds,
            setType: 1,
          });
          const { errcode } = result.data;
          if (errcode === 0) {
            data.setTagPopupShow = false;
            this.getData(true);
          }
        }
      },

      /** 删除资源标签 */
      async removeTag(resourceId: string, tagName: string) {
        const result = await ResourceService.setResourceTag({
          tagNames: [tagName],
          resourceIds: [resourceId],
          setType: 2,
        });
        const { errcode } = result.data;
        if (errcode === 0) {
          const item = data.tableData.find((resource) => resource.resourceId === resourceId);
          if (!item) return;
          item.tags = item.tags.filter((tag) => tag !== tagName);
        }
      },

      /** 查看授权策略 */
      viewPolicy(resource: Resource) {
        data.policyPopupShow = true;
        data.policyData = resource.policies;
      },

      /** 查看历史版本 */
      viewHistory(resource: Resource) {
        const { resourceId, resourceVersions } = resource;
        data.versionData.resourceId = resourceId;
        data.versionData.versionList = resourceVersions;
        data.versionData.versionPopupShow = true;
        this.getVersionFile(data.versionData.versionList[0]);
      },

      /** 获取响应版本文件内容 */
      async getVersionFile(version: ResourceVersion) {
        const { versionId } = version;
        data.versionData.activeIndex = data.versionData.versionList.findIndex((item) => item.versionId === versionId);
        if (version.content) return;

        data.versionData.loading = true;
        const result = await ResourceService.getResourceFile(versionId);
        version.mime = result.headers["content-type"];
        if (version.mime.startsWith("image") || version.mime.startsWith("video") || version.mime.startsWith("audio")) {
          // 媒体资源
          version.content = this.getFileUrl(versionId);
          data.versionData.loading = false;
        } else {
          version.content = result.data;
        }
      },

      /** 获取文件路径 */
      getFileUrl(versionId: string) {
        return `${
          process.env.NODE_ENV === "development" ? "/api" : process.env.VUE_APP_BASE_API
        }/v2/resources/versions/${versionId}/internalClientDownload`;
      },
    };

    /** 获取资源标签 */
    const getResourceTags = async () => {
      const result = await ResourceService.getResourcesTagsList({ limit: 1000 } as ResourceTagListParams);
      data.resourceTagsList = result.data.data.dataList.map((item: { tagName: string }) => item.tagName);
    };

    /** 获取资源类型 */
    const getResourceTypes = async () => {
      const result = await ResourceService.getResourceTypeGroupList({ codeOrName: "" });
      const { errcode } = result.data;
      if (errcode === 0) {
        data.resourceTypeList = result.data.data;
      }
    };

    data.searchData.keywords = query.value.keywords;
    data.searchData.userId = query.value.userId;
    data.searchData.resourceId = query.value.resourceId;
    if (query.value.tag) data.searchData.selectedTags = [query.value.tag];
    data.searchData.type = query.value.type ? query.value.type.split(",") : null;
    methods.getData(true);
    getResourceTags();
    getResourceTypes();

    return {
      dateRangeShortcuts,
      mappingMatching,
      tableRef,
      ...assetsData,
      ...toRefs(data),
      currentVersionData,
      ...methods,
      formatDate,
      switchPage,
      openPage,
      relativeTime,
    };
  },
};
</script>

<style lang="scss" scoped>
.resource-name {
  word-break: break-all;

  .divider {
    margin: 0 3px;
  }
}

.tag-area {
  width: 100%;
  border-radius: 4px;
  box-shadow: 0 0 0 1px #dcdfe6;

  :deep .el-input__inner,
  :deep .el-select .el-input.is-focus .el-input__inner {
    box-shadow: none !important;
  }
}

.choiceness-text {
  color: #e3b30b;
  display: flex;
  align-items: center;

  .admin {
    margin-right: 5px;
  }
}

.policy-box {
  width: 100%;
  max-height: 600px;
  overflow-y: auto;
  padding: 10px;
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;

  .policy-item {
    border: 1px solid #ddd;
    border-radius: 6px;
    width: 32%;
    margin-right: 2%;
    padding: 15px;
    box-sizing: border-box;
    transition: all 0.2s linear;

    &:hover {
      box-shadow: 0 0 10px #999;
    }

    &:nth-child(3n) {
      margin-right: 0;
    }

    &:nth-child(n + 4) {
      margin-top: 15px;
    }

    .policy-top {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .policy-name {
        flex: 1;
        width: 0;
        font-size: 16px;
        font-weight: bold;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .policy-status {
        color: #666;
        margin-left: 20px;

        &.active {
          color: #67c23a;
        }
      }
    }

    .policy-code {
      margin-top: 15px;
      white-space: pre-wrap;
    }
  }
}

.version-history {
  display: flex;
  height: 600px;

  .side-bar {
    flex-shrink: 0;
    width: 200px;

    .version-item {
      width: 100%;
      padding: 10px 20px;
      box-sizing: border-box;
      border-radius: 6px 0 0 6px;
      cursor: pointer;
      transition: all 0.2s linear;

      &:hover {
        background-color: #fafafa;

        .icon-btn {
          opacity: 1 !important;
        }
      }

      &.active {
        background-color: #f5f5f5;
      }

      .version {
        display: flex;
        align-items: center;

        .version-name {
          flex: 1;
          width: 0;
          font-size: 16px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .icon-btn {
          opacity: 0;
        }
      }

      .create-date {
        font-size: 12px;
        color: #666;
        margin-top: 5px;
      }
    }
  }

  .version-content {
    flex-shrink: 0;
    width: 600px;
    height: 600px;
    padding: 10px;
    box-sizing: border-box;
    border-radius: 0 6px 6px 6px;
    background-color: #f5f5f5;

    &.media {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.grade-radio-group {
  display: block;

  .el-radio {
    display: block;

    & + .el-radio {
      margin-top: 10px;
    }
  }
}
</style>
