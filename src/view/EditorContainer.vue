<template>
  <div :class="['editor', nightMode ? 'night-mode' : '']">
    <div class="top-bar">
      <Toolbar
        :mode="mode"
        style="border-bottom: 1px solid #ccc;"
        :editor="editorRef"
        :defaultConfig="toolbarConfig"
      />
    </div>
    <Editor
      style="overflow-y: hidden;"
      v-model="currentHtml"
      :defaultConfig="editorConfig"
      @onCreated="handleCreated"
    />
  </div>
  <div class="right-info">
    <el-tooltip v-if="!isLocked" content="保存 Ctrl+S" placement="left">
      <span class="iconfont icon-save" @click="save()"></span>
    </el-tooltip>
    <el-tooltip content="下载为 HTML 文件" placement="left">
      <span class="iconfont icon-download" @click="download()"></span>
    </el-tooltip>
    <el-popconfirm v-if="!isLocked" title="将覆盖此文档，确认打开吗?" confirm-button-text="确认" cancel-button-text="取消" @confirm="selectFile()">
      <template #reference>
        <el-tooltip content="在当前文档打开本地 HTML 文件" placement="left">
          <span class="iconfont icon-file"></span>
        </el-tooltip>
      </template>
    </el-popconfirm>
    <el-tooltip v-if="!isLocked" content="新建文档" placement="left">
      <span class="iconfont icon-new" @click="createNewFile()"></span>
    </el-tooltip>
    <el-tooltip :content="nightMode ? '日间模式' : '夜间模式'" placement="left">
      <span
        class="iconfont"
        :class="nightMode ? 'icon-day' : 'icon-night'"
        @click="toggleTheme"
      ></span>
    </el-tooltip>
    <el-tooltip :content="mode == 'default' ? '精简模式' : '默认模式'" placement="left">
      <span 
        class="iconfont" :class="mode == 'default' ? 'icon-simple' : 'icon-default'"
        @click="toggleMode"
      ></span>
    </el-tooltip>
    <el-tooltip content="新建文件组群" placement="left">
      <span class="iconfont icon-add" @click="createNewGroup()"></span>
    </el-tooltip>
    <template v-for="item in fileGroup" :key="item.groupId">
      <el-tooltip :content="'文件组群：' + item.groupName" placement="left">
        <span class="iconfont icon-group" @click="selectGroup(item.groupId)"></span>
      </el-tooltip>
    </template>
  </div>
<input
  ref="fileInputRef"
  type="file"
  accept=".html,text/html"
  style="display: none"
  @change="handleFileChange"
/>
</template>
<script>
import '@wangeditor/editor/dist/css/style.css'
import { ref, reactive, getCurrentInstance, nextTick, onBeforeUnmount , shallowRef, onMounted, watch, inject,computed, onUnmounted } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { useRoute, useRouter } from "vue-router";
import { emitter } from '../event-bus'
import { useEditorStore } from '../stores/editorStore';
import { el } from 'element-plus/es/locales.mjs';
import { useGroupStore } from '../stores/groupStore';

export default {
  components: { Editor, Toolbar },
  setup() {
    const { proxy } = getCurrentInstance();
    const route = useRoute();
    const router = useRouter();
    const editorStore = useEditorStore();
    const groupStore = useGroupStore();

    // 编辑器实例，必须用 shallowRef
    const editorRef = shallowRef()

    // 内容 HTML
    const valueHtml = reactive({})

    const currentId = ref(route.params.id);

    const title = ref('未命名文档')

    let isInit = true
    const isProgrammaticUpdate = ref(false)
    
    const currentHtml = computed({
      get() {
        return valueHtml[currentId.value] || ''
      },
      set(val) {
        valueHtml[currentId.value] = val
      }
    })

    const fetchContent = async (id) => {
      isProgrammaticUpdate.value = true
      if (editorStore.hasUnsaved(id)) {
        valueHtml[id] = editorStore.unsavedCache[id];
      }else{
        let result = await proxy.Request({
          url: proxy.Api.getContent,
          params: { id }
        })
        if (result) valueHtml[id] = result.data        
      }
      nextTick(() => {
        isProgrammaticUpdate.value = false
        isInit = false
      })
    }

    watch(currentHtml, (newVal) => {
      if (isInit) return
      if (isProgrammaticUpdate.value) return

      editorStore.setUnsaved(currentId.value, newVal)
    })

    const handleKeydown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        save()
      }
    }

    const toolbarConfig = {}

    const editorConfig = { placeholder: '请输入内容...' }
    const handleCreated = (editor) => {
      editorRef.value = editor // 记录 editor 实例，重要！
      if (groupStore.isLocked === 1) {
        editor.disable()
      }
    }

    const save = async () => {
      const result = await proxy.Request({
        url: proxy.Api.save,
        params: {
          id: currentId.value,
          content: currentHtml.value
        }
      })
      if (!result) return

      proxy.message.success('保存成功')
      editorStore.clearUnsaved(currentId.value)
      emitter.emit('refresh-list')
    }

    const download = () => {
      const blob = new Blob([valueHtml[currentId.value]], {
        type: 'text/html;charset=utf-8',
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'editor-' + new Date().getTime() + '.html'
      a.click()

      URL.revokeObjectURL(url)
    }

    const createNewFile = async() => {
      let result = await proxy.Request({
         url:proxy.Api.createNewFile,
         params:{
          groupId:currentGroupId.value
         }
      })
      if(!result){
        return;
      }
      router.push({name: 'editor', params: { groupId: currentGroupId.value, id: result.data }})
      emitter.emit('refresh-list')
    }

    const fileInputRef = ref(null)
    // 选择文件
    const selectFile = () => {
      fileInputRef.value.click()
    }

    // 读取文件
    const handleFileChange = (e) => {
      const file = e.target.files[0]
      if (!file) return

      // 校验类型
      if (!file.name.endsWith('.html')) {
        proxy.message.error('请选择 HTML 文件')
        e.target.value = ''
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        valueHtml[currentId.value] = reader.result
      }
      reader.readAsText(file, 'utf-8')

      // 允许重复选择同一个文件
      e.target.value = ''
    }

    const nightMode = ref(localStorage.getItem('theme') === 'dark')
    const toggleTheme = () => {
      nightMode.value = !nightMode.value
    }

    //切换模式 TODO
    const mode = ref('default')

    const toggleMode = () => {
      mode.value = mode.value === 'default' ? 'simple' : 'default'
    }

    const currentGroupId = computed(() => route.params.groupId);

    //右侧新建文件组群
    const createNewGroup = async () => {
      let result = await proxy.Request({
         url:proxy.Api.addGroup,
         params:{
         }
      })
      if(!result){
        return;
      }
      await selectGroup(result.data);
      getGroupList();
      proxy.message.success('新建文件组群成功');
    }

    //右侧Group列表
    const fileGroup = ref([]);
    
    const getGroupList = async() => {
      let result = await proxy.Request({
         url:proxy.Api.getGroupList,
         params:{
         }
      })
      if(!result){
        return;
      }
      fileGroup.value = result.data
    }
    getGroupList();
    
    //选择文件组群
    const selectGroupId = async(groupId) => {
      let result = await proxy.Request({
         url:proxy.Api.getGroupBygroupId,
         params:{
          groupId:groupId
         }
      })
      if(!result){
        return;
      }
      groupStore.setStore(result.data);
    }

    //选择文件组群路由跳转
    const selectGroup = async(groupId) => {
      await selectGroupId(groupId)
      const result = await proxy.Request({
        url: proxy.Api.getHistory,
        params: { groupId }
      })

      if (!result || !result.data.length) return

      const firstId = result.data[0].id

      groupStore.setFiles(result.data)
      router.push({name: 'editor', params: { groupId: groupId, id:firstId }})
    }

    onMounted(() => {
      selectGroupId(currentGroupId.value);
      fetchContent(currentId.value)
      // 监听 Ctrl+S 保存
      window.addEventListener('keydown', handleKeydown)
      emitter.on('refresh-group-list', getGroupList)
    })

    watch(
      () => route.params,
      async (params) => {

        const newGroupId = params.groupId
        const newId = params.id

        if (newGroupId !== currentGroupId.value) {
          await selectGroupId(newGroupId)
        }

        if (newId !== currentId.value) {
          currentId.value = newId
          isInit = true
          await fetchContent(newId)
        }

      }
    )
    const isLocked = computed(() => groupStore.isLocked === 1)

    watch(isLocked, (val) => {
      if (!editorRef.value) return
      if (val) {
        editorRef.value.disable()
      } else {
        editorRef.value.enable()
      }
    })

    watch(nightMode, val => {
      localStorage.setItem('theme', val ? 'dark' : 'light')
    })

    // 组件销毁时，也及时销毁编辑器
    onBeforeUnmount(() => {
      const editor = editorRef.value
      if (editor == null) return
      editor.destroy()
      window.removeEventListener('keydown', handleKeydown)
      emitter.off('refresh-group-list', getGroupList)
    })

    return {
      editorRef,
      valueHtml,
      mode,
      toggleMode,
      toolbarConfig,
      editorConfig,
      handleCreated,
      save,
      download,
      createNewFile,
      selectFile,
      handleFileChange,
      fileInputRef,
      currentHtml,
      toggleTheme,
      nightMode,
      createNewGroup,
      selectGroup,
      fileGroup,
      isLocked
    }
  },
}
</script>
<style scoped>
.editor{
  border-left: #636262 solid 1.5px;
  width: calc(100% - 40px);
}
.right-info{
  position: sticky;
  border-left: #a6a5a5 solid 1px;
  display: flex;
  flex-direction: column;
  width: 40px;
  top: 0;
}
.iconfont{
  margin: 5px;
  text-align: center;
  border-radius: 5px;
  font-size: 22px;
  color: #636262;
  cursor: pointer;
}
.iconfont:hover{
  background-color: #dfdddd;
}
.top-bar{
  position: sticky;
  top: 0;
  z-index: 2000;
}
</style>
<style>
/* wangEditor 编辑区域 */
.editor.night-mode .w-e-text-container {
  background-color: #31353d;
}

/* placeholder */
.editor.night-mode .w-e-text-placeholder {
  color: #c6c4c4;
}
</style>
