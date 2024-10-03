import {defineClientConfig} from '@vuepress/client'
import {createPinia} from 'pinia'

import * as Tq from '../../src'
import Example from './Example.vue'

export default defineClientConfig({
	enhance({app}) {
		const pinia = createPinia()
		app.use(pinia as any)

		app.component('InputNumber', Tq.InputNumber)
		app.component('InputRotery', Tq.InputRotery)
		app.component('InputComplex', Tq.InputComplex)
		app.component('Example', Example)
	},
})
