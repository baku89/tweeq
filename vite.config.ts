import vue from '@vitejs/plugin-vue'
import path from 'path'
import {defineConfig} from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
	return {
		plugins: [vue()],
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
