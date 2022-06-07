import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import stylusAlias from 'vite-plugin-stylus-alias'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
	console.log('** mode **', mode)
	return {
		plugins: [vue(), stylusAlias()],
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
			},
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
