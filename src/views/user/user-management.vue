<!-- 用户管理 -->
<template>
  <list-template>
    <template v-slot:hidden>
      <input id="copyInput" v-model="copyValue" />
    </template>

    <template v-slot:barLeft v-if="selectedData.length">
      <el-button type="primary" @click="setTag()">添加标签</el-button>
      <span class="selected-tip">已选中{{ selectedData.length }}条</span>
    </template>

    <template v-slot:barRight>
      <el-button type="primary" @click="switchPage('/user/tag-management')">管理标签</el-button>
    </template>

    <template v-slot:filterBar>
      <div class="filter-controls">
        <form-item label="关键字搜索">
          <el-input
            style="width: 250px"
            v-model="searchData.keywords"
            placeholder="请输入用户名、手机号、邮箱"
            clearable
            @keyup.enter="getData(true)"
          />
        </form-item>
        <form-item label="标签">
          <el-select v-model="searchData.tags" multiple placeholder="请选择标签" clearable>
            <el-option v-for="item in userTagsList" :key="item.tagId" :label="item.tag" :value="item.tagId" />
          </el-select>
        </form-item>
        <form-item label="注册时间">
          <el-date-picker
            v-model="searchData.registerDate"
            type="daterange"
            unlink-panels
            range-separator="-"
            format="YYYY/MM/DD"
            value-format="YYYY-MM-DD"
            start-placeholder="起始日期"
            end-placeholder="截止日期"
            :shortcuts="dateRangeShortcuts"
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
        <el-table-column property="username" label="用户" min-width="200" />
        <el-table-column label="标签" min-width="250">
          <template #default="scope">
            <div class="tags-box">
              <el-tag
                class="tag"
                closable
                v-for="item in scope.row.tags"
                :key="item.tagId"
                @close="removeTag(scope.row.userId, item.tagId)"
              >
                {{ item.tag }}
              </el-tag>
            </div>
            <el-icon class="icon-btn" title="管理标签" @click="setTag(scope.row)">
              <edit />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column label="最近登录" min-width="160">
          <template #default="scope">
            {{ scope.row.latestLoginDate ? relativeTime(scope.row.latestLoginDate) : "-" }}
          </template>
        </el-table-column>
        <el-table-column label="发布资源数" min-width="120" align="right">
          <template #default="scope">
            <span class="text-btn" @click="switchPage('/resource/resource-management', { userId: scope.row.userId })">
              {{ scope.row.createdResourceCount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="运营节点数" min-width="120" align="right">
          <template #default="scope">
            <span class="text-btn" @click="switchPage('/node/node-management', { userId: scope.row.userId })">
              {{ scope.row.createdNodeCount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="消费合约数" min-width="120" align="right">
          <template #default="scope">
            <span
              class="text-btn"
              @click="switchPage('/contract/contract-management', { licenseeId: scope.row.userId })"
            >
              {{ scope.row.signedContractCount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="交易次数" min-width="100" align="right">
          <template #default="scope">
            <span
              class="text-btn"
              @click="switchPage('/trade/trade-record-management', { relatedAccountName: scope.row.username })"
            >
              {{ scope.row.tradeCount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column property="balance" label="代币余额" align="right" min-width="100" />
        <el-table-column label="手机号" min-width="150">
          <template #default="scope">
            <div class="table-cell-item">
              <span>{{ scope.row.mobile || "-" }}</span>
              <el-icon class="icon-btn" title="复制" @click="copy(scope.row.mobile)" v-if="scope.row.mobile">
                <copy-document />
              </el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="邮箱" min-width="250">
          <template #default="scope">
            <div class="table-cell-item">
              <span>{{ scope.row.email || "-" }}</span>
              <el-icon class="icon-btn" title="复制" @click="copy(scope.row.email)" v-if="scope.row.email">
                <copy-document />
              </el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" min-width="160">
          <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
        </el-table-column>
        <el-table-column label="账号状态">
          <template #default="scope">
            <el-tooltip
              effect="dark"
              :content="`${scope.row.reason}${scope.row.remark ? '（' + scope.row.remark + '）' : ''}`"
              placement="top"
              v-if="scope.row.status === 1"
            >
              {{ statusMapping.find((item) => item.value === scope.row.status).label }}
            </el-tooltip>
            <span v-else>{{ statusMapping.find((item) => item.value === scope.row.status).label }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" width="40">
          <template #header>
            <el-icon class="operation-icon" title="操作">
              <operation />
            </el-icon>
          </template>
          <template #default="scope">
            <div class="operate-btns">
              <el-icon class="icon-btn" title="冻结" @click="freeze(scope.row.userId)" v-if="scope.row.status === 0">
                <close />
              </el-icon>
              <el-icon class="icon-btn" title="恢复" @click="restore(scope.row.userId)" v-if="scope.row.status === 1">
                <check />
              </el-icon>
              <el-icon class="icon-btn" title="审核" @click="audit(scope.row.username)" v-if="scope.row.status === 2">
                <checked />
              </el-icon>
            </div>
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

  <el-dialog v-model="setTagPopupShow" title="管理用户标签">
    <div class="tag-area">
      <el-select style="width: 100%" v-model="setTagData.tags" multiple clearable placeholder="请选择标签">
        <el-option v-for="item in userTagsList" :key="item.tagId" :label="item.tag" :value="item.tagId" />
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

  <el-dialog v-model="freezePopupShow" title="冻结账户" min-width="800px">
    <form-item label="冻结原因">
      <el-radio-group v-model="operateData.reason">
        <el-radio label="抄袭、侵权"></el-radio>
        <el-radio label="欺诈"></el-radio>
        <el-radio label="垃圾广告"></el-radio>
        <el-radio label="色情、暴力"></el-radio>
        <el-radio label="不实信息"></el-radio>
        <el-radio label="恶意操作"></el-radio>
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
      <el-button @click="freezePopupShow = false">取消</el-button>
      <el-button type="primary" @click="operateConfirm(1)">冻结</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { nextTick, reactive, toRefs } from "vue";
import { formatDate, relativeTime, dateRange } from "../../utils/common";
import { Edit, Operation, CopyDocument, Close, Check, Checked } from "@element-plus/icons-vue";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage, ElMessageBox } from "element-plus";
import { ContractsService, NodeService, ResourceService, UserService } from "@/api/request";
import { dateRangeShortcuts } from "@/assets/data";
import { User, UserTag } from "@/typings/object";
import { UserListParams, OperateUserParams } from "@/typings/params";

/** 用户列表参数 */
interface MyUserListParams extends UserListParams {
  registerDate?: string[];
  tags?: number[];
}

/** 设置标签数据 */
interface SetTagData {
  users: User[];
  tags: number[];
  newTag: string;
}

export default {
  components: {
    Edit,
    Operation,
    CopyDocument,
    Close,
    Check,
    Checked,
  },

  setup() {
    const { query, switchPage } = useMyRouter();
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
      tableData: [] as User[],
      total: 0,
      selectedData: [] as User[],
      userTagsList: [] as UserTag[],
      searchData: { currentPage: 1, limit: 20 } as MyUserListParams,
      setTagData: {} as SetTagData,
      operateData: {} as OperateUserParams,
      copyValue: "",
      setTagPopupShow: false,
      freezePopupShow: false,
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        data.tableData = [];
        data.loading = true;
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit, tags = [], registerDate } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        data.searchData.tagIds = tags.join(",");
        [data.searchData.startRegisteredDate, data.searchData.endRegisteredDate] = dateRange(registerDate);
        const result = await UserService.getUserList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data;

          if (dataList.length === 0) {
            data.loading = false;
            return;
          }

          const userIds = dataList
            .map((item: User) => {
              return item.userId;
            })
            .join(",");
          const results = await Promise.all([
            ResourceService.getUserResourcesCount({ userIds }),
            NodeService.getUserNodesCount({ userIds }),
            ContractsService.getUserContractsCount({ userIds }),
            UserService.getUserTradeCount({ userIds }),
            UserService.getUserAccount({ userIds }),
          ]);
          dataList.forEach((user: User) => {
            const { userId } = user;
            user.createdResourceCount = results[0].data.data.find(
              (item: { userId: number; createdResourceCount: number }) => item.userId === userId
            ).createdResourceCount;
            user.createdNodeCount = results[1].data.data.find(
              (item: { userId: number; createdNodeCount: number }) => item.userId === userId
            ).createdNodeCount;
            user.signedContractCount = results[2].data.data.find(
              (item: { userId: number; signedContractCount: number }) => item.userId === userId
            ).signedContractCount;
            user.tradeCount = results[3].data.data.find(
              (item: { userId: number; count: number }) => item.userId === userId
            ).count;
            user.balance = (
              results[4].data.data.find(
                (item: { ownerUserId: number; balance: string }) => item.ownerUserId == userId
              ) || { balance: "-" }
            ).balance;
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

      /** 复制 */
      copy(value: string) {
        data.copyValue = value;
        nextTick(() => {
          const input: any = document.getElementById("copyInput");
          input.select();
          document.execCommand("Copy");
          ElMessage.success("复制成功");
        });
      },

      /** 冻结操作 */
      freeze(userId: string) {
        data.operateData = { userId } as OperateUserParams;
        data.freezePopupShow = true;
      },

      /** 恢复操作 */
      restore(userId: string) {
        ElMessageBox.confirm("确认要恢复该账号的使用吗？", "恢复账号", {
          confirmButtonText: "恢复",
          cancelButtonText: "取消",
        }).then(() => {
          data.operateData.userId = userId;
          this.operateConfirm(0);
        });
      },

      /** 审核 */
      audit(username: string) {
        switchPage("/user/qualification-audit", { username });
      },

      /** 操作（冻结/恢复） */
      async operateConfirm(type: 0 | 1) {
        if (type === 1 && !data.operateData.reason) {
          ElMessage("请选择冻结原因");
          return;
        }

        data.operateData.status = type;
        const result = await UserService.freeOrRecoverUser(data.operateData);
        const { errcode } = result.data;
        if (errcode === 0) {
          data.freezePopupShow = false;
          this.getData();
        }
      },

      /** 选择表格项 */
      selectTable(selected: User[]) {
        data.selectedData = selected;
      },

      /** 设置用户标签 */
      setTag(item?: User) {
        if (item) {
          data.setTagData.users = [item];
          data.setTagData.tags = item.tags.map((item) => item.tagId);
        } else {
          data.setTagData.users = data.selectedData;
          data.setTagData.tags = [];
        }
        data.setTagData.newTag = "";
        data.setTagPopupShow = true;
      },

      /** 添加新标签 */
      async newTag() {
        const { newTag } = data.setTagData;
        if (!newTag) return;

        const existTag = data.userTagsList.find((item) => item.tag === newTag);

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
          data.userTagsList.push(newTag);
          data.setTagData.tags.push(newTag.tagId);
          data.setTagData.newTag = "";
        }
      },

      /** 设置用户标签 */
      async setTagConfirm() {
        const { users, tags } = data.setTagData;
        let addTags: number[] = [];
        if (users.length === 1) {
          // 非批量操作，统计删除标签与添加标签
          const user = users[0];
          const deleteTags = [] as number[];
          user.tags.forEach((item: { tagId: number }) => {
            const { tagId } = item;
            if (!tags.includes(tagId)) deleteTags.push(tagId);
          });
          tags.forEach((id: number) => {
            if (!user.tags.find((item: { tagId: number }) => item.tagId === id)) {
              addTags.push(id);
            }
          });
          if (deleteTags.length !== 0) {
            // 存在删除标签，执行删除
            const result = await UserService.unsetTag(user.userId, {
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
          const userIds = users.map((item: User) => item.userId);
          const result = await UserService.setTag({ userIds, tagIds: addTags });
          const { errcode } = result.data;
          if (errcode === 0) {
            data.setTagPopupShow = false;
            this.getData();
          }
        }
      },

      /** 删除用户标签 */
      async removeTag(userId: number, tagId: number) {
        const result = await UserService.unsetTag(userId, {
          tagIds: [tagId],
        });
        const { errcode } = result.data;
        if (errcode === 0) {
          const item = data.tableData.find((user) => user.userId === userId);
          if (!item) return;
          item.tags = item.tags.filter((tag) => tag.tagId !== tagId);
        }
      },
    };

    /** 获取用户标签 */
    const getUserTags = async () => {
      const result = await UserService.getUserTagsList();
      data.userTagsList = result.data.data;
    };

    data.searchData.keywords = query.value.keywords;
    data.searchData.userId = query.value.userId;
    data.searchData.tags = query.value.tag ? [Number(query.value.tag)] : [];
    methods.getData(true);
    getUserTags();

    return {
      dateRangeShortcuts,
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
.tag-area {
  width: 100%;
  border-radius: 4px;
  box-shadow: 0 0 0 1px #dcdfe6;

  :deep .el-input__inner,
  :deep .el-select .el-input.is-focus .el-input__inner {
    box-shadow: none !important;
  }
}
</style>
