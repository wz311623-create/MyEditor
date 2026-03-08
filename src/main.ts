import { createApp,nextTick } from 'vue'
import App from './App.vue'
import './style.css'
import './assets/iconfont/iconfont.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import { Api } from './utils/Api'
import Request from './utils/Request'
import message from './utils/Message'
import { createPinia } from 'pinia'
import VueCookies from 'vue-cookies'

const app = createApp(App)

app.directive('autofocus', {
  mounted(el) {
    nextTick(() => {
      const inputEl = el.querySelector('input')
      inputEl?.focus()
      inputEl?.select()
    })
  }
})

// 全局挂载
app.config.globalProperties.Api = Api
app.config.globalProperties.Request = Request
app.config.globalProperties.message = message
// 注册插件
app.use(ElementPlus)
app.use(router)
const pinia = createPinia()
app.use(pinia)
app.use(VueCookies)

app.mount('#app')