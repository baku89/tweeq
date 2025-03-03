import {defineClientConfig} from '@vuepress/client'
import {createPinia} from 'pinia'

import * as Tq from '../../src'
import InputExample from './InputExample.vue'
import Sandbox from './Sandbox.vue'
export default defineClientConfig({
	enhance({app}) {
		const pinia = createPinia()
		app.use(pinia)

		app.component('InputNumber', Tq.InputNumber)
		app.component('InputRotery', Tq.InputRotery)
		app.component('InputColor', Tq.InputColor)
		app.component('InputComplex', Tq.InputComplex)
		app.component('MultiSelectPopup', Tq.MultiSelectPopup)
		app.component('InputExample', InputExample)
		app.component('Sandbox', Sandbox)
	},
})
