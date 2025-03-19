export interface InputVecProps<T extends readonly number[]> {
	modelValue: T
	min?: T | number
	max?: T | number
	step?: T | number
	icon?: string[] | string
}
