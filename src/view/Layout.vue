<template>
  <div class="container">
    <div class="side-info" :class="{ folded }" key="side" :style="{ width: folded ? '40px' : sideWidth + 'px' }">
      <SideInfo></SideInfo>
    </div>
    <div class="resize-bar" v-if="!folded" @mousedown="startResize"></div>
    <div class="folded-btn" @click="changeFolded">
      <span class="iconfont" :class="folded ? 'icon-right' : 'icon-left'"></span>
    </div>
    <div class="editor-container">
        <router-view></router-view>
    </div>
  </div>
</template>
<script setup>
import SideInfo from './SideInfo.vue';
import { ref, reactive, getCurrentInstance, nextTick, onMounted, onUnmounted,watch } from "vue"
import { emitter } from '../event-bus'
const { proxy } = getCurrentInstance();
import { useRoute, useRouter } from "vue-router";
const route = useRoute();
const router = useRouter();

const folded = ref(false);
const changeFolded = () => {
    folded.value = !folded.value;
}

const sideWidth = ref(240)
const resizing = ref(false)

const startResize = () => {
  if (folded.value) return
  resizing.value = true
}

const handleMouseMove = (e) => {
  if (!resizing.value) return

  const newWidth = e.clientX

  if (newWidth > 120 && newWidth < 500) {
    sideWidth.value = newWidth
  }
}

const stopResize = () => {
  resizing.value = false
}

watch(sideWidth,(val)=>{
  localStorage.setItem("sideWidth",val)
})

onMounted(() => {
  const saved = localStorage.getItem("sideWidth")
  if(saved){
    sideWidth.value = Number(saved)
  }
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', stopResize)
  emitter.on('change-folded', changeFolded);
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', stopResize)
  emitter.off('change-folded', changeFolded);
})
</script>

<style scoped>
.container{
  width: 100%;
  height: 100vh;
  display: flex;
  background-color: #fff;
  position: relative;
}

.folded-btn {
  position: absolute;
  left: 10px;
  top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 10;
  color: #6c6b6b;
}
.icon-left{
  font-size: 20px;
}
.icon-right{
  font-size: 20px;
}
.side-info{
  width: 240px;
  min-width: 40px;
  min-height: 0px;
  height: 100%;
  max-height: 100%;
  overflow-y: auto;
  border-radius: 5px 0 0 5px;
  transition: transform 0.3s ease;
  overflow: hidden;
}

.side-info.folded {
  width: 40px;
  transform: translateX(-100%);
}

.editor-container{
  display: flex;
  flex: 1; 
  min-height: 0px;
  overflow-y: auto;
}

.resize-bar{
  width: 4px;
  cursor: col-resize;
  background-color: transparent;
  position: relative;
}

.resize-bar:hover{
  background-color: #d0d0d0;
}

/* 左右滑动动画 */
.side-slide-enter-active,
.side-slide-leave-active {
  transition: transform 0.3s ease;
}
.side-slide-enter-from,
.side-slide-leave-to {
  transform: translateX(-100%);
}
.side-slide-enter-to,
.side-slide-leave-from {
  transform: translateX(0);
}
</style>
