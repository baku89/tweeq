export interface InputVecProps<T extends readonly number[]> {
	min?: T | number
	max?: T | number
	step?: T | number
	icon?: string[] | string
}
