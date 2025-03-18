import {defineClientConfig} from '@vuepress/client'
import {createPinia} from 'pinia'
import {App} from 'vue'

const registerComponents = async (app: App) => {
	const Tq = await import('tweeq')
	const InputExample = await import('./InputExample.vue')
	const Sandbox = await import('./Sandbox.vue')

	// Tweeqコンポーネントを登録
	app.component('InputAngle', Tq.InputAngle)
	app.component('InputColor', Tq.InputColor)
	app.component('InputDropdown', Tq.InputDropdown)
	app.component('InputButton', Tq.InputButton)
	app.component('InputNumber', Tq.InputNumber)
	app.component('InputString', Tq.InputString)
	app.component('MultiSelectPopup', Tq.MultiSelectPopup)

	// ドキュメント用のカスタムコンポーネントを登録
	app.component('InputExample', InputExample.default)
	app.component('Sandbox', Sandbox.default)
}

export default defineClientConfig({
	enhance: async ({app}) => {
		// Piniaの設定
		const pinia = createPinia()
		app.use(pinia)

		// クライアントサイドでのみコンポーネントを登録
		if (typeof window !== 'undefined') {
			// ブラウザ環境でのみ実行される
			await registerComponents(app)
		}
	},
})
