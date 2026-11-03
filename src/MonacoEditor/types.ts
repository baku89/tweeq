import type {editor} from 'monaco-editor'

export interface MonacoEditorErrorInfo {
	message: string
	line: number
	column: number
}

export interface MonacoEditorProps {
	modelValue: string
	lang: string
	cursorIndex?: number
	errors?: MonacoEditorErrorInfo[] | null
	/** Laid over Tweeq's own options, when the editor is made. */
	options?: editor.IStandaloneEditorConstructionOptions
}
