<!-- 表单项 -->
<template>
  <div class="form-item-wrapper">
    <div class="filter-label" v-if="label">{{ label }}</div>
    <div class="filter-value"><slot /></div>
  </div>
</template>

<script lang="ts">
export default {
  props: {
    label: {
      type: String,
    },
  },
};
</script>

<style lang="scss" scoped>
.form-item-wrapper {
  display: flex;
  margin-right: 20px;
  padding: 10px 0;

  .filter-label {
    font-size: 14px;
    color: #333;
    line-height: 32px;

    &::after {
      content: "：";
    }
  }

  .filter-value {
    margin-left: 5px;
    flex: 1;
  }
}
</style>
