import 'tweeq/global.styl'

import {createPinia} from 'pinia'
import {createApp} from 'vue'

import Demo from './App.vue'

const pinia = createPinia()
const app = createApp(Demo)
app.use(pinia)

app.mount('#app')
