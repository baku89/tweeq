import Case from 'case'
import {computed} from 'vue'

export type Validator<T> = (value: T) => T | undefined

export type Labelizer<T> = (v: T) => string

export type InputTheme = 'minimal' | 'underline'

export type InputFont = 'numeric' | 'monospace'

export type InputAlign = 'left' | 'center' | 'right'

export type InputHorizontalPosition = 'left' | 'middle' | 'right'
export type InputVerticalPosition = 'top' | 'middle' | 'bottom'

export interface InputProps<T> {
	modelValue: T
	invalid?: boolean
	disabled?: boolean
}

export interface InputEmits<T> {
	'update:modelValue': [value: T]
	focus: []
	blur: []
	confirm: []
}

export interface InputBoxProps<T> extends InputProps<T> {
	horizontalPosition?: InputHorizontalPosition
	verticalPosition?: InputVerticalPosition
}

export interface LabelizerProps<T> {
	readonly options: T[]
	readonly labels?: string[]
	labelizer?: Labelizer<T>
	prefix?: string
	suffix?: string
}

export function useLabelizer<T>(props: LabelizerProps<T>) {
	return computed(() => {
		if (props.labelizer) return props.labelizer

		const prefix = props.prefix || ''
		const suffix = props.suffix || ''

		if (!props.labels) {
			return (v: T) => prefix + Case.capital(String(v)) + suffix
		}

		const labels = props.labels

		if (labels.length !== props.options.length) {
			throw new Error(
				'the length of labels must be the same as the length of options'
			)
		}

		return (v: T) => {
			const index = props.options.indexOf(v)
			return prefix + labels[index] + suffix
		}
	})
}
