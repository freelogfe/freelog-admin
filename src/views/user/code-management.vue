<!-- 邀请码管理 -->
<template>
  <list-template>
    <template v-slot:hidden>
      <input id="copyInput" v-model="copyValue" />
    </template>

    <template v-slot:barRight>
      <el-button type="primary" @click="audit()">批量生成邀请码</el-button>
    </template>

    <template v-slot:filterBar>
      <filter-item label="关键字搜索">
        <el-input v-model="searchData.keywords" placeholder="请输入邀请码或邀请者用户名" clearable />
      </filter-item>
      <filter-item label="状态">
        <el-select v-model="searchData.status" clearable placeholder="请选择状态">
          <el-option v-for="item in statusMapping" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </filter-item>
      <filter-item label="创建时间">
        <el-date-picker
          v-model="searchData.createDate"
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
        <el-table-column label="邀请码">
          <template #default="scope">
            <div class="info-group">
              {{ scope.row.yaoqingma }}
              <el-icon class="copy-btn" title="复制" @click="copy(scope.row.yaoqingma)"><copy-document /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="110">
          <template #default="scope">{{ formatDate(scope.row.chuangjianshijian, "YYYY-MM-DD") }}</template>
        </el-table-column>
        <el-table-column property="yaoqingzhe" label="邀请者(用户名)" min-width="120" show-overflow-tooltip />
        <el-table-column label="使用次数">
          <template #default="scope">{{ scope.row.shengyucishu }}/{{ scope.row.zongcishu }}</template>
        </el-table-column>
        <el-table-column label="有效期" width="190" show-overflow-tooltip>
          <template #default="scope">
            {{ formatDate(scope.row.kaishiriqi, "YYYY-MM-DD") }}至{{ formatDate(scope.row.jieshuriqi, "YYYY-MM-DD") }}
          </template>
        </el-table-column>
        <el-table-column property="beizhu" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="状态">
          <template #default="scope">
            {{ statusMapping.find((item) => item.value === scope.row.zhuangtai).label }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" min-width="90">
          <template #default="scope">
            <el-button type="primary" @click="audit(scope.row)" v-if="scope.row.zhuangtai === 1">禁用</el-button>
            <el-button type="primary" @click="audit(scope.row)" v-if="scope.row.zhuangtai === 2">解禁</el-button>
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
      >
      </el-pagination>
    </template>
  </list-template>

  <el-dialog v-model="auditPopupShow" title="审核" width="50%">
    <div class="audit-popup-body">
      <div class="title">申请信息</div>
      <div class="apply-info-box">
        <div class="apply-info" v-for="(item, index) in operateData.items" :key="item.yonghuming + index">
          <div>用户：{{ item.yonghuming }}</div>
          <div>职业：{{ item.zhiye }}</div>
          <div>区域：{{ item.quyu }}</div>
          <div>其他：{{ item.qita }}</div>
        </div>
      </div>
      <div class="title">审核结果</div>
      <el-radio-group v-model="operateData.auditResult">
        <el-radio :label="1">通过</el-radio>
        <el-radio :label="2">拒绝：链接无法打开</el-radio>
        <el-radio :label="3">拒绝：公众号ID不存在</el-radio>
        <el-radio :label="4">拒绝：其他原因</el-radio>
      </el-radio-group>
      <el-input
        style="margin-top: 10px"
        v-model="operateData.remark"
        :autosize="{ minRows: 2, maxRows: 4 }"
        type="textarea"
        placeholder="请输入备注（选填）"
      />
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="auditPopupShow = false">取消</el-button>
        <el-button type="primary" @click="auditConfirm()">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineAsyncComponent, reactive, toRefs } from "vue-demi";
import { formatDate, relativeTime } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage } from "element-plus";
import { CopyDocument } from "@element-plus/icons-vue";
import { nextTick } from 'vue';

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
        { value: 1, label: "生效中" },
        { value: 2, label: "已禁用" },
        { value: 3, label: "已过期" },
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
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 2,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 3,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
        {
          yaoqingma: "ajkxjkskn",
          chuangjianshijian: 1625656179577,
          yaoqingzhe: "ZhuC",
          shengyucishu: 3,
          zongcishu: 10,
          kaishiriqi: 1605656179577,
          jieshuriqi: 1625656179577,
          beizhu: "阿斯利康的飞机阿斯利康的飞机",
          zhuangtai: 1,
        },
      ],
      tableData: [] as any[],
      selectedData: [] as any[],
      searchData: {
        keywords: "",
        status: null as number | null,
        createDate: [null, null] as number[] | null[],
        currentPage: 1,
      },
      operateData: {
        items: [] as any[],
        auditResult: null as number | null,
        remark: "",
      },
      copyValue: "",
      auditPopupShow: false,
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

      // 审核操作
      audit(item?: any) {
        if (item) {
          data.operateData.items = [item];
        } else {
          if (data.selectedData.length === 0) {
            ElMessage({
              message: "请选择需要审核的条目",
              grouping: true,
              type: "info",
            });
            return;
          }

          data.operateData.items = data.selectedData;
        }
        data.operateData.auditResult = null;
        data.operateData.remark = "";
        data.auditPopupShow = true;
      },

      // 审核
      auditConfirm() {
        console.error(data.operateData.items);
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
.selected-tip {
  font-size: 14px;
  color: #999;
  margin-right: 10px;
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
</style>
