<template>
    <div class="side-container">
        <div class="title">
            <div class="group-name-wrapper">
                <el-input
                    style="width: 70%;"
                    maxlength="20"
                    v-if="editGroupName"
                    v-model="editedName"
                    @keyup.enter="saveGroupName()"
                    @blur="cancelEditGroupName()"
                    v-autofocus
                    />
                <div v-else>
                    <span>{{ groupStore.groupName }}</span>
                    <span class="iconfont icon-edit" v-if="!isLocked" @click="startEditGroupName()"></span>
                        <el-popconfirm title="确认删除吗?" v-if="!isLocked" confirm-button-text="确认" cancel-button-text="取消" @confirm="deleteGroup()">
                            <template #reference>
                                <span class="iconfont icon-delete" style="cursor: pointer; margin-left: 5px;"></span>
                            </template>
                        </el-popconfirm>
                    <span class="iconfont" :class="groupStore.isLocked ? 'icon-lock' : 'icon-unlock'" style="margin-left: 6px;cursor: pointer;" @click="changeLock()"></span>
                </div>
            </div>
        </div>
        <div class="side-content">
            <template v-for="item in history" :key="item.id">
                <div :class="['side-item' ,{'active':item.id==$route.params.id}]" @click="navJump(item.id)">
                    <div class="item-title-wrapper">
                        <el-input
                        maxlength="20"
                        v-if="item.editing"
                        v-model="item.tempTitle"
                        @keyup.enter="saveTitle(item)"
                        @blur="cancelEdit(item)"
                        @click.stop
                        v-autofocus
                        />
                        <div v-else>
                            <span class="item-title">
                            {{ item.title }}
                            </span>
                            <span class="iconfont icon-edit" @click.stop="startEdit(item)" v-if="!isLocked"></span>
                                <el-popconfirm title="确认删除吗?" v-if="!isLocked" confirm-button-text="确认" cancel-button-text="取消" @confirm="deleteHTML(item)">
                                    <template #reference>
                                        <span class="iconfont icon-delete" @click.stop></span>
                                    </template>
                                </el-popconfirm>
                            <span v-if="editorStore.hasUnsaved(item.id)" class="unsaved">未保存</span>
                        </div>
                    </div>
                    <div class="last-edit-time">
                        最近编辑时间：{{ formatLocalTime(item.lastEditTime) }}
                    </div>
                </div>
            </template>
        </div>
    </div>
    <el-dialog v-model="dialogVisible" :title="'请输入 ' + groupStore.groupName + ' 的密码'" width="380">
        <el-input
            v-model="password"
            type="password"
            placeholder="请输入密码"
            show-password
            maxlength="20"
            minlength="8"
            @keyup.enter="verifyPassword"
        />
        <template #footer>
        <div class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="verifyPassword()">
                    确认
            </el-button>
        </div>
        </template>
    </el-dialog>
    <el-dialog v-model="dialogVisibleLock" :title="'请设置 ' + groupStore.groupName + ' 的密码'" width="380">
        <el-form :model="{ passwordSetted }" :rules="rules" ref="formRef">
        <el-form-item prop="passwordSetted">
            <el-input
                v-model="passwordSetted"
                type="password"
                placeholder="请输入密码"
                show-password
                maxlength="20"
                minlength="8"
                @keyup.enter="submitLock"
            />
        </el-form-item>
        <el-form-item>
            <el-input 
                v-model="confirmPassword" 
                type="password"
                placeholder="请确认密码"
                show-password
                maxlength="20"
                minlength="8"
                ></el-input>
        </el-form-item>
        </el-form>
        <template #footer>
        <div class="dialog-footer">
            <el-button @click="dialogVisibleLock = false">取消</el-button>
            <el-button type="primary" @click="submitLock()">
                确认
            </el-button>
        </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick, onMounted, watch, provide, onBeforeUnmount, computed } from "vue"
import { emitter } from '../event-bus'
import { useRoute, useRouter } from "vue-router";
import { useEditorStore } from '../stores/editorStore';
import { useGroupStore } from '../stores/groupStore';
import { md5 } from "js-md5";

const editorStore = useEditorStore();
const groupStore = useGroupStore();
const { proxy } = getCurrentInstance();
const history = ref([]);
const route = useRoute();
const router = useRouter();

const currentGroupId = computed(() => route.params.groupId || '325799xlpj');
const getHistory = async() => {
    let result = await proxy.Request({
       url:proxy.Api.getHistory,
       params:{
        groupId:currentGroupId.value
       }
    })
    if(!result){
      return;
    }
    history.value = result.data;
    groupStore.setFiles(result.data);
    const currentId = route.params.id;
    if (!currentId && history.value.length) {
        router.replace({
        name: 'editor',
        params: {
            groupId: currentGroupId.value,
            id: history.value[0].id
        }
        })
    }
}

emitter.on('refresh-list', getHistory)

const startEdit = (item) => {
    item.tempTitle = item.title;
    item.editing = true;
}

const formatLocalTime = (utcString) => {
  if (!utcString) return ''
  const date = new Date(utcString)
  return date.toLocaleString('zh-CN', { 
    hour12: false 
  })
}

const saveTitle = async (item) => {
    let result = await proxy.Request({
       url:proxy.Api.editTitle,
       params:{
           id: item.id,
           title: item.tempTitle
       }
    })
    if(!result){
      return;
    }
    proxy.message.success('修改成功');
    item.editing = false;
    item.title = item.tempTitle;
}

const cancelEdit = (item) => {
    item.editing = false;
}

const editGroupName = ref(false);
const editedName = ref('');
const startEditGroupName = () => {
    editedName.value = groupStore.groupName;
    editGroupName.value = true;
}

const saveGroupName = async () => {
    let result = await proxy.Request({
       url:proxy.Api.editGroupName,
       params:{
           groupId: currentGroupId.value,
           groupName: editedName.value
       }
    })
    if(!result){
      return;
    }
    emitter.emit('refresh-group-list');
    editGroupName.value = false;
    groupStore.setGroupName(editedName.value);
    proxy.message.success('修改成功');
}

const cancelEditGroupName = () => {
    editGroupName.value = false;
}

const deleteHTML = async (item) => {
    let result = await proxy.Request({
       url:proxy.Api.delete,
       params:{
        id: item.id
       }
    })
    if(!result){
      return;
    }
    proxy.message.success('删除成功');
    emitter.emit('refresh-list');
}

const navJump = (id) => {
    router.push({ name: 'editor', params: { groupId: currentGroupId.value, id: id } });
}

const dialogVisible = ref(false);
const dialogVisibleLock = ref(false);
const changeLock = () => {
    if(groupStore.isLocked){
        dialogVisible.value = true;
        password.value = '';
    }else{
        dialogVisibleLock.value = true;
        passwordSetted.value = '';
        confirmPassword.value = '';
    }
}
const password = ref('');
const passwordSetted = ref('');
const confirmPassword = ref('');
const formRef = ref(null);
const submitLock = async() => {
    formRef.value.validate(async(valid) => {
        if (!valid) { return; }
        if (passwordSetted.value !== confirmPassword.value) {
            proxy.message.error('两次输入的密码不一致');
            return;
        }
        let result = await proxy.Request({
            url:proxy.Api.setPassword,
            params:{
                groupId: currentGroupId.value,
                password: md5(passwordSetted.value)
            }
        })
        if(!result){
            return;
        }
        proxy.message.success('设置成功，已锁定');
        groupStore.setIsLocked(1);
        dialogVisibleLock.value = false;
    })
}
const verifyPassword = async() => {
    let result = await proxy.Request({
       url:proxy.Api.verifyPassword,
       params:{
           groupId: currentGroupId.value,
            password: md5(password.value)
       }
    })
    if(!result){
      return;
    }
    proxy.message.success('验证成功，已解锁');
    groupStore.setIsLocked(0);
    dialogVisible.value = false;
}

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

const deleteGroup = async() => {
    let result = await proxy.Request({
       url:proxy.Api.delGroup,
       params:{
           groupId: currentGroupId.value
       }
    })
    if(!result){
      return;
    }
    proxy.message.success('删除组群成功');
    await selectGroupId('325799xlpj');
    emitter.emit('refresh-group-list')
    router.push("/editor/325799xlpj/welcome520");
}

const rules = {
    passwordSetted: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 20, message: '密码长度必须在8-20之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' }
    ]
}
const isLocked = computed(() => groupStore.isLocked === 1)

onMounted(() => {
    getHistory();
})
watch(
  () => route.params.groupId,
  () => {
    getHistory()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
    emitter.off('refresh-list', getHistory);
})
</script>

<style scoped>
.title{
    padding: 15px 10px;
    text-align: center;
    font-size: 22px;
    color: #363636;
    border-bottom: #363636 solid 1px;
    user-select: none;
}
.side-item{
    padding: 13px;
    cursor: pointer;
    color: #444343;
    border-bottom: #807f7f solid 1px;
}
.side-content{
    min-height: 0;
    max-height: 90vh;
    overflow-y: auto;
}
.active{
    background-color: #a9a8a8;
}
.item-title{
    display: inline-block;
    padding: 3px;
    font-size: 17px;
}
.icon-edit{
    cursor: pointer;
    margin-left: 5px;
}
.icon-delete{
    margin-left: 5px;
}
.last-edit-time{
    padding: 3px;
    font-size: 12px;
}
.side-item:hover{
    background-color: #9a9898;
}
.unsaved{
    padding: 1px;
    font-size: 10px;
    margin-left: 5px;
    margin-bottom: 1px;
    border: #363636 solid 1px;
    border-radius: 5px;
}

</style>
