import {describe, expect, it} from 'vitest'

import {
	type ActionContext,
	type ActionParam,
	type ActionTypes,
	activated,
	argsOf,
	canAsk,
	entered,
	fill,
	formOf,
	isComplete,
	likely,
	picked,
	ranked,
	tookSelection,
} from './holes'

/** Types as prefixes: 'shape/path' is narrower than 'shape', which is narrower than ''. */
const types: ActionTypes = {
	fits: (value, type) => (value as string).startsWith(type as string),
	narrower: (a, b) => (a as string).startsWith(b as string),
}
const selecting = (...subject: string[]): ActionContext => ({
	types,
	subject: () => subject,
})

describe('fill', () => {
	it('has nothing to fill in an action with no parameters', () => {
		expect(fill(undefined, selecting('shape/path'))).toEqual({
			args: [],
			took: null,
			missing: [],
		})
	})

	it('gives what is selected to the parameter it fits', () => {
		const filled = fill([{name: 'x', type: 'shape'}], selecting('shape/path'))
		expect(filled.args).toEqual(['shape/path'])
		expect(filled.took).toEqual({type: 'shape'})
		expect(filled.missing).toEqual([])
	})

	it('leaves a parameter it does not fit missing', () => {
		const param = {name: 'x', type: 'shape/path'}
		expect(fill([param], selecting('shape/group')).missing).toEqual([param])
	})

	it('has a parameter that takes many take all of it, or none', () => {
		const param = {name: 'xs', type: 'shape', many: true}
		expect(fill([param], selecting('shape/a', 'shape/b')).args).toEqual([
			['shape/a', 'shape/b'],
		])
		expect(fill([param], selecting('shape/a', 'text')).missing).toEqual([param])
	})

	it('does not give several to a parameter that takes one', () => {
		const param = {name: 'x', type: 'shape'}
		expect(fill([param], selecting('shape/a', 'shape/b')).missing).toEqual([param])
	})

	it('has nothing selected fill nothing, which only an optional one can do without', () => {
		const required = {name: 'xs', type: '', many: true}
		const optional = {...required, optional: true}
		expect(fill([required], selecting()).missing).toEqual([required])
		expect(fill([optional], selecting())).toEqual({
			args: [undefined],
			took: null,
			missing: [],
		})
	})

	it('fills one parameter, and leaves the next', () => {
		const next = {name: 'y', type: ''}
		const filled = fill([{name: 'x', type: ''}, next], selecting('a'))
		expect(filled.args).toEqual(['a', undefined])
		expect(filled.missing).toEqual([next])
	})

	it('cannot fill anything with no context', () => {
		const param = {name: 'x', type: ''}
		expect(fill([param], null).missing).toEqual([param])
	})
})

describe('a form', () => {
	const pick = {placeholder: 'Select', label: (value: unknown) => String(value)}
	const answerable: ActionTypes = {
		...types,
		input: ({type}) =>
			type === 'none'
				? null
				: type === 'count'
					? {field: {type: 'number'}, initial: 1, value: n => (n as number) * 2}
					: pick,
	}
	const over = (subject: string[]): ActionContext => ({
		types: answerable,
		subject: () => subject,
	})
	const start = (params: ActionParam[], subject: string[] = []) =>
		formOf('act', params, fill(params, over(subject)), answerable)!

	const x = {name: 'x', type: 'shape'}
	const y = {name: 'y', type: 'text'}

	it('is not needed by what is missing nothing', () => {
		expect(formOf('act', [x], fill([x], over(['shape'])), answerable)).toBeNull()
	})

	it('cannot be had if something cannot be asked for', () => {
		const none = {name: 'n', type: 'none'}
		expect(formOf('act', [x, none], fill([x, none], over([])), answerable)).toBeNull()
		expect(canAsk(fill([x, none], over([])), answerable)).toBe(false)
		expect(canAsk(fill([x], over([])), types)).toBe(false)
	})

	it('keeps what was selected, and asks for the rest', () => {
		const form = start([x, y], ['shape'])
		expect(form.holes.map(({param}) => param.name)).toEqual(['y'])
		expect(argsOf(picked(form, 0, ['text'], answerable))).toEqual(['shape', 'text'])
	})

	it('goes from one empty hole on to the next', () => {
		const form = start([x, y])
		expect(form.active).toBe(0)
		const next = tookSelection(form, ['shape'], answerable)
		expect(next.active).toBe(1)
		expect(isComplete(next)).toBe(false)
		const last = tookSelection(next, ['text'], answerable)
		expect(last.active).toBeNull()
		expect(isComplete(last)).toBe(true)
		expect(argsOf(last)).toEqual(['shape', 'text'])
	})

	it('ignores what does not fit, and having nothing selected', () => {
		const form = start([x])
		expect(tookSelection(form, ['text'], answerable)).toBe(form)
		expect(tookSelection(form, [], answerable)).toBe(form)
	})

	it('takes all of what is selected in a hole that takes many', () => {
		const form = start([{...x, many: true}])
		expect(argsOf(tookSelection(form, ['shape/a', 'shape/b'], answerable))).toEqual([
			['shape/a', 'shape/b'],
		])
	})

	it('does not take several in a hole that takes one', () => {
		const form = start([x])
		expect(tookSelection(form, ['shape/a', 'shape/b'], answerable)).toBe(form)
	})

	it('keeps taking more in a hole that takes many', () => {
		const form = start([{...x, many: true}])
		const one = tookSelection(form, ['shape/a'], answerable)
		expect(isComplete(one)).toBe(true)
		const both = tookSelection(one, ['shape/a', 'shape/b'], answerable)
		expect(argsOf(both)).toEqual([['shape/a', 'shape/b']])
	})

	it('has nothing go in after it is all filled', () => {
		const full = tookSelection(start([x]), ['shape/a'], answerable)
		expect(argsOf(tookSelection(full, ['shape/b'], answerable))).toEqual(['shape/a'])
	})

	it('can have a hole filled again', () => {
		const full = tookSelection(start([x]), ['shape/a'], answerable)
		const again = activated(full, 0)
		expect(isComplete(again)).toBe(false)
		expect(argsOf(tookSelection(again, ['shape/b'], answerable))).toEqual(['shape/b'])
	})

	it('has what is typed start from its initial value, and come out as a value', () => {
		const count = {name: 'n', type: 'count', asked: true}
		const form = start([count], ['count'])
		expect(isComplete(form)).toBe(true)
		expect(form.active).toBeNull()
		expect(argsOf(form)).toEqual([2])
		expect(argsOf(entered(form, 0, 5))).toEqual([10])
	})

	it('asks for what is always asked for, even with something that fits selected', () => {
		const asked = {name: 'x', type: 'shape', asked: true}
		expect(fill([asked], over(['shape'])).missing).toEqual([asked])
	})
})

describe('likely', () => {
	const taking = (action: string, type: string) => ({
		action,
		filled: fill([{name: 'x', type}], selecting('shape/path')),
	})
	const offered = (candidates: ReturnType<typeof taking>[], atMost = 3) =>
		likely(candidates, types, atMost).map(({action}) => action)

	it('leaves out what takes anything, once there are too many of those', () => {
		expect(
			offered([
				taking('any1', ''),
				taking('any2', ''),
				taking('any3', ''),
				taking('shape', 'shape'),
				taking('path', 'shape/path'),
			])
		).toEqual(['path', 'shape'])
	})

	it('offers all there is, if it is few', () => {
		expect(offered([taking('any', ''), taking('path', 'shape/path')])).toEqual([
			'path',
			'any',
		])
	})

	it('offers nothing if too many take the same', () => {
		expect(
			offered([
				taking('a', ''),
				taking('b', ''),
				taking('c', ''),
				taking('d', ''),
			])
		).toEqual([])
	})

	it('offers nothing that takes nothing, or cannot run', () => {
		expect(
			offered([
				{action: 'save', filled: fill([], selecting('shape/path'))},
				taking('group', 'shape/group'),
			])
		).toEqual([])
	})
})

describe('ranked', () => {
	const candidate = (action: string, params: Parameters<typeof fill>[0], score?: number) => ({
		action,
		filled: fill(params, selecting('shape/path')),
		score,
	})
	const order = (...candidates: ReturnType<typeof candidate>[]) =>
		ranked(candidates, types).map(({action}) => action)

	const anything = [{name: 'x', type: ''}]
	const shape = [{name: 'x', type: 'shape'}]
	const path = [{name: 'x', type: 'shape/path'}]
	const group = [{name: 'x', type: 'shape/group'}]

	it('puts the most particular first', () => {
		expect(
			order(candidate('any', anything), candidate('path', path), candidate('shape', shape))
		).toEqual(['path', 'shape', 'any'])
	})

	it('puts what cannot run last, however well it matches the search', () => {
		expect(order(candidate('group', group, 1), candidate('path', path, 0.7))).toEqual([
			'path',
			'group',
		])
	})

	it('has what can ask for what it is missing go by the search like any other', () => {
		const asks: ActionTypes = {...types, input: () => ({field: {}, initial: 0})}
		const candidates = [
			{action: 'near', filled: fill([], selecting()), score: 0.7},
			{
				action: 'exact',
				filled: fill(group, {types: asks, subject: () => []}),
				score: 1,
			},
		]
		expect(ranked(candidates, asks).map(({action}) => action)).toEqual([
			'exact',
			'near',
		])
	})

	it('has taking what is selected count for less than a clear search', () => {
		expect(order(candidate('path', path, 0.7), candidate('save', [], 1))).toEqual([
			'save',
			'path',
		])
		expect(order(candidate('save', [], 0.8), candidate('path', path, 0.75))).toEqual([
			'path',
			'save',
		])
	})

	it('keeps the order of what it cannot tell apart', () => {
		expect(order(candidate('a', []), candidate('b', []))).toEqual(['a', 'b'])
	})
})
