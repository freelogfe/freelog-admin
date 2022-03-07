<!-- 筛选项 -->
<template>
  <div class="filter-item-wrapper">
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
.filter-item-wrapper {
  display: flex;
  align-items: center;
  margin-right: 20px;
  padding: 10px 0;

  .filter-label {
    font-size: 14px;
    color: #333;

    &::after {
      content: "：";
    }
  }

  .filter-value {
    margin-left: 5px;

    ::v-deep div,
    input {
      width: 250px;
    }
  }
}
</style>
