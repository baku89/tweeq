import Case from 'case'
import {computed} from 'vue'

export type Labelizer<T> = (v: T) => string

export type InputTheme = 'minimal' | 'underline'

export type InputFont = 'numeric' | 'monospace'

export type InputAlign = 'left' | 'center' | 'right'

export type InputPosition = 'start' | 'middle' | 'end'

export interface InputProps {
	invalid?: boolean
	disabled?: boolean
}

export interface InputEmits {
	focus: []
	blur: []
	confirm: []
}

export interface InputBoxProps extends InputProps {
	inlinePosition?: InputPosition
	blockPosition?: InputPosition
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
