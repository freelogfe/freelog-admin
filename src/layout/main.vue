<!-- 主要内容区域 -->
<template>
  <div class="main-wrapper">
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>
  </div>
</template>
