<!-- 国际化管理 -->
<template>
  <list-template>
    <!-- <template v-slot:title>用户管理</template>

    <template v-slot:barRight>right</template> -->

    <template v-slot:filterBar>filterBar</template>

    <template v-slot:table>
      <el-table :data="tableData" stripe style="min-width: 100%">
        <el-table-column type="selection" />
        <el-table-column property="yonghu" label="用户" min-width="100" show-overflow-tooltip />
        <el-table-column property="biaoqian" min-width="200">
          <template #default="scope">
            <div class="tags-box">
              <div class="tag" v-for="item in scope.row.biaoqian" :key="item">{{ item }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column property="zuijindenglu" label="最近登录" width="110">
          <template #default="scope">{{ relativeTime(scope.row.zuijindenglu) }}</template>
        </el-table-column>
        <el-table-column property="fabuziyuanshu" label="发布资源数" sortable width="120" />
        <el-table-column property="xiaofeiheyueshu" label="消费合约数" sortable width="120" />
        <el-table-column property="jiaoyicishu" label="交易次数" width="100" />
        <el-table-column property="daibiyue" label="代币余额" width="100" />
        <el-table-column property="zhuceshoujihaoyouxiang" label="注册手机号/邮箱" min-width="200">
          <template #default="scope">
            <div class="phone-email">
              {{ scope.row.zhuceshoujihao }}
              <el-icon class="copy-btn" title="复制"><copy-document /></el-icon>
            </div>
            <div class="phone-email">
              {{ scope.row.zhuceshouyouxiang }}
              <el-icon class="copy-btn" title="复制"><copy-document /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column property="zhuceshijian" label="注册时间" sortable width="110">
          <template #default="scope">{{ formatDate(scope.row.zhuceshijian, "YYYY-MM-DD") }}</template>
        </el-table-column>
        <el-table-column property="zhanghaozhuangtai" label="账号状态">
          <template #default="scope">{{ statusMapping[scope.row.zhanghaozhuangtai] }}</template>
        </el-table-column>
        <el-table-column property="caozuo" label="操作" fixed="right">
          <template #default="scope">
            <div class="operate-btn freeze" v-if="scope.row.zhanghaozhuangtai === 1">冻结</div>
            <div class="operate-btn audit" v-if="scope.row.zhanghaozhuangtai === 2">审核</div>
            <div class="operate-btn restore" v-if="scope.row.zhanghaozhuangtai === 3">恢复</div>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <template v-slot:pagination>
      <el-pagination
        layout="total, prev, pager, next, jumper"
        v-model:currentPage="currentPage"
        :total="list.length"
        @current-change="changePage($event)"
      >
      </el-pagination>
    </template>
  </list-template>
</template>

<script lang="ts">
import { defineAsyncComponent, reactive, toRefs } from "vue";
import { formatDate, relativeTime } from "../../utils/common";
import { CopyDocument } from "@element-plus/icons-vue";
import { useMyRouter } from "@/utils/hooks";

export default {
  components: {
    "list-template": defineAsyncComponent(() => import("@/layout/list-template.vue")),
    CopyDocument,
  },

  setup() {
    const { switchPage } = useMyRouter();
    const data = reactive({
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
      currentPage: 1,
      statusMapping: {
        1: "正常",
        2: "待审核",
        3: "冻结",
      },
    });

    const methods = {
      getData() {
        const lastIndex = data.currentPage * 10 - 1;
        const result = data.list.slice(lastIndex - 9, lastIndex);
        data.tableData = result;
      },

      changePage(e: number) {
        data.currentPage = e;
        this.getData();
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
.phone-email {
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

.operate-btn {
  width: fit-content;
  padding: 3px 8px;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s linear;

  &:hover {
    opacity: 0.6;
  }

  &:active {
    opacity: 0.8;
  }

  &.freeze {
    background-color: #f56c6c;
  }

  &.audit {
    background-color: #169bd5;
  }

  &.restore {
    background-color: #67c23a;
  }
}
</style>
