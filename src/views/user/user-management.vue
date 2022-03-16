<!-- 用户管理 -->
<template>
  <list-template>
    <template v-slot:hidden>
      <input id="copyInput" v-model="copyValue" />
    </template>

    <template v-slot:barLeft>
      <span class="selected-tip" v-show="selectedData.length"
        >已选中{{ selectedData.length }}条</span
      >
    </template>

    <template v-slot:barRight>
      <el-button type="primary" @click="setTag()">批量管理用户标签</el-button>
      <el-button type="primary" @click="switchPage('/user/tag-management')"
        >管理标签</el-button
      >
    </template>

    <template v-slot:filterBar>
      <form-item label="关键字搜索">
        <el-input
          v-model="searchData.keywords"
          placeholder="请输入用户名、注册手机号/邮箱"
          clearable
          @keyup.enter="getData(true)"
        />
      </form-item>
      <form-item label="标签">
        <el-select
          v-model="searchData.tags"
          multiple
          placeholder="请选择标签"
          clearable
        >
          <el-option
            v-for="item in userTagsList"
            :key="item.tagId"
            :label="item.tag"
            :value="item.tagId"
          />
        </el-select>
      </form-item>
      <form-item label="注册时间">
        <el-date-picker
          v-model="searchData.registerDate"
          type="daterange"
          unlink-panels
          range-separator="-"
          format="YYYY/MM/DD"
          start-placeholder="起始日期"
          end-placeholder="截止日期"
          :shortcuts="dateRangeShortcuts"
        />
      </form-item>
      <form-item>
        <el-button type="primary" @click="getData(true)">搜索</el-button>
      </form-item>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" stripe @selection-change="selectTable">
        <el-table-column type="selection" />
        <el-table-column
          property="username"
          label="用户"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column label="标签" width="400">
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
              <el-button
                class="add-tag"
                size="small"
                @click="setTag(scope.row)"
              >
                管理标签
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="最近登录" width="160">
          <template #default="scope">
            {{
              scope.row.latestLoginDate
                ? relativeTime(scope.row.latestLoginDate)
                : "-"
            }}
          </template>
        </el-table-column>
        <el-table-column
          property="createdResourceCount"
          label="发布资源数"
          align="right"
          width="120"
        />
        <el-table-column
          property="createdNodeCount"
          label="运营节点数"
          align="right"
          width="120"
        />
        <el-table-column
          property="signedContractCount"
          label="消费合约数"
          align="right"
          width="120"
        />
        <el-table-column
          property="tradeCount"
          label="交易次数"
          align="right"
          width="100"
        />
        <el-table-column
          property="balance"
          label="代币余额"
          align="right"
          width="100"
        />
        <el-table-column label="注册手机号" width="130">
          <template #default="scope">
            <div class="info-group">
              {{ scope.row.mobile || "-" }}
              <el-icon
                class="copy-btn"
                title="复制"
                @click="copy(scope.row.mobile)"
                v-if="scope.row.mobile"
              >
                <copy-document />
              </el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="注册邮箱" min-width="250">
          <template #default="scope">
            <div class="info-group">
              {{ scope.row.email || "-" }}
              <el-icon
                class="copy-btn"
                title="复制"
                @click="copy(scope.row.email)"
                v-if="scope.row.email"
              >
                <copy-document />
              </el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="160">
          <template #default="scope">{{
            formatDate(scope.row.createDate)
          }}</template>
        </el-table-column>
        <el-table-column label="账号状态">
          <template #default="scope">
            <el-tooltip
              effect="dark"
              :content="scope.row.statusChangeRemark"
              placement="top"
              v-if="scope.row.status === 1"
            >
              {{
                statusMapping.find((item) => item.value === scope.row.status)
                  .label
              }}
            </el-tooltip>
            <span v-else>{{
              statusMapping.find((item) => item.value === scope.row.status)
                .label
            }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" min-width="90">
          <template #default="scope">
            <div class="operate-btns">
              <el-button
                type="danger"
                @click="freeze(scope.row.userId)"
                v-if="scope.row.status === 0"
              >
                冻结
              </el-button>
              <el-button
                type="success"
                @click="restore(scope.row.userId)"
                v-if="scope.row.status === 1"
              >
                恢复
              </el-button>
              <el-button
                type="primary"
                @click="audit(scope.row.username)"
                v-if="scope.row.status === 2"
              >
                审核
              </el-button>
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
    <el-select
      style="width: 100%"
      v-model="setTagData.tags"
      multiple
      placeholder="请选择标签"
    >
      <el-option
        v-for="item in userTagsList"
        :key="item.tagId"
        :label="item.tag"
        :value="item.tagId"
      />
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

  <el-dialog v-model="freezePopupShow" title="冻结账户">
    <el-radio-group v-model="operateData.freezeReason">
      <el-radio label="抄袭、侵权"></el-radio>
      <el-radio label="欺诈"></el-radio>
      <el-radio label="垃圾广告"></el-radio>
      <el-radio label="色情、暴力"></el-radio>
      <el-radio label="不实信息"></el-radio>
      <el-radio label="恶意操作"></el-radio>
    </el-radio-group>
    <el-input
      style="margin-top: 10px"
      v-model="operateData.remark"
      :autosize="{ minRows: 2, maxRows: 4 }"
      type="textarea"
      placeholder="请输入备注（选填）"
    />
    <template #footer>
      <el-button @click="freezePopupShow = false">取消</el-button>
      <el-button type="primary" @click="operateConfirm(1)">冻结</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { nextTick, reactive, toRefs, watch } from "vue-demi";
import { formatDate, relativeTime } from "../../utils/common";
import { CopyDocument } from "@element-plus/icons-vue";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ContractsService,
  NodeService,
  ResourceService,
  ListParams,
  UserService,
  OperateParams,
} from "@/api/request";
import { dateRangeShortcuts } from "@/assets/data";

/** 用户数据 */
export interface User {
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

/** 用户标签数据 */
export interface UserTag {
  tagId: string;
  tag: string;
}

export default {
  components: {
    CopyDocument,
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
      tableData: [] as User[],
      total: 0,
      selectedData: [] as User[],
      userTagsList: [] as UserTag[],
      searchData: {
        currentPage: 1,
        limit: 20,
      } as ListParams,
      setTagData: {} as any,
      operateData: {} as OperateParams,
      copyValue: "",
      setTagPopupShow: false,
      freezePopupShow: false,
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        if (init) data.searchData.currentPage = 1;
        const {
          currentPage,
          limit,
          tags = [],
          registerDate = ["", ""],
        } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        data.searchData.tagIds = tags.join(",");
        data.searchData.startRegisteredDate = registerDate[0];
        data.searchData.endRegisteredDate = registerDate[1];
        const result = await UserService.getUserList(data.searchData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data;

          if (dataList.length === 0) {
            data.tableData = [];
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
              (item: { userId: number; createdResourceCount: number }) =>
                item.userId === userId
            ).createdResourceCount;
            user.createdNodeCount = results[1].data.data.find(
              (item: { userId: number; createdNodeCount: number }) =>
                item.userId === userId
            ).createdNodeCount;
            user.signedContractCount = results[2].data.data.find(
              (item: { userId: number; signedContractCount: number }) =>
                item.userId === userId
            ).signedContractCount;
            user.tradeCount = results[3].data.data.find(
              (item: { userId: number; count: number }) =>
                item.userId === userId
            ).count;
            user.balance = (
              results[4].data.data.find(
                (item: { ownerUserId: number; balance: string }) =>
                  item.ownerUserId == userId
              ) || { balance: "-" }
            ).balance;
          });

          data.tableData = dataList;
          data.total = totalItem;
        }
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
        data.operateData = { userId };
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
        if (type === 1 && !data.operateData.freezeReason) {
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
          if (data.selectedData.length === 0) {
            ElMessage.info("请选择需要管理用户标签的条目");
            return;
          }
          data.setTagData.users = data.selectedData;
          data.setTagData.tags = [];
        }
        data.setTagPopupShow = true;
      },

      /** 添加新标签 */
      async newTag() {
        const { newTag } = data.setTagData;
        if (!newTag) return;

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
        let addTags = [];
        if (users.length === 1) {
          // 非批量操作，统计删除标签与添加标签
          const user = users[0];
          const deleteTags = [] as number[];
          user.tags.forEach((item: { tagId: number }) => {
            const { tagId } = item;
            if (!tags.includes(tagId)) deleteTags.push(tagId);
          });
          tags.forEach((id: number) => {
            if (
              !user.tags.find((item: { tagId: number }) => item.tagId === id)
            ) {
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
          }
        } else {
          // 批量操作，无删除标签，所有所选标签为添加标签
          addTags = tags;
        }
        if (addTags.length !== 0) {
          // 存在添加标签，执行添加
          const userIds = users.map((item: User) => item.userId).join(",");
          const result = await UserService.setTag(userIds, {
            tagIds: addTags,
          });
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

    watch(
      () => data.operateData.freezeReason,
      (cur) => {
        data.operateData.remark = cur || "";
      }
    );

    data.searchData.keywords = query.value.username;
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
.tags-box {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  .tag {
    flex-shrink: 0;
    margin: 3px;
  }

  .add-tag {
    color: #409eff;
    margin-left: 5px;
    border-style: dashed;
    margin: 3px;
  }
}

.info-group {
  word-break: keep-all;
  display: flex;
  align-items: center;

  &:hover .copy-btn {
    opacity: 1;
  }

  .copy-btn {
    color: #169bd5;
    margin-left: 5px;
    cursor: pointer;
    transition: all 0.2s linear;
    opacity: 0;

    &:hover {
      color: #005980;
    }

    &:active {
      color: #00b3ff;
    }
  }
}

.operate-btns {
  display: flex;

  button + button {
    margin-left: 10px;
  }
}
</style>
