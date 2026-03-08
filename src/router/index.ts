import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path:'/',
    name:'login',
    component:() => import('../view/Login.vue')
  },
  {
    path:'/editor',
    name:'layout',
    component:() => import('../view/Layout.vue'),
    children:[
      {
        path:':groupId/:id',
        name:'editor',
        component:() => import('../view/EditorContainer.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router