import vue from '@vitejs/plugin-vue'
import path from 'path'
import {fileURLToPath} from 'url'
import {defineConfig} from 'vite'
import eslint from 'vite-plugin-eslint'

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
	return {
		plugins: [vue(), eslint()],
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
				entry: path.resolve(__dirname, 'src/index.ts'),
				name: 'Glisp UI',
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
	}
})
