<!-- 运营分类排序 -->
<template>
  <list-template>
    <template v-slot:barLeft>
      <el-button type="primary" @click="toggleExpand(1)">全部展开</el-button>
      <el-button type="primary" @click="toggleExpand(2)">全部折叠</el-button>
    </template>

    <template v-slot:filterBar>
      <div class="filter-controls">
        <form-item label="关键字搜索">
          <el-input v-model="name" placeholder="请输入类型编号、名称" clearable @keyup.enter="getData()" />
        </form-item>
      </div>
      <div class="filter-btns">
        <el-button type="primary" @click="getData()">搜索</el-button>
        <el-button @click="clearSearch()">重置</el-button>
      </div>
    </template>

    <template v-slot:table>
      <el-table :data="tableData" row-key="code" stripe v-loading="loading" :expand-row-keys="expandKeys">
        <el-table-column label="运营分类" min-width="200">
          <template #default="scope">{{ scope.row.name || "-" }}</template>
        </el-table-column>
        <el-table-column label="关联资源数量" min-width="200">
          <template #default="scope">{{ scope.row.resourceCount || "-" }}</template>
        </el-table-column>
        <el-table-column label="展示排序" min-width="200" fixed="right">
          <template #default="scope">
            <div class="sort-label">
              <div class="parent-priority" v-if="scope.row.priorityArr">{{ scope.row.priorityArr.join(" - ") }}</div>
              <el-input-number
                style="width: 70px"
                v-model="scope.row.priority"
                :min="1"
                :controls="false"
                @blur="changePriority(scope.row)"
              />
            </div>
          </template>
        </el-table-column>
      </el-table>
    </template>
  </list-template>
</template>

<script lang="ts">
import { ActivitiesService } from "@/api/request";
import { reactive, toRefs } from "vue";
import { Classification } from "@/typings/object";

/** 运营分类 */
interface MyClassification extends Classification {
  priorityArr: number[];
  children: MyClassification[];
}

export default {
  setup() {
    const data = reactive({
      loading: false,
      tableData: [] as MyClassification[],
      name: "",
      expandKeys: [] as string[],
    });

    const methods = {
      /** 获取列表数据 */
      async getData() {
        data.tableData = [];
        data.loading = true;
        const result = await ActivitiesService.getClassificationGroupList(data.name);
        const { errcode } = result.data;
        if (errcode === 0) {
          dealAllPriority(result.data.data);
          data.tableData = result.data.data;
          data.loading = false;
        }
      },

      /** 重置 */
      clearSearch() {
        data.name = "";
        this.getData();
      },

      /** 修改展示排序 */
      async changePriority(item: MyClassification) {
        const { code, priority } = item;

        const result = await ActivitiesService.editClassificationSort({ code, priority });
        if (result.data.errcode === 0) {
          this.getData();
        }
      },

      /** 切换展开/折叠状态 */
      toggleExpand(type: 1 | 2) {
        if (type === 1) {
          const expandKeys = dealAllCode();
          data.expandKeys = expandKeys;
        } else if (type === 2) {
          data.expandKeys = [];
        }
      },
    };

    /** 整理类型父类编号数组 */
    const dealAllPriority = (list: MyClassification[]) => {
      list.forEach((item) => {
        const { priorityArr = [] } = item;
        item.children.forEach((son: MyClassification) => {
          son.priorityArr = [...priorityArr, item.priority];
        });
        dealAllPriority(item.children);
      });
    };

    /** 整理所有的类型 code，用于实现【展开所有】功能 */
    const dealAllCode = () => {
      const expandKeys: string[] = [];
      getAllSonCode(data.tableData, expandKeys);
      return expandKeys;
    };

    /** 获取所有子类型的 code */
    const getAllSonCode = (list: MyClassification[], expandKeys: string[]) => {
      list.forEach((item) => {
        expandKeys.push(item.code);
        if (item.children) {
          getAllSonCode(item.children, expandKeys);
        }
      });
    };

    methods.getData();

    return {
      ...toRefs(data),
      ...methods,
    };
  },
};
</script>

<style lang="scss" scoped>
.sort-label {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  .parent-priority {
    color: #999;
    margin-right: 10px;

    &::after {
      content: " -";
    }
  }
}
</style>
