<!-- 用户管理 -->
<template>
  <list-template>
    <template v-slot:hidden>
      <input id="copyInput" v-model="copyValue" />
    </template>

    <template v-slot:barRight>
      <el-button type="primary" @click="switchPage('/user/tag-management')">管理标签</el-button>
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
          start-placeholder="起始日期"
          end-placeholder="截止日期"
          :shortcuts="shortcuts"
        />
      </form-item>
      <form-item>
        <el-button type="primary" @click="getData(true)">搜索</el-button>
      </form-item>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" stripe @selection-change="selectTable">
        <el-table-column type="selection" />
        <el-table-column type="expand">
          <template #default="props">
            <div class="tags-box">
              <el-tag class="tag" closable v-for="item in props.row.tags" :key="item.tagId" @close="deleteTag(tag)">
                {{ item.tag }}
              </el-tag>
              <el-button style="margin-left: 10px" type="primary" @click="manageTags(props.row)">管理</el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column property="username" label="用户" min-width="150" show-overflow-tooltip />
        <el-table-column label="标签数" width="80" align="right">
          <template #default="scope">{{ scope.row.tags.length }}</template>
        </el-table-column>
        <el-table-column label="最近登录" width="160">
          <template #default="scope">
            {{ scope.row.latestLoginDate ? relativeTime(scope.row.latestLoginDate) : "-" }}
          </template>
        </el-table-column>
        <el-table-column property="createdResourceCount" label="发布资源数" align="right" width="120" />
        <el-table-column property="createdNodeCount" label="运营节点数" align="right" width="120" />
        <el-table-column property="signedContractCount" label="消费合约数" align="right" width="120" />
        <el-table-column property="jiaoyicishu" label="交易次数" align="right" width="100" />
        <el-table-column label="代币余额" align="right" width="100">
          <template #default="scope">{{ (scope.row.daibiyue || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="注册手机号" width="130">
          <template #default="scope">
            <div class="info-group">
              {{ scope.row.mobile || "-" }}
              <el-icon class="copy-btn" title="复制" @click="copy(scope.row.mobile)" v-if="scope.row.mobile">
                <copy-document />
              </el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="注册邮箱" min-width="250">
          <template #default="scope">
            <div class="info-group">
              {{ scope.row.email || "-" }}
              <el-icon class="copy-btn" title="复制" @click="copy(scope.row.email)" v-if="scope.row.email">
                <copy-document />
              </el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" sortable width="160">
          <template #default="scope">{{ formatDate(scope.row.createDate) }}</template>
        </el-table-column>
        <el-table-column label="账号状态">
          <template #default="scope">
            <el-tooltip effect="dark" :content="'恶意操作'" placement="top" v-if="scope.row.status === 1">
              {{ statusMapping.find((item) => item.value === scope.row.status).label }}
            </el-tooltip>
            <span v-else>{{ statusMapping.find((item) => item.value === scope.row.status).label }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" min-width="90">
          <template #default="scope">
            <div class="operate-btns">
              <el-button type="danger" @click="freeze(scope.row.userId)" v-if="scope.row.status === 0">
                冻结
              </el-button>
              <el-button type="success" @click="restore(scope.row.userId)" v-if="scope.row.status === 1">
                恢复
              </el-button>
              <el-button type="primary" @click="freeze(scope.row.userId)" v-if="scope.row.status === 2">
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

  <el-dialog v-model="freezePopupShow" title="冻结账户" width="50%">
    <el-radio-group v-model="operateData.freezeReason">
      <el-radio :label="1">抄袭、侵权</el-radio>
      <el-radio :label="2">欺诈</el-radio>
      <el-radio :label="3">垃圾广告</el-radio>
      <el-radio :label="4">色情、暴力</el-radio>
      <el-radio :label="5">不实信息</el-radio>
      <el-radio :label="6">恶意操作</el-radio>
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
      <el-button type="primary" @click="freezeConfirm()">冻结</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineAsyncComponent, nextTick, reactive, toRefs } from "vue-demi";
import { formatDate, relativeTime } from "../../utils/common";
import { CopyDocument } from "@element-plus/icons-vue";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage, ElMessageBox } from "element-plus";
import { ContractsService, NodeService, ResourceService, userListParams, UserService } from "@/api/request";

/** 用户数据 */
export interface User {
  userId: string;
  username: string;
  tags: string[];
  latestLoginDate: string;
  createdResourceCount: number;
  createdNodeCount: number;
  signedContractCount: number;
  daibiyue: number;
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
    "list-template": defineAsyncComponent(() => import("@/components/list-template.vue")),
    "form-item": defineAsyncComponent(() => import("@/components/form-item.vue")),
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
      shortcuts: [
        {
          text: "上周",
          value: () => {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
            return [start, end];
          },
        },
        {
          text: "上月",
          value: () => {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
            return [start, end];
          },
        },
        {
          text: "前三个月",
          value: () => {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
            return [start, end];
          },
        },
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
      } as userListParams,
      operateData: {
        id: "",
        freezeReason: null as number | null,
        remark: "",
      },
      copyValue: "",
      freezePopupShow: false,
    });

    const methods = {
      /** 获取列表数据 */
      async getData(init = false) {
        if (init) data.searchData.currentPage = 1;
        const { currentPage, limit, tags = [], registerDate = ["", ""] } = data.searchData;
        data.searchData.skip = (currentPage - 1) * limit;
        data.searchData.tagIds = tags.join(",");
        data.searchData.startRegisteredDate = registerDate[0];
        data.searchData.endRegisteredDate = registerDate[1];
        const result = await UserService.getUserList(data.searchData);
        const { errcode, msg } = result.data;
        if (errcode === 0) {
          const { dataList, totalItem } = result.data.data;

          const userIds = dataList
            .map((item: User) => {
              return item.userId;
            })
            .join(",");
          const results = await Promise.all([
            ResourceService.getUserResourcesCount({ userIds }),
            NodeService.getUserNodesCount({ userIds }),
            ContractsService.getUserContractsCount({ userIds }),
          ]);
          dataList.forEach((user: User) => {
            user.createdResourceCount = results[0].data.data.find(
              (item: { userId: string; createdResourceCount: number }) => item.userId === user.userId
            ).createdResourceCount;
            user.createdNodeCount = results[1].data.data.find(
              (item: { userId: string; createdNodeCount: number }) => item.userId === user.userId
            ).createdNodeCount;
            user.signedContractCount = results[2].data.data.find(
              (item: { userId: string; signedContractCount: number }) => item.userId === user.userId
            ).signedContractCount;
          });

          data.tableData = dataList;
          data.total = totalItem;
        } else {
          ElMessage.error(msg);
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
      freeze(id: string) {
        data.operateData.id = id;
        data.operateData.freezeReason = null;
        data.operateData.remark = "";
        data.freezePopupShow = true;
      },

      /** 恢复操作 */
      restore(id: string) {
        ElMessageBox.confirm("确认要恢复该账号的使用吗？", "恢复账号", {
          confirmButtonText: "恢复",
          cancelButtonText: "取消",
        }).then(() => {
          console.error(id);
        });
      },

      /** 冻结 */
      freezeConfirm() {
        console.error(data.operateData.id);
        console.error(data.operateData);
      },

      /** 选择表格项 */
      selectTable(selected: User[]) {
        data.selectedData = selected;
      },
    };

    /** 获取用户标签 */
    const getUserTags = async () => {
      const result = await UserService.getUserTagsList();
      data.userTagsList = result.data.data;
    };

    methods.getData(true);
    getUserTags();

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
.tags-box {
  width: 100%;
  padding: 0 16px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  .tag {
    flex-shrink: 0;
    margin: 5px;
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
