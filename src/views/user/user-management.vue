<!-- 用户管理 -->
<template>
  <list-template>
    <template v-slot:hidden>
      <input id="copyInput" v-model="copyValue" />
    </template>

    <template v-slot:barRight>
      <el-button type="primary">管理标签</el-button>
    </template>

    <template v-slot:filterBar>
      <filter-item label="关键字搜索">
        <el-input v-model="searchData.keywords" placeholder="请输入用户名、注册手机号/邮箱" clearable />
      </filter-item>
      <filter-item label="注册时间">
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
      </filter-item>
      <filter-item>
        <el-button type="primary" @click="getData()">搜索</el-button>
      </filter-item>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" stripe @selection-change="selectTable">
        <el-table-column type="selection" />
        <el-table-column property="yonghu" label="用户" min-width="100" show-overflow-tooltip />
        <el-table-column min-width="200">
          <template #default="scope">
            <div class="tags-box">
              <div class="tag" v-for="item in scope.row.biaoqian" :key="item">{{ item }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="最近登录" width="110">
          <template #default="scope">{{ relativeTime(scope.row.zuijindenglu) }}</template>
        </el-table-column>
        <el-table-column property="fabuziyuanshu" label="发布资源数" sortable width="120" />
        <el-table-column property="xiaofeiheyueshu" label="消费合约数" sortable width="120" />
        <el-table-column property="jiaoyicishu" label="交易次数" width="100" />
        <el-table-column property="daibiyue" label="代币余额" width="100" />
        <el-table-column label="注册手机号/邮箱" min-width="200">
          <template #default="scope">
            <div class="info-group">
              {{ scope.row.zhuceshoujihao }}
              <el-icon class="copy-btn" title="复制" @click="copy(scope.row.zhuceshoujihao)"><copy-document /></el-icon>
            </div>
            <div class="info-group">
              {{ scope.row.zhuceshouyouxiang }}
              <el-icon class="copy-btn" title="复制" @click="copy(scope.row.zhuceshouyouxiang)">
                <copy-document />
              </el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" sortable width="110">
          <template #default="scope">{{ formatDate(scope.row.zhuceshijian, "YYYY-MM-DD") }}</template>
        </el-table-column>
        <el-table-column label="账号状态">
          <template #default="scope">
            <el-tooltip effect="dark" :content="'恶意操作'" placement="top" v-if="scope.row.zhanghaozhuangtai === 3">
              {{ statusMapping.find((item) => item.value === scope.row.zhanghaozhuangtai).label }}
            </el-tooltip>
            <span v-else>{{ statusMapping.find((item) => item.value === scope.row.zhanghaozhuangtai).label }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" min-width="90">
          <template #default="scope">
            <div class="operate-btns">
              <el-button type="danger" @click="freeze(scope.row.yonghu)" v-if="scope.row.zhanghaozhuangtai === 1">
                冻结
              </el-button>
              <el-button type="primary" @click="freeze(scope.row.yonghu)" v-if="scope.row.zhanghaozhuangtai === 2">
                审核
              </el-button>
              <el-button type="success" @click="restore(scope.row.yonghu)" v-if="scope.row.zhanghaozhuangtai === 3">
                恢复
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
        :total="list.length"
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
      <span class="dialog-footer">
        <el-button @click="freezePopupShow = false">取消</el-button>
        <el-button type="primary" @click="freezeConfirm()">冻结</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineAsyncComponent, nextTick, reactive, toRefs } from "vue-demi";
import { formatDate, relativeTime } from "../../utils/common";
import { CopyDocument } from "@element-plus/icons-vue";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage, ElMessageBox } from "element-plus";

export default {
  components: {
    "list-template": defineAsyncComponent(() => import("@/components/list-template.vue")),
    "filter-item": defineAsyncComponent(() => import("@/components/filter-item.vue")),
    CopyDocument,
  },

  setup() {
    const { switchPage } = useMyRouter();
    const data = reactive({
      statusMapping: [
        { value: 1, label: "未审核" },
        { value: 2, label: "已通过" },
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
      list: [
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2", "标签3", "标签4", "标签5"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 3000,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
        {
          yonghu: "ZhuChenzhuchenzhuchen",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 3000,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 2,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 3000,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 3,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 3000,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 3000,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 30,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 30,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 30,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 30,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 30,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 30,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 30,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 30,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 30,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 30,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 30,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 30,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 30,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 30,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 30,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 30,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 30,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 30,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 30,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
        {
          yonghu: "ZhuC",
          biaoqian: ["标签1", "标签2"],
          zuijindenglu: 1625656179577,
          fabuziyuanshu: 2,
          xiaofeiheyueshu: 10,
          jiaoyicishu: 10,
          daibiyue: 30,
          zhuceshoujihao: "18215465269",
          zhuceshouyouxiang: "514254153@qq.com",
          zhuceshijian: 1645756179577,
          zhanghaozhuangtai: 1,
        },
      ],
      tableData: [] as any[],
      selectedData: [] as any[],
      searchData: {
        keywords: "",
        registerDate: [null, null] as number[] | null[],
        currentPage: 1,
      },
      operateData: {
        id: "",
        freezeReason: null as number | null,
        remark: "",
      },
      copyValue: "",
      freezePopupShow: false,
    });

    const methods = {
      // 获取页面数据
      getData() {
        const lastIndex = data.searchData.currentPage * 10 - 1;
        const result = data.list.slice(lastIndex - 9, lastIndex);
        data.tableData = result;
      },

      // 切换表格页码
      changePage(e: number) {
        data.searchData.currentPage = e;
        this.getData();
      },

      // 复制
      copy(value: string) {
        data.copyValue = value;
        nextTick(() => {
          const input: any = document.getElementById("copyInput");
          input.select();
          document.execCommand("Copy");
          ElMessage({
            message: "复制成功",
            grouping: true,
            type: "success",
          });
        });
      },

      // 冻结操作
      freeze(id: string) {
        data.operateData.id = id;
        data.operateData.freezeReason = null;
        data.operateData.remark = "";
        data.freezePopupShow = true;
      },

      // 恢复操作
      restore(id: string) {
        ElMessageBox.confirm("确认要恢复该账号的使用吗？", "恢复账号", {
          confirmButtonText: "恢复",
          cancelButtonText: "取消",
        }).then(() => {
          console.error(id);
        });
      },

      // 冻结
      freezeConfirm() {
        console.error(data.operateData.id);
        console.error(data.operateData);
      },

      // 选择表格项
      selectTable(selected: any[]) {
        data.selectedData = selected;
      },
    };

    methods.getData();

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

<style lang="scss" scoped>
.tags-box {
  display: flex;
  align-items: center;

  .tag {
    flex-shrink: 0;
    padding: 0 3px;
    cursor: pointer;
    background-color: #304156;
    color: #fff;
    border-radius: 4px;

    & + .tag {
      margin-left: 5px;
    }
  }
}

.info-group {
  word-break: keep-all;
  display: flex;
  align-items: center;

  .copy-btn {
    color: #169bd5;
    margin-left: 5px;
    cursor: pointer;
    transition: all 0.2s linear;

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
