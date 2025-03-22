import {scalar} from 'linearly'
import validateColor from 'validate-color'

export type ValidateResult<T> = {value: T | undefined; log: string[]}

export type Validator<T> = (value: T) => ValidateResult<T>

export function clamp(min: number, max: number): Validator<number> {
	return value => {
		if (value < min) {
			return {value: Math.max(value, min), log: [`should be >= ${min}`]}
		}
		if (value > max) {
			return {value: Math.min(value, max), log: [`should be <= ${max}`]}
		}
		return {value, log: []}
	}
}

export function quantize(step: number): Validator<number> {
	return value => {
		if (step === 0) return {value, log: []}

		const quantized = scalar.quantize(value, step)

		if (!scalar.approx(value, quantized)) {
			return {value: quantized, log: [`should be a multiple of ${step}`]}
		}

		return {value, log: []}
	}
}

export const colorCode: Validator<string> = (value: string) => {
	if (validateColor(value)) {
		return {value, log: []}
	}

	return {value: undefined, log: ['Invalid color code']}
}

export const identity: Validator<any> = value => ({value, log: []})

export function compose<T>(
	...validators: (Validator<T> | null | undefined)[]
): Validator<T> {
	return value => {
		let result: ValidateResult<T> = {value, log: []}

		for (const validator of validators) {
			if (!validator || !result.value) continue

			const {value, log} = result

			result = validator(value)
			result.log.unshift(...log)
		}

		return result
	}
}
