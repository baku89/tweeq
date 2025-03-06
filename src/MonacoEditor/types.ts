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
}
