import {defineClientConfig} from '@vuepress/client'
import Tq from '../../src'
import Example from './Example.vue'

import {createPinia} from 'pinia'

export default defineClientConfig({
	enhance({app}) {
		const pinia = createPinia()
		app.use(pinia as any)

		app.component('InputNumber', Tq.InputNumber)
		app.component('InputRotery', Tq.InputRotery)
		app.component('Example', Example)
	},
})
