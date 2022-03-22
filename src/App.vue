<template>
  <router-view />
</template>

<style lang='scss'>
#app {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Microsoft Yahei,
    Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans",
    "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 14px;
  color: #333;
  text-align: left;
  width: 100vh;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  background-color: #fff;
}

img {
  display: block;
}

.el-overlay {
  z-index: 1000 !important;
}

.el-table .cell {
  display: flex !important;
  align-items: center;
  line-height: 2.5 !important;
}

.selected-tip {
  font-size: 14px;
  color: #999;
  margin-right: 10px;
}

.table-cell-item {
  word-break: keep-all;
  display: flex;
  align-items: center;

  .icon-btn {
    opacity: 0;
  }

  &:hover .icon-btn {
    opacity: 1;
  }
}

.icon-btn {
  font-size: 20px !important;
  color: #169bd5 !important;
  cursor: pointer;
  transition: all 0.2s linear;

  * + & {
    margin-left: 10px;
  }

  &:hover {
    color: #005980 !important;
  }

  &:active {
    color: #00b3ff !important;
  }
}

.operation-icon {
  font-size: 20px !important;
}

.operate-btns {
  display: flex;

  button + button {
    margin-left: 10px;
  }
}

/* slide-down-scale */
.slide-down-scale-enter-active,
.slide-down-scale-leave-active {
  transition: all 0.2s ease;
}
.slide-down-scale-enter-from,
.slide-down-scale-leave-to {
  opacity: 0;
  transform: translateY(-30px) scaleY(0.8);
}
</style>
