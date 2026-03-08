import { defineStore } from 'pinia'
import { reactive } from 'vue'

export interface UnsavedCache {
  [id: string]: string
}

export const useEditorStore = defineStore('editor', () => {
  const unsavedCache: UnsavedCache = reactive({})

  // 设置未保存内容
  const setUnsaved = (id: string, content: string) => {
    unsavedCache[id] = content
  }

  // 清空未保存内容
  const clearUnsaved = (id: string) => {
    delete unsavedCache[id]
  }

  // 检查某个文件是否有未保存内容
  const hasUnsaved = (id: string): boolean => {
    return !!unsavedCache[id]
  }

  return { unsavedCache, setUnsaved, clearUnsaved, hasUnsaved }
})