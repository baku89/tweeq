import eslint from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import prettierConfig from '@vue/eslint-config-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import unusedImports from 'eslint-plugin-unused-imports'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import eseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'

export default eseslint.config(
	eslint.configs.recommended,
	eseslint.configs.recommended,
	pluginVue.configs['flat/recommended'],
	{
		languageOptions: {
			parser: vueParser,
			ecmaVersion: 'latest',
			sourceType: 'module',
			parserOptions: {
				parser: tsParser,
			},
			globals: globals.browser,
		},
		plugins: {
			'simple-import-sort': simpleImportSort,
			'unused-imports': unusedImports,
		},
		rules: {
			'arrow-body-style': 'off',
			'prefer-arrow-callback': 'off',
			'no-console': 'warn',
			'no-debugger': 'warn',
			'no-undef': 'off',
			eqeqeq: 'error',
			'prefer-const': 'error',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-use-before-define': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'simple-import-sort/imports': 'error',
			'unused-imports/no-unused-imports': 'error',
			'vue/require-default-prop': 'off',
			'vue/no-multiple-template-root': 'off',
			'vue/multi-word-component-names': 'off',
			'vue/no-v-model-argument': 'off',
			'vue/attribute-hyphenation': 'off',
			'vue/v-on-event-hyphenation': 'off',
		},
	},
	prettierConfig
)
