import axios from 'axios'
import type {
    AxiosInstance,
    AxiosRequestConfig,
    InternalAxiosRequestConfig,
} from 'axios'
import {ElLoading} from 'element-plus'
import Message from '../utils/Message'
import VueCookies from 'vue-cookies'

/** ================= 常量 ================= */
const contentTypeForm = 'application/x-www-form-urlencoded;charset=UTF-8'
const contentTypeJson = 'application/json'
const responseTypeJson = 'json'

let loading: any = null

const instance: AxiosInstance = axios.create({
    withCredentials: true,
    baseURL: '/api',
    timeout: 10 * 1000,
})

instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig & { showLoading?: boolean }) => {
        if (config.showLoading) {
            loading = ElLoading.service({
                lock: true,
                text: '加载中......',
                background: 'rgba(0, 0, 0, 0.7)',
            })
        }
        return config
    },
    (error: any) => {
        if (error?.config?.showLoading && loading) {
            loading.close()
        }
        Message.error('请求发送失败')
        return Promise.reject('请求发送失败')
    }
)

instance.interceptors.response.use(
    (response) => {
        const {
            showLoading,
            errorCallback,
            showError = true,
            responseType,
        } = response.config as any

        if (showLoading && loading) {
            loading.close()
        }

        const responseData = response.data

        // 文件流直接返回
        if (responseType === 'arraybuffer' || responseType === 'blob') {
            return responseData
        }

        // 正常请求
        if (responseData.code === 200) {
            return responseData
        }

        // 其他错误
        if (errorCallback) {
            errorCallback(responseData)
        }
        return Promise.reject({showError, msg: responseData.info})
    },
    (error: any) => {
        if (error?.config?.showLoading && loading) {
            loading.close()
        }
        return Promise.reject({showError: true, msg: '网络异常'})
    }
)

interface RequestConfig {
    url: string
    params?: Record<string, any>
    dataType?: 'json'
    showLoading?: boolean
    responseType?: AxiosRequestConfig['responseType']
    showError?: boolean
    errorCallback?: (data: any) => void
    uploadProgressCallback?: (event: ProgressEvent) => void
}

const request = (config: RequestConfig): Promise<any | null> => {
    const {
        url,
        params = {},
        dataType,
        showLoading = false,
        responseType = responseTypeJson,
        showError = true,
    } = config

    let contentType = contentTypeForm
    const formData = new FormData()

    for (const key in params) {
        formData.append(key, params[key] ?? '')
    }

    if (dataType === 'json') {
        contentType = contentTypeJson
    }

    const token = (VueCookies as any).get('token')

    return instance
        .post(url, formData, {
            responseType,
            headers: {
                'Content-Type': contentType,
                'X-Requested-With': 'XMLHttpRequest',
                token,
            },
            showLoading,
            errorCallback: config.errorCallback,
            showError,
            onUploadProgress: config.uploadProgressCallback,
        } as any)
        .catch((error) => {
            if (error?.showError) {
                Message.error(error.msg)
            }
            return null
        })
}

export default request