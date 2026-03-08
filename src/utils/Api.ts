export const Api = {
    getHistory: "/editor/getHistoryInfo",
    save: "/editor/save",
    getContent:"/editor/getContent",
    editTitle:"/editor/editTitle",
    delete:"/editor/delete",
    createNewFile:"/editor/createNewFile",
    checkCode:"/account/checkCode",
    login:"/account/login",
    logout:"/account/logout",
    addGroup:"/documentGroup/addGroup",
    getGroupList:"/documentGroup/getGroupList",
    getGroupBygroupId:"/documentGroup/getGroupBygroupId",
    editGroupName:"/documentGroup/editGroupName",
    setPassword:"/documentGroup/setPassword",
    verifyPassword:"/documentGroup/verifyPassword",
    delGroup:"/documentGroup/delGroup"
} as const