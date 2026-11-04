import {describe, expect, it} from 'vitest'

import {
	type ActionContext,
	type ActionTypes,
	asking,
	fill,
	likely,
	ranked,
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

describe('asking', () => {
	const answerable: ActionTypes = {
		...types,
		input: ({type}) =>
			type === 'none'
				? null
				: {
						field: {type: 'string'},
						initial: 'first',
						value: entered => `${type as string}:${entered as string}`,
					},
	}
	const inContext: ActionContext = {types: answerable, subject: () => ['shape']}

	it('has nothing to ask of what is not missing anything', () => {
		const params = [{name: 'x', type: 'shape'}]
		expect(asking(params, fill(params, inContext), answerable)).toBeNull()
	})

	it('asks only for what is missing, and keeps what was filled', () => {
		const params = [
			{name: 'x', type: 'shape'},
			{name: 'y', type: 'text'},
		]
		const asked = asking(params, fill(params, inContext), answerable)!
		expect(asked.initial).toEqual({y: 'first'})
		expect(asked.scheme).toEqual({y: {type: 'string'}})
		expect(asked.args({y: 'hi'})).toEqual(['shape', 'text:hi'])
	})

	it('gives a parameter that takes many an array', () => {
		const params = [{name: 'xs', type: 'text', many: true}]
		const asked = asking(params, fill(params, inContext), answerable)!
		expect(asked.args({xs: 'hi'})).toEqual([['text:hi']])
	})

	it('cannot ask at all if one of them cannot be asked for', () => {
		const params = [
			{name: 'x', type: 'text'},
			{name: 'y', type: 'none'},
		]
		expect(asking(params, fill(params, inContext), answerable)).toBeNull()
	})

	it('cannot ask without a way to', () => {
		const params = [{name: 'x', type: 'text'}]
		expect(asking(params, fill(params, inContext), types)).toBeNull()
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
