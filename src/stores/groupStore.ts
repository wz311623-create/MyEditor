import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGroupStore = defineStore('groupStore',() => {

    const groupName = ref('未命名组群');

    const setGroupName = (name: string) => {
        groupName.value = name;
    }

    const htmlNum = ref(0);

    const setHtmlNum = (num: number) => {
        htmlNum.value = num;
    }

    const isLocked = ref(0);

    const setIsLocked = (locked: number) => {
        isLocked.value = locked;
    }

    const createTime = ref('');

    const setCreateTime = (time: string) => {
        createTime.value = time;
    }

    const files = ref([]);

    const setFiles = (newFiles: any) => {
        files.value = newFiles;
    }

    const setStore = (result: any) => {
        groupName.value = result.groupName;
        isLocked.value = result.isLocked;
        createTime.value = result.createTime;
        htmlNum.value = result.htmlNum;
    }

    return {
        groupName,
        setGroupName,
        files,
        setFiles,
        htmlNum,
        setHtmlNum,
        isLocked,
        setIsLocked,
        createTime,
        setCreateTime,
        setStore
    }
    
})
