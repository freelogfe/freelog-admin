<!-- 主要内容区域 -->
<template>
  <div class="main-wrapper">
    <!-- <transition name="fade-transform" mode="out-in"> -->
    <router-view v-slot="{ Component }">
      <!-- <keep-alive :include="cachedViews"> <component :is="Component" :key="key" /> </keep-alive> -->
      <!-- <keep-alive> -->
      <component :is="Component" />
      <!-- </keep-alive> -->
    </router-view>
    <!-- </transition> -->
  </div>
</template>

<script lang="ts">
export default {
  // computed: {
  //   cachedViews() {
  //     return this.$store.state.tagsView.cachedViews;
  //   },
  //   key() {
  //     return this.$route.path;
  //   },
  // },
};
</script>
