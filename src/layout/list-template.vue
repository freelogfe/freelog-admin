<!-- 列表页模板 -->
<template>
  <div id="listTemplate" class="list-template-wrapper">
    <slot name="top" />

    <div class="header-bar">
      <!-- 头部左侧 -->
      <div>
        <slot name="barLeft" />
      </div>

      <!-- 头部右侧 -->
      <div>
        <slot name="barRight" />
      </div>
    </div>

    <div class="body-wrapper">
      <div class="filter-bar">
        <!-- 列表筛选栏 -->
        <slot name="filterBar" />
      </div>

      <div class="table">
        <!-- 列表 -->
        <slot name="table" />
      </div>

      <div class="pagination">
        <!-- 分页器 -->
        <slot name="pagination" />
      </div>
    </div>

    <div class="hidden-wrapper">
      <slot name="hidden" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.list-template-wrapper {
  width: 100%;
  height: 100%;
  padding: 0 30px 30px;
  box-sizing: border-box;
  overflow-y: auto;

  .header-bar {
    padding: 15px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .body-wrapper {
    width: 100%;
    padding: 20px;
    box-sizing: border-box;
    background-color: #fff;
    border-radius: 6px;
    box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.1);

    .filter-bar {
      display: flex;

      :deep .filter-controls {
        flex: 1;
        display: flex;
        flex-wrap: wrap;
      }

      :deep .filter-btns {
        margin-top: 10px;
      }
    }

    .table {
      width: 100%;
      margin-top: 20px;

      :deep .el-table-fixed-column--right {
        z-index: 1;
      }
    }

    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .hidden-wrapper {
    position: absolute;
    top: 0;
    left: 100%;
  }
}
</style>
