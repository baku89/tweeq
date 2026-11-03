import type {editor} from 'monaco-editor'

export interface InputCodeProps {
	modelValue: string
	lang: string
	options?: editor.IStandaloneEditorConstructionOptions
}
