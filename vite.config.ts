import vue from '@vitejs/plugin-vue'
import {resolve} from 'path'
import {defineConfig} from 'vite'
import dts from 'vite-plugin-dts'
import glsl from 'vite-plugin-glsl'

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
	return {
		plugins: [glsl(), vue(), dts({tsconfigPath: './tsconfig.build.json'})],
		publicDir: mode === 'development' ? undefined : false,
		build: {
			lib: {
				name: 'Tweeq',
				entry: resolve(__dirname, 'src/index.ts'),
				fileName: format => `index.${format}.js`,
			},
			outDir: 'lib',
			rollupOptions: {
				external: ['vue'],
				output: {
					globals: {
						vue: 'Vue',
					},
				},
			},
		},
		ssr: {
			noExternal: ['@baku89/pave'],
			external: ['paper', 'paper-jsdom-canvas'],
		},
		define: {
			// This is needed to make the PromiseQueue class available in the browser.
			'process.env.PROMISE_QUEUE_COVERAGE': false,
		},
	}
})
