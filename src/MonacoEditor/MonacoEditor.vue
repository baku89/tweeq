<script setup lang="ts">
import {vec2} from 'linearly'

import type {MonacoEditorProps} from './types'

const props = withDefaults(defineProps<MonacoEditorProps>(), {})

defineEmits<{
	'update:modelValue': [value: string]
	'update:cursorIndex': [value: number]
	'update:cursorPosition': [value: vec2]
}>()

// const $root = useTemplateRef('$root')
// const $editor = useTemplateRef('$editor')

// initialze Monaco editor
// onMounted(() => {
// 	if (!$editor.value || !$root.value) return

// 	// get the font size of the root element
// 	const fontSize = parseFloat(
// 		window.getComputedStyle($root.value).fontSize ?? '16'
// 	)

// 	// Initialize the editor
// 	const editor = monaco.editor.create($editor.value, {
// 		value: props.modelValue,
// 		language: props.lang,

// 		// make the editor look prettier

// 		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// 		// @ts-ignore
// 		'bracketPairColorization.enabled': false,
// 		fontLigatures: true,
// 		fontFamily: 'Geist Mono',
// 		fontSize,
// 		folding: false,
// 		lineNumbers: 'off',
// 		lineDecorationsWidth: 0,
// 		lineNumbersMinChars: 0,
// 		minimap: {
// 			enabled: false,
// 		},
// 		overviewRulerLanes: 0,
// 		renderIndentGuides: false,
// 		renderLineHighlight: 'none',
// 		scrollBeyondLastLine: false,
// 		scrollbar: {
// 			horizontalSliderSize: 2,
// 			useShadows: false,
// 			verticalSliderSize: 2,
// 			verticalScrollbarSize: 2,
// 		},
// 		tabSize: 2,
// 	})

// 	// fetch the theme file and apply to the editor
// 	monaco.editor.defineTheme('light', Tomorrow as any)
// 	monaco.editor.defineTheme('dark', TomorrowNight as any)

// 	const theme = useThemeStore()

// 	watchEffect(() => {
// 		monaco.editor.setTheme(theme.colorMode)
// 	})

// 	// resize editor to match its parent element size
// 	useResizeObserver($root.value.parentElement, entries => {
// 		const {
// 			contentRect: {width, height},
// 		} = entries[0]

// 		editor.layout({width, height})
// 	})

// 	// allow ES5 JavaScript linting
// 	const options =
// 		monaco.languages.typescript.javascriptDefaults.getCompilerOptions()
// 	options.noLib = true
// 	options.target = monaco.languages.typescript.ScriptTarget.ES5
// 	options.lib = ['es6']

// 	// run the code on change
// 	editor.getModel()?.onDidChangeContent(() => {
// 		const value = editor.getValue()
// 		if (value === props.modelValue) return
// 		emit('update:modelValue', editor.getValue())
// 	})

// 	editor.onDidChangeCursorPosition(() => {
// 		const position = editor.getPosition()

// 		if (!position) return

// 		// Convert monaco editor's position to character-based index
// 		const index = editor.getModel()?.getOffsetAt(position) ?? 0
// 		emit('update:cursorIndex', index)

// 		// Convert monaco editor's position to pixel-based position
// 		const cursorInfo = editor.getScrolledVisiblePosition(position)
// 		if (cursorInfo) {
// 			const {top, left, height} = cursorInfo
// 			emit('update:cursorPosition', [left, top + height])
// 		}
// 	})

// 	// Watch props and reflect the changes
// 	watch(
// 		() => props.modelValue,
// 		value => {
// 			if (editor.getValue() === value) return

// 			const model = editor.getModel()
// 			if (!model) return

// 			editor.pushUndoStop()

// 			editor.executeEdits('name-of-edit', [
// 				{
// 					range: model.getFullModelRange(),
// 					text: value,
// 				},
// 			])
// 			editor.pushUndoStop()
// 		}
// 	)

// 	watch(
// 		() => props.lang,
// 		lang => {
// 			const model = editor.getModel()
// 			if (!model) return
// 			monaco.editor.setModelLanguage(model, lang)
// 		}
// 	)

// 	watch(
// 		() => props.cursorIndex,
// 		cursorIndex => {
// 			if (cursorIndex === undefined) return

// 			const prevPosition = editor.getPosition()
// 			const position = editor.getModel()?.getPositionAt(cursorIndex)
// 			if (!prevPosition || !position || position.equals(prevPosition)) {
// 				return
// 			}

// 			editor.setPosition(position)
// 		},
// 		{immediate: true}
// 	)

// 	watch(
// 		() => props.errors,
// 		errors => {
// 			if (!errors) return

// 			const model = editor.getModel()
// 			if (!model) return

// 			// Add error decorations to monaco editor
// 			monaco.editor.setModelMarkers(
// 				model,
// 				'my-source',
// 				errors.map(error => ({
// 					message: error.message,
// 					severity: monaco.MarkerSeverity.Error,
// 					startLineNumber: error.line,
// 					endLineNumber: error.line,
// 					startColumn: error.column,
// 					endColumn: error.column,
// 				}))
// 			)
// 		},
// 		{immediate: true}
// 	)
// })
</script>

<template>
	<div class="TqMonacoEditor">{{ props.modelValue }}</div>
</template>

<style lang="stylus" scoped>
.TqMonacoEditor
	position relative
	min-height 0
	background transparent

// .root
// 	width 100%
// 	height 100%

:deep(.monaco-editor)
	--vscode-editor-background transparent
</style>
