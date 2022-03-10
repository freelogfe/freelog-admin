<!-- 内测资格审核 -->
<template>
  <list-template>
    <template v-slot:barRight>
      <span class="selected-tip" v-show="selectedData.length">已选中{{ selectedData.length }}条</span>
      <el-button type="primary" @click="audit()">批量审核</el-button>
    </template>

    <template v-slot:filterBar>
      <form-item label="关键字搜索">
        <el-input v-model="searchData.keywords" placeholder="请输入用户名、注册手机号/邮箱" clearable />
      </form-item>
      <form-item label="状态">
        <el-select v-model="searchData.status" clearable placeholder="请选择状态">
          <el-option v-for="item in statusMapping" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </form-item>
      <form-item>
        <el-button type="primary" @click="getData()">搜索</el-button>
      </form-item>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" stripe @selection-change="selectTable">
        <el-table-column type="selection" :selectable="(row) => row.shenhezhuangtai === 1" />
        <el-table-column label="申请日期" width="160">
          <template #default="scope">{{ formatDate(scope.row.shenqingriqi) }}</template>
        </el-table-column>
        <el-table-column property="zhiye" label="职业" show-overflow-tooltip />
        <el-table-column property="quyu" label="区域" show-overflow-tooltip />
        <el-table-column property="qita" label="其他" show-overflow-tooltip />
        <el-table-column property="yonghuming" label="用户名" min-width="100" show-overflow-tooltip />
        <el-table-column property="shouji" label="手机" min-width="100" show-overflow-tooltip />
        <el-table-column property="youxiang" label="邮箱" min-width="100" show-overflow-tooltip />
        <el-table-column label="最后登录" width="160">
          <template #default="scope">{{ relativeTime(scope.row.zuihoudenglu) }}</template>
        </el-table-column>
        <el-table-column label="审核状态">
          <template #default="scope">
            <el-tooltip
              effect="dark"
              :content="'用户提供链接无法打开'"
              placement="top"
              v-if="scope.row.shenhezhuangtai === 3"
            >
              {{ statusMapping.find((item) => item.value === scope.row.shenhezhuangtai).label }}
            </el-tooltip>
            <span v-else>{{ statusMapping.find((item) => item.value === scope.row.shenhezhuangtai).label }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" min-width="90">
          <template #default="scope">
            <el-button type="primary" @click="audit(scope.row)" v-if="scope.row.shenhezhuangtai === 1">
              审核
            </el-button>
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
      <el-button @click="auditPopupShow = false">取消</el-button>
      <el-button type="primary" @click="auditConfirm()">确定</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineAsyncComponent, reactive, toRefs } from "vue-demi";
import { formatDate, relativeTime } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage } from "element-plus";

export default {
  components: {
    "list-template": defineAsyncComponent(() => import("@/components/list-template.vue")),
    "form-item": defineAsyncComponent(() => import("@/components/form-item.vue")),
  },

  setup() {
    const { switchPage } = useMyRouter();
    const data = reactive({
      statusMapping: [
        { value: 1, label: "未审核" },
        { value: 2, label: "已通过" },
        { value: 3, label: "未通过" },
      ],
      list: [
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 2,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 3,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC4",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC5",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC6",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
        {
          shenqingriqi: 1645756179577,
          zhiye: "开发",
          quyu: "深圳",
          qita: "微信公众号ABC",
          yonghuming: "ZhuC",
          shouji: "18215465269",
          youxiang: "514254153@qq.com",
          zuihoudenglu: 1625656179577,
          shenhezhuangtai: 1,
        },
      ],
      tableData: [] as any[],
      selectedData: [] as any[],
      searchData: {
        currentPage: 1,
      },
      operateData: {
        items: [] as any[],
        auditResult: null as number | null,
        remark: "",
      },
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
}

.audit-popup-body {
  margin-top: -40px;

  .title {
    font-size: 16px;
    font-weight: bold;
    margin: 20px 0;
  }

  .apply-info-box {
    max-height: 300px;
    overflow: auto;

    .apply-info {
      padding: 10px;
      background-color: #eef1f6;
      line-height: 1.5;
      border-radius: 6px;

      & + .apply-info {
        margin-top: 5px;
      }
    }
  }
}
</style>
