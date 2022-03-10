<!-- 邀请码管理 -->
<template>
  <list-template>
    <template v-slot:hidden>
      <input id="copyInput" v-model="copyValue" />
    </template>

    <template v-slot:barRight>
      <el-button type="primary" @click="createInviteCode()">批量生成邀请码</el-button>
    </template>

    <template v-slot:filterBar>
      <form-item label="关键字搜索">
        <el-input v-model="searchData.keywords" placeholder="请输入邀请码或邀请者用户名" clearable />
      </form-item>
      <form-item label="状态">
        <el-select v-model="searchData.status" clearable placeholder="请选择状态">
          <el-option v-for="item in statusMapping" :key="item.value" :label="item.label" :value="item.value" />
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
          :shortcuts="shortcuts"
        />
      </form-item>
      <form-item>
        <el-button type="primary" @click="getData()">搜索</el-button>
      </form-item>
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
        <el-table-column label="创建时间" width="160">
          <template #default="scope">{{ formatDate(scope.row.chuangjianshijian) }}</template>
        </el-table-column>
        <el-table-column property="yaoqingzhe" label="邀请者(用户名)" min-width="120" show-overflow-tooltip />
        <el-table-column label="剩余次数">
          <template #default="scope">
            <div class="info-group">
              {{ scope.row.shengyucishu }}/{{ scope.row.zongcishu }}
              <el-icon class="copy-btn" title="使用记录" @click="viewRecord(scope.row.yaoqingma)"><document /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="有效期" width="310" show-overflow-tooltip>
          <template #default="scope">
            {{ formatDate(scope.row.kaishiriqi) }} 至 {{ formatDate(scope.row.jieshuriqi) }}
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
            <el-button type="primary" @click="operate(scope.row.id, 1)" v-if="scope.row.zhuangtai === 1"
              >禁用</el-button
            >
            <el-button type="primary" @click="operate(scope.row.id, 2)" v-if="scope.row.zhuangtai === 2"
              >解禁</el-button
            >
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

  <el-dialog v-model="createCodePopupShow" title="生成邀请码" width="50%">
    <div class="popup-item">
      <div class="item-label">生成数量</div>
      <div class="item-value">
        <el-input v-model="operateData.shengchengshuliang" placeholder="请输入生成数量" />
      </div>
    </div>
    <div class="popup-item">
      <div class="item-label">使用次数</div>
      <div class="item-value">
        <el-radio-group v-model="operateData.shiyongcishu">
          <el-radio :label="1">通过</el-radio>
          <el-radio :label="2">
            限制使用<el-input style="width: 50px; margin: 0 10px" v-model="operateData.shiyongcishuxianzhi" />次
          </el-radio>
        </el-radio-group>
      </div>
    </div>
    <div class="popup-item">
      <div class="item-label">有效期</div>
      <div class="item-value">
        <el-radio-group v-model="operateData.youxiaoqi">
          <el-radio :label="1">永久</el-radio>
          <el-radio :label="2">
            期限
            <el-date-picker
              style="width: 300px; margin-left: 10px"
              v-model="operateData.youxiaoqixianzhi"
              type="daterange"
              unlink-panels
              range-separator="-"
              format="YYYY/MM/DD"
              start-placeholder="起始日期"
              end-placeholder="截止日期"
              :shortcuts="shortcuts"
            />
          </el-radio>
        </el-radio-group>
      </div>
    </div>
    <div class="popup-item">
      <div class="item-label">备注（选填）</div>
      <div class="item-value">
        <el-input
          v-model="operateData.remark"
          :autosize="{ minRows: 2, maxRows: 4 }"
          type="textarea"
          placeholder="请输入备注"
        />
      </div>
    </div>
    <template #footer>
      <el-button @click="createCodePopupShow = false">取消</el-button>
      <el-button type="primary" @click="createCode()">生成</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="recordPopupShow" :title="'使用记录 > ' + recordData?.yaoqingma" width="50%">
    <div class="filter-bar">
      <form-item label="关键字搜索">
        <el-input v-model="popupSearchData.keywords" placeholder="请输入使用者用户名" clearable />
      </form-item>
      <form-item>
        <el-button type="primary" @click="getRecordData(recordData?.yaoqingma)">搜索</el-button>
      </form-item>
    </div>

    <el-table :data="recordData?.recordList" stripe border>
      <el-table-column label="序号" type="index" width="80" />
      <el-table-column property="shiyongzhe" label="使用者(用户名)" show-overflow-tooltip />
      <el-table-column property="IP" label="IP地址" show-overflow-tooltip />
      <el-table-column label="使用时间">
        <template #default="scope">{{ formatDate(scope.row.shiyongshijian) }}</template>
      </el-table-column>
    </el-table>
    <div class="pagination-box">
      <el-pagination
        layout="total, prev, pager, next, jumper"
        v-model:currentPage="popupSearchData.currentPage"
        :total="recordData?.recordList.length"
        @current-change="changePage($event)"
      />
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineAsyncComponent, reactive, toRefs } from "vue-demi";
import { formatDate, relativeTime } from "../../utils/common";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage, ElMessageBox } from "element-plus";
import { CopyDocument, Document } from "@element-plus/icons-vue";
import { nextTick } from "vue";

export default {
  components: {
    "list-template": defineAsyncComponent(() => import("@/components/list-template.vue")),
    "form-item": defineAsyncComponent(() => import("@/components/form-item.vue")),
    CopyDocument,
    Document,
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
        currentPage: 1,
      },
      operateData: {
        shengchengshuliang: "",
        shiyongcishu: null as number | null,
        shiyongcishuxianzhi: "",
        youxiaoqi: null as number | null,
        youxiaoqiqixian: [null, null] as number[] | null[],
        remark: "",
      },
      recordData: null as any,
      popupSearchData: {
        keywords: "",
        currentPage: 1,
      },
      copyValue: "",
      createCodePopupShow: false,
      recordPopupShow: false,
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

      // 批量生成邀请码
      createInviteCode() {
        data.operateData.shengchengshuliang = "";
        data.operateData.shiyongcishu = null;
        data.operateData.shiyongcishuxianzhi = "";
        data.operateData.youxiaoqi = null;
        data.operateData.youxiaoqiqixian = [null, null];
        data.operateData.remark = "";
        data.createCodePopupShow = true;
      },

      // 生成邀请码
      createCode() {
        console.error(data.operateData);
      },

      // 查看使用记录
      viewRecord(id: string) {
        data.recordPopupShow = true;
        this.getRecordData(id);
      },

      // 获取使用记录
      getRecordData(id: string) {
        data.recordData = {
          yaoqingma: id,
          recordList: [
            { shiyongzhe: "ZhuC1", IP: "116.64.162.225", shiyongshijian: 1625656179577 },
            { shiyongzhe: "ZhuC2", IP: "116.64.162.225", shiyongshijian: 1625656179577 },
            { shiyongzhe: "ZhuC3", IP: "116.64.162.225", shiyongshijian: 1625656179577 },
            { shiyongzhe: "ZhuC4", IP: "116.64.162.225", shiyongshijian: 1625656179577 },
          ],
        };
      },

      // 操作（禁用/解禁）
      operate(id: string, type: number) {
        ElMessageBox.confirm(`确认${type === 1 ? "禁用" : "解禁"}当前条目？`, "", {
          confirmButtonText: type === 1 ? "禁用" : "解禁",
          cancelButtonText: "取消",
        }).then(() => {
          console.error(id);
        });
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

.popup-item {
  display: flex;

  & + .popup-item {
    margin-top: 20px;
  }

  .item-label {
    width: 100px;
    line-height: 32px;
  }

  .item-value {
    flex: 1;
  }
}

.filter-bar {
  display: flex;
  align-items: center;
}

.pagination-box {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>
