<!-- 编辑页模板 -->
<template>
  <div class="edit-template-wrapper">
    <div class="header-bar">
      <!-- 头部左侧 -->
      <div>
        <span class="title"><slot name="title" /></span>

        <span class="status"><slot name="status" /></span>
      </div>

      <!-- 头部右侧 -->
      <div>
        <slot name="barRight" />
      </div>
    </div>

    <div class="body-wrapper">
      <!-- 主体内容区域 -->
      <slot name="main" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.edit-template-wrapper {
  width: 100%;
  height: 100%;
  padding: 0 30px 30px;
  box-sizing: border-box;
  overflow-y: auto;

  .header-bar {
    width: 100%;
    padding: 15px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .title {
      font-size: 20px;
      font-weight: bold;
    }

    .status {
      color: #999;
      margin-left: 20px;
    }
  }

  .body-wrapper {
    width: 100%;
    padding: 20px;
    box-sizing: border-box;
    background-color: #fff;
    border-radius: 6px;
    box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.1);
  }
}
</style>
