import {ElMessage} from 'element-plus'
import type {MessageType} from 'element-plus'

type Callback = () => void

const showMessage = (
    msg: string,
    callback?: Callback,
    type: MessageType = 'info'
): void => {
    ElMessage({
        type,
        message: msg,
        duration: 2000,
        offset: 200,
        onClose: () => {
            callback?.()
        },
    })
}

const message = {
    error(msg: string, callback?: Callback): void {
        showMessage(msg, callback, 'error')
    },
    success(msg: string, callback?: Callback): void {
        showMessage(msg, callback, 'success')
    },
    warning(msg: string, callback?: Callback): void {
        showMessage(msg, callback, 'warning')
    },
    info(msg: string, callback?: Callback): void {
        showMessage(msg, callback, 'info')
    },
}

export default message