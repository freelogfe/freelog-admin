<!-- 编辑资源类型 -->
<template>
  <edit-template>
    <template v-slot:title>{{ query.id ? "编辑资源类型" : "创建资源类型" }}</template>

    <template v-slot:barRight>
      <el-button type="primary" @click="save(1)">{{ query.id ? "保存" : "创建" }}</el-button>
    </template>

    <template v-slot:main>
      <form-item label="编号">
        <el-input style="width: 400px" v-model="formData.myTitle" placeholder="请输入编号" clearable />
        <span class="desc">系统自动分配</span>
      </form-item>
      <form-item label="名称">
        <el-input style="width: 400px" v-model="formData.myTitle" placeholder="请输入名称" clearable />
      </form-item>
      <form-item label="父类">
        <el-cascader-panel :options="parentList" />
      </form-item>
      <form-item label="关联文件格式（选填）">
        <el-input
          style="width: 400px"
          v-model="formData.myTitle"
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
            v-for="(item, index) in formData.testList"
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
          v-model="formData.myTitle"
          placeholder="请输入展示序号"
          controls-position="right"
        />
        <span class="desc">序号越小，展示优先级越高</span>
      </form-item>
      <form-item label="是否启用">
        <el-radio-group v-model="formData.myTitle">
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
import { ActivitiesService } from "@/api/request";
import { useMyRouter } from "@/utils/hooks";
import { ElMessage } from "element-plus";
import { formatDate } from "@/utils/common";
import { CreateOrEditActivityParams } from "@/typings/params";
import Sortable from "sortablejs";

/** 资源类型数据 */
export interface MyCreateOrEditActivity extends CreateOrEditActivityParams {
  myTitle?: string;
  myPublishDate?: string | null;
  publishType?: 1 | 2;
  testList: string[];
}

export default {
  setup() {
    const { query, switchPage } = useMyRouter();
    const asstesData = {
      parentList: [
        {
          value: "guide",
          label: "Guide",
          children: [
            {
              value: "disciplines",
              label: "Disciplines",
              children: [
                {
                  value: "consistency",
                  label: "Consistency",
                },
                {
                  value: "feedback",
                  label: "Feedback",
                },
                {
                  value: "efficiency",
                  label: "Efficiency",
                },
                {
                  value: "controllability",
                  label: "Controllability",
                },
              ],
            },
            {
              value: "navigation",
              label: "Navigation",
              children: [
                {
                  value: "side nav",
                  label: "Side Navigation",
                },
                {
                  value: "top nav",
                  label: "Top Navigation",
                },
              ],
            },
          ],
        },
        {
          value: "component",
          label: "Component",
          children: [
            {
              value: "basic",
              label: "Basic",
              children: [
                {
                  value: "layout",
                  label: "Layout",
                },
                {
                  value: "color",
                  label: "Color",
                },
                {
                  value: "typography",
                  label: "Typography",
                },
                {
                  value: "icon",
                  label: "Icon",
                },
                {
                  value: "button",
                  label: "Button",
                },
              ],
            },
            {
              value: "form",
              label: "Form",
              children: [
                {
                  value: "radio",
                  label: "Radio",
                },
                {
                  value: "checkbox",
                  label: "Checkbox",
                },
                {
                  value: "input",
                  label: "Input",
                },
                {
                  value: "input-number",
                  label: "InputNumber",
                },
                {
                  value: "select",
                  label: "Select",
                },
                {
                  value: "cascader",
                  label: "Cascader",
                },
                {
                  value: "switch",
                  label: "Switch",
                },
                {
                  value: "slider",
                  label: "Slider",
                },
                {
                  value: "time-picker",
                  label: "TimePicker",
                },
                {
                  value: "date-picker",
                  label: "DatePicker",
                },
                {
                  value: "datetime-picker",
                  label: "DateTimePicker",
                },
                {
                  value: "upload",
                  label: "Upload",
                },
                {
                  value: "rate",
                  label: "Rate",
                },
                {
                  value: "form",
                  label: "Form",
                },
              ],
            },
            {
              value: "data",
              label: "Data",
              children: [
                {
                  value: "table",
                  label: "Table",
                },
                {
                  value: "tag",
                  label: "Tag",
                },
                {
                  value: "progress",
                  label: "Progress",
                },
                {
                  value: "tree",
                  label: "Tree",
                },
                {
                  value: "pagination",
                  label: "Pagination",
                },
                {
                  value: "badge",
                  label: "Badge",
                },
              ],
            },
            {
              value: "notice",
              label: "Notice",
              children: [
                {
                  value: "alert",
                  label: "Alert",
                },
                {
                  value: "loading",
                  label: "Loading",
                },
                {
                  value: "message",
                  label: "Message",
                },
                {
                  value: "message-box",
                  label: "MessageBox",
                },
                {
                  value: "notification",
                  label: "Notification",
                },
              ],
            },
            {
              value: "navigation",
              label: "Navigation",
              children: [
                {
                  value: "menu",
                  label: "Menu",
                },
                {
                  value: "tabs",
                  label: "Tabs",
                },
                {
                  value: "breadcrumb",
                  label: "Breadcrumb",
                },
                {
                  value: "dropdown",
                  label: "Dropdown",
                },
                {
                  value: "steps",
                  label: "Steps",
                },
              ],
            },
            {
              value: "others",
              label: "Others",
              children: [
                {
                  value: "dialog",
                  label: "Dialog",
                },
                {
                  value: "tooltip",
                  label: "Tooltip",
                },
                {
                  value: "popover",
                  label: "Popover",
                },
                {
                  value: "card",
                  label: "Card",
                },
                {
                  value: "carousel",
                  label: "Carousel",
                },
                {
                  value: "collapse",
                  label: "Collapse",
                },
              ],
            },
          ],
        },
        {
          value: "resource",
          label: "Resource",
          children: [
            {
              value: "axure",
              label: "Axure Components",
            },
            {
              value: "sketch",
              label: "Sketch Templates",
            },
            {
              value: "docs",
              label: "Design Documentation",
            },
          ],
        },
      ],
    };
    const data = reactive({
      loading: false,
      formData: {} as MyCreateOrEditActivity,
    });

    const methods = {
      /** 获取资源类型数据 */
      async getData() {
        const { id } = query.value;
        if (id) {
          // 编辑
          const result = await ActivitiesService.getActivityData(id);
          const { errcode } = result.data;
          if (errcode === 0) {
            const formData: MyCreateOrEditActivity = result.data.data;
            const { title, publishDate } = formData;
            formData.myTitle = title;
            if (publishDate) {
              formData.publishType = 2;
              formData.myPublishDate = publishDate;
            }
            data.formData = { ...formData };
          }
        } else {
          // 新建
          data.formData.persist = true;
        }

        data.formData.testList = [
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
              data.formData.testList = sortable.toArray();
            },
          });
        }, 100);
      },

      /** 删除标准属性 */
      deletePropertyItem(index: number) {
        data.formData.testList.splice(index, 1);
      },

      /**
       * 保存
       * @params type 保存类型 1-保存 2-保存并发布
       */
      async save(type: 1 | 2) {
        if (type === 2 && !validate()) return;

        const { myTitle, publishType, myPublishDate } = data.formData;
        data.formData.isDraft = type === 1;
        data.formData.title = myTitle || "未命名活动";
        if (publishType === 1) {
          data.formData.publishDate = formatDate(new Date().getTime() + 1000 * 5);
        } else if (publishType === 2 && myPublishDate) {
          data.formData.publishDate = formatDate(myPublishDate);
        }
        const func = query.value.id ? "editActivity" : "createActivity";
        const result = await ActivitiesService[func](data.formData);
        const { errcode } = result.data;
        if (errcode === 0) {
          const msg = type === 1 ? "保存成功" : "保存并发布成功";
          ElMessage.success(msg);
          switchPage("/operating/activity-management");
        }
      },
    };

    /** 表单验证 */
    const validate = () => {
      const { myTitle, persist, startTime, limitTime, cover, link, publishType, myPublishDate } = data.formData;
      if (!myTitle) {
        ElMessage("请输入活动名称");
        return false;
      } else if (!persist && (!startTime || !limitTime)) {
        ElMessage("请选择活动时间");
        return false;
      } else if (!cover) {
        ElMessage("请上传活动海报");
        return false;
      } else if (!link) {
        ElMessage("请输入活动页链接");
        return false;
      } else if (!publishType || (publishType === 2 && !myPublishDate)) {
        ElMessage("请选择发布时间");
        return false;
      }
      return true;
    };

    methods.getData();

    return {
      ...asstesData,
      query,
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
