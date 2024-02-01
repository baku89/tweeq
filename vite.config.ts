import vue from '@vitejs/plugin-vue'
import {resolve} from 'path'
import {fileURLToPath} from 'url'
import {defineConfig} from 'vite'
import dts from 'vite-plugin-dts'
import eslint from 'vite-plugin-eslint'
import glsl from 'vite-plugin-glsl'

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
	return {
		plugins: [
			glsl(),
			vue(),
			eslint({fix: true}),
			dts({tsconfigPath: './tsconfig.build.json'}),
		],
		resolve: {
			alias: [
				{
					find: 'tweeq',
					replacement: fileURLToPath(new URL('./src', import.meta.url)),
				},
			],
		},
		publicDir: mode === 'development' ? undefined : false,
		build: {
			target: 'esnext',
			lib: {
				entry: resolve(__dirname, 'src/index.ts'),
				name: 'Tweeq',
				fileName: format => `index.${format}.js`,
			},
			outDir: 'lib',
			rollupOptions: {
				external: ['vue', '@traptitech/markdown-it-katex', 'monaco-editor'],
			},
		},

		define: {
			// This is needed to make the PromiseQueue class available in the browser.
			'process.env.PROMISE_QUEUE_COVERAGE': false,
		},
	}
})
