import {defineClientConfig} from '@vuepress/client'
import Tq from '../../src'

export default defineClientConfig({
	enhance({app}) {
		app.component('InputNumber', Tq.InputNumber)
	},
})
