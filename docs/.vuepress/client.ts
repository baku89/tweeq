import {defineClientConfig} from '@vuepress/client'
import {createPinia} from 'pinia'
import {App} from 'vue'

const registerComponents = async (app: App) => {
	const Tq = await import('tweeq')
	const DemoComponent = await import('./DemoComponent.vue')
	const ExampleContainer = await import('./ExampleContainer.vue')
	const ExampleThreePointLighting = await import(
		'./ExampleThreePointLighting.vue'
	)
	const ExampleSpring = await import('./ExampleSpring.vue')
	// Tweeqコンポーネントを登録
	for (const [key, value] of Object.entries(Tq)) {
		if (typeof value === 'function') continue
		app.component(key, value)
	}

	// ドキュメント用のカスタムコンポーネントを登録
	app.component('DemoComponent', DemoComponent.default)
	app.component('ExampleContainer', ExampleContainer.default)
	app.component('ExampleThreePointLighting', ExampleThreePointLighting.default)
	app.component('ExampleSpring', ExampleSpring.default)
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
