<!-- 编辑资源类型 -->
<template>
  <edit-template>
    <template v-slot:title>{{ mode === "create" ? "创建资源类型" : "编辑资源类型" }}</template>

    <template v-slot:barRight>
      <el-button type="primary" @click="save()">{{ mode === "create" ? "创建" : "保存" }}</el-button>
    </template>

    <template v-slot:main>
      <form-item label="编号" v-if="mode === 'update'">
        <el-input style="width: 400px" v-model="formData.code" disabled />
        <span class="desc">系统自动分配</span>
      </form-item>
      <form-item label="名称">
        <el-input style="width: 400px" v-model="formData.name" placeholder="请输入名称" clearable />
      </form-item>
      <form-item label="父类">
        <el-cascader-panel
          v-model="formData.parentCode"
          :props="{ value: 'code', label: 'name' }"
          :options="parentList"
        />
      </form-item>
      <form-item label="关联文件格式（选填）">
        <el-input
          style="width: 400px"
          v-model="formData.formatsStr"
          placeholder="输入限制上传文件的扩展名，用英文逗号分隔"
          clearable
        />
        <span class="desc">格式“.扩展名”，用英文逗号（“,”）分隔</span>
      </form-item>
      <form-item label="标准属性（选填）">
        <div class="btn-box">
          <div class="text-btn">导入父类属性</div>
          <div class="text-btn">添加属性</div>
        </div>
        <div id="testlist" class="property-list">
          <div
            class="property-item"
            :data-id="item"
            v-for="(item, index) in formData.attrs"
            :key="item"
            @click="deletePropertyItem(index)"
          >
            {{ item }}
          </div>
        </div>
      </form-item>
      <form-item label="展示序号">
        <el-input-number
          style="width: 400px"
          v-model="formData.priority"
          placeholder="请输入展示序号"
          controls-position="right"
        />
        <span class="desc">序号越小，展示优先级越高</span>
      </form-item>
      <form-item label="是否启用">
        <el-radio-group v-model="formData.status">
          <el-radio :label="1">
            启用<span class="desc">在用户端资源类型选择器中显示，用户在创建资源是可以直接选择此资源类型</span>
          </el-radio>
          <el-radio style="margin-top: 10px" :label="2">
            停用<span class="desc">在用户端资源类型选择器中隐藏</span>
          </el-radio>
        </el-radio-group>
      </form-item>
    </template>
  </edit-template>
</template>

<script lang="ts">
import { reactive, toRefs } from "vue";
import { ResourceService } from "@/api/request";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage } from "element-plus";
import { CreateOrEditResourceTypeParams } from "@/typings/params";
import Sortable from "sortablejs";

/** 父类选项 */
interface ParentType {
  _id: string;
  code: string;
  name: string;
  children?: ParentType[];
}

/** 资源类型编辑数据 */
interface MyCreateOrEditResourceTypeParams extends CreateOrEditResourceTypeParams {
  formatsStr?: string;
}

export default {
  setup() {
    const { query, switchPage } = useMyRouter();
    const data = reactive({
      loading: false,
      mode: "create" as "create" | "update",
      formData: {} as MyCreateOrEditResourceTypeParams,
      parentList: [] as ParentType[],
    });

    const methods = {
      /** 获取资源类型数据 */
      async getData() {
        const { code } = query.value;
        if (code) {
          // 编辑
          data.mode = "update";
          const result = await ResourceService.getResourceTypeData(code);
          const { errcode } = result.data;
          if (errcode === 0) {
            data.formData = result.data.data;
          }
        } else {
          // 新建
          data.mode = "create";
        }

        data.formData.attrs = [
          "test1",
          "test2",
          "test3",
          "test4",
          "test5",
          "test6",
          "test7",
          "test8",
          "test9",
          "test10",
          "test11",
          "test12",
          "test13",
          "test14",
          "test15",
          "test16",
          "test17",
          "test18",
        ];

        setTimeout(() => {
          const sortable = new Sortable(document.getElementById("testlist"), {
            // 结束拖拽
            onEnd() {
              data.formData.attrs = sortable.toArray();
            },
          });
        }, 100);
      },

      /** 根据父类获取子类型 */
      async getTypeList() {
        const result = await ResourceService.getResourceTypeListByParentType("");
        const { errcode } = result.data;
        if (errcode === 0) {
          data.parentList = result.data.data;
        }
      },

      /** 初始化父类选项数据 */
      async initParentList() {
        const result = await ResourceService.getResourceTypeListByParentType("");
        data.parentList = result.data.data;
        this.getSonTypeList(data.parentList);
        console.error(data.parentList);
      },

      /** 根据父类获取子类 */
      async getSonTypeList(list: ParentType[]) {
        list.forEach(async (item) => {
          const sonResult = await ResourceService.getResourceTypeListByParentType(item.code);
          item.children = sonResult.data.data;
          this.getSonTypeList(sonResult.data.data);
        });
      },

      /** 删除标准属性 */
      deletePropertyItem(index: number) {
        data.formData.attrs?.splice(index, 1);
      },

      /**
       * 保存
       * @params type 保存类型 1-创建 2-保存
       */
      async save() {
        if (!validate()) return;

        if (data.formData.formatsStr) data.formData.formats = data.formData.formatsStr.split(",");
        console.error(data.formData);
        // const result = await ResourceService.createOrEditResourceType(data.formData, data.mode);
        // const { errcode } = result.data;
        // if (errcode === 0) {
        //   const msg = data.mode === "create" ? "创建成功" : "保存成功";
        //   ElMessage.success(msg);
        //   switchPage("/resource/property-management");
        // }
      },
    };

    /** 表单验证 */
    const validate = () => {
      const { name, parentCode, priority, status } = data.formData;
      if (!name) {
        ElMessage("请输入名称");
        return false;
      } else if (!parentCode) {
        ElMessage("请选择父类");
        return false;
      } else if (!priority) {
        ElMessage("请输入展示序号");
        return false;
      } else if (!status) {
        ElMessage("请选择是否启用");
        return false;
      }
      return true;
    };

    methods.getData();
    methods.initParentList();

    return {
      ...toRefs(data),
      ...methods,
    };
  },
};
</script>

<style lang="scss" scoped>
.el-radio {
  width: 100%;
}

.btn-box {
  width: 500px;
  display: flex;
  justify-content: flex-end;

  .text-btn + .text-btn {
    margin-left: 20px;
  }
}

.property-list {
  width: 500px;
  border: 1px solid #ddd;
  border-radius: 4px;
  display: flex;
  flex-wrap: wrap;
  padding: 0 10px;
  box-sizing: border-box;

  .property-item {
    padding: 0 8px;
    margin: 10px;
    border-radius: 4px;
    background: #ddd;
    cursor: default;
  }
}

.desc {
  margin-left: 20px;
  color: #bbb;
}
</style>
