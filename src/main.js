import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue';
// import 'ant-design-vue/dist/reset.css';

import './assets/base.css';
import './assets/main.css';


import App from './App.vue'
import router from './router'
import axiosInstance from "@/configs/axios.js";

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.use(Antd);
app.provide('axios', axiosInstance);
app.mount('#app')
