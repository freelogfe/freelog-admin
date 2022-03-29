<!-- 资源管理 -->
<template>
  <list-template>
    <template v-slot:barLeft>
      <span class="selected-tip" v-show="selectedData.length">已选中{{ selectedData.length }}条</span>
    </template>

    <template v-slot:barRight>
      <el-button type="primary" @click="banResources()">批量封禁</el-button>
      <el-button type="primary" @click="setTag()">批量添加标签</el-button>
      <el-button type="primary" @click="switchPage('/resource/tag-management')">管理标签</el-button>
    </template>

    <template v-slot:filterBar>
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
        <el-select v-model="searchData.resourceType" placeholder="请选择类型" clearable>
          <el-option v-for="item in resourceTypeList" :key="item" :value="item" />
        </el-select>
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
      <form-item>
        <el-button type="primary" @click="getData(true)">搜索</el-button>
        <el-button @click="clearSearch()">重置</el-button>
      </form-item>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" stripe @selection-change="selectTable">
        <el-table-column type="selection" />
        <el-table-column label="资源" width="250" show-overflow-tooltip>
          <template #default="scope">
            <el-button
              type="text"
              @click="
                switchPage('/user/user-management', {
                  keywords: scope.row.username,
                })
              "
              >{{ scope.row.username }}
            </el-button>
            /
            <el-button type="text" style="margin-left: 0" @click="viewHistory(scope.row)"
              >{{ scope.row.resourceNameAbbreviation }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="标签" width="250">
          <template #default="scope">
            <div class="tags-box">
              <el-tag
                class="tag"
                closable
                v-for="item in scope.row.tags"
                :key="item"
                @close="removeTag(scope.row.resourceId, item)"
              >
                {{ item }}
              </el-tag>
            </div>
            <el-icon class="icon-btn" title="管理标签" @click="setTag(scope.row)">
              <edit />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column label="封面" width="120">
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
        <el-table-column property="resourceType" label="类型" width="100" show-overflow-tooltip />
        <el-table-column property="signCount" label="需方合约数" align="right" width="120" />
        <el-table-column property="collectCount" label="收藏数" align="right" width="120" />
        <el-table-column label="最新版本" width="100">
          <template #default="scope">
            <div class="table-cell-item">
              <span>{{ scope.row.latestVersion || "-" }}</span>
              <el-icon
                class="icon-btn"
                title="查看历史记录"
                @click="viewHistory(scope.row)"
                v-if="scope.row.resourceVersions.length"
              >
                <clock />
              </el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column property="updateDate" label="更新时间" width="160">
          <template #default="scope">{{ relativeTime(scope.row.updateDate) }}</template>
        </el-table-column>
        <el-table-column property="createDate" label="创建时间" width="160">
          <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="scope">
            <el-tooltip
              effect="dark"
              :content="`${scope.row.reason}${scope.row.remark ? '（' + scope.row.remark + '）' : ''}`"
              placement="top"
              v-if="[2, 3].includes(scope.row.status)"
            >
              {{ statusMapping.find((item) => item.value === scope.row.status).label }}
            </el-tooltip>
            <span v-else>{{ statusMapping.find((item) => item.value === scope.row.status).label }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" width="70">
          <template #header>
            <el-icon class="operation-icon" title="操作">
              <operation />
            </el-icon>
          </template>
          <template #default="scope">
            <el-icon
              class="icon-btn"
              title="封禁"
              @click="banResources(scope.row.resourceId)"
              v-if="![2, 3].includes(scope.row.status)"
            >
              <close />
            </el-icon>
            <el-icon
              class="icon-btn"
              title="解禁"
              @click="restore(scope.row.resourceId)"
              v-if="[2, 3].includes(scope.row.status)"
            >
              <check />
            </el-icon>
            <el-icon
              class="icon-btn"
              title="查看授权策略"
              @click="viewPolicy(scope.row)"
              v-if="scope.row.policies.length"
            >
              <document />
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

  <el-dialog v-model="setTagPopupShow" title="管理资源标签">
    <el-select style="width: 100%" v-model="setTagData.tags" multiple placeholder="请选择标签">
      <el-option v-for="item in resourceTagsList" :key="item" :value="item" />
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

  <el-dialog v-model="versionData.versionPopupShow" title="版本历史记录" width="840px">
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
            <a
              class="icon-btn"
              title="下载"
              :href="`/api/v2/resources/versions/${currentVersionData.versionId}/internalClientDownload`"
              download
              @click.stop
            >
              <el-icon><download /></el-icon>
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
import { reactive, toRefs } from "vue-demi";
import { dateRange, formatDate, relativeTime } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage, ElMessageBox } from "element-plus";
import { ResourceService, ContractsService } from "@/api/request";
import { dateRangeShortcuts } from "@/assets/data";
import { Operation, Edit, Clock, Close, Check, Document, Download } from "@element-plus/icons-vue";
import { computed, defineAsyncComponent } from "vue";
import { ListParams, OperateParams } from "@/api/interface";

/** 资源数据 */
interface Resource {
  resourceId: string;
  resourceType: string;
  resourceName: string;
  userId: number;
  username: string;
  resourceNameAbbreviation: string;
  coverImages: string[];
  intro: string;
  tags: string[];
  latestVersion: string;
  resourceVersions: any[];
  policies: any[];
  baseUpcastResources: any[];
  signCount: number;
  collectCount: number;
  status: 0 | 1 | 2 | 3;
  reason: string;
  remark: string;
}

/** 资源标签数据 */
interface ResourceTag {
  tagId: string;
  tag: string;
}

/** 资源版本数据 */
export interface ResourceVersion {
  versionId: string;
  version: string;
  createDate: string;
  content: string;
  mime: string;
}

export default {
  components: {
    "my-markdown": defineAsyncComponent(() => import("@/components/markdown.vue")),
    Operation,
    Edit,
    Clock,
    Close,
    Check,
    Document,
    Download,
  },

  setup() {
    const { query, switchPage } = useMyRouter();
    const assetsData = {
      resourceTypeList: ["image", "audio", "video", "markdown", "widget", "theme"],
      statusMapping: [
        { value: 0, label: "下线" },
        { value: 1, label: "上线" },
        { value: 2, label: "禁用" },
        { value: 3, label: "禁用" },
      ],
      sortTypeList: [
        { value: "updateDate:1", label: "更新时间升序" },
        { value: "updateDate:-1", label: "更新时间降序" },
        { value: "createDate:1", label: "创建时间升序" },
        { value: "createDate:-1", label: "创建时间降序" },
      ],
    };
    const data = reactive({
      tableData: [] as Resource[],
      total: 0,
      selectedData: [] as Resource[],
      resourceTagsList: [] as ResourceTag[],
      searchData: {
        currentPage: 1,
        limit: 20,
      } as ListParams,
      versionData: {
        resourceId: "",
        activeIndex: 0,
        versionList: [] as ResourceVersion[],
        versionPopupShow: false,
        loading: false,
      },
      setTagData: {} as any,
      policyData: [] as any[],
      operateData: {} as OperateParams,
      setTagPopupShow: false,
      policyPopupShow: false,
      banPopupShow: false,
    });
    const currentVersionData = computed(() => {
      const { versionList, activeIndex } = data.versionData;
      return versionList[activeIndex];
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit, sort, selectedTags = [], createDate } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        if (!sort) delete data.searchData.sort;
        data.searchData.tags = selectedTags.join(",");
        [data.searchData.startCreateDate, data.searchData.endCreateDate] = dateRange(createDate);
        const result = await ResourceService.getResourceList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data;

          if (dataList.length === 0) {
            data.tableData = [];
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
          });
          const bannedIds = dataList
            .filter((item: Resource) => [2, 3].includes(item.status))
            .map((item: Resource) => {
              return item.resourceId;
            })
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

      /** 封禁操作 */
      banResources(resourceId?: string) {
        data.operateData = {
          resourceIds: resourceId ? [resourceId] : data.selectedData.map((item) => item.resourceId),
        };
        data.banPopupShow = true;
      },

      /** 解封操作 */
      restore(resourceId: string) {
        ElMessageBox.confirm("确认要解除该资源的封禁吗？", "解封封禁", {
          confirmButtonText: "解封",
          cancelButtonText: "取消",
        }).then(() => {
          data.operateData.resourceIds = [resourceId];
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
          this.getData();
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
          if (data.selectedData.length === 0) {
            ElMessage.info("请选择需要管理资源标签的条目");
            return;
          }
          data.setTagData.resources = data.selectedData;
          data.setTagData.tags = [];
        }
        data.setTagPopupShow = true;
      },

      /** 添加新标签 */
      async newTag() {
        const { newTag } = data.setTagData;
        if (!newTag) return;

        const existTag = data.resourceTagsList.find((item) => item === newTag);

        if (existTag) {
          if (data.setTagData.tags.includes(existTag)) {
            // 输入的标签已选择
            return;
          }

          // 输入的标签已存在且未选择，直接选择该标签
          data.setTagData.tags.push(existTag);
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
        let addTags = [];
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
              this.getData();
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
            this.getData();
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
          version.content = `/api/v2/resources/versions/${versionId}/internalClientDownload`;
          data.versionData.loading = false;
        } else {
          version.content = result.data;
        }
      },
    };

    /** 获取资源标签 */
    const getResourceTags = async () => {
      const result = await ResourceService.getResourcesTagsList({ limit: 100 });
      data.resourceTagsList = result.data.data.dataList.map((item: { tagName: string }) => item.tagName);
    };

    data.searchData.keywords = query.value.keywords;
    if (query.value.tag) data.searchData.selectedTags = [query.value.tag];
    methods.getData(true);
    getResourceTags();

    return {
      dateRangeShortcuts,
      ...assetsData,
      ...toRefs(data),
      currentVersionData,
      ...methods,
      formatDate,
      switchPage,
      relativeTime,
    };
  },
};
</script>

<style lang="scss" scoped>
.tags-box {
  width: 100%;
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  .tag {
    flex-shrink: 0;
    margin: 0 8px 5px 0;
  }
}

.cover-image {
  width: 100px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.policy-box {
  width: 100%;
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
</style>
