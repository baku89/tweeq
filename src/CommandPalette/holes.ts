/**
 * An action with parameters has holes, and what is selected can fill them. Tweeq does not
 * know what a type is: it holds them for a host, and asks the host what fits what.
 */

export interface ActionTypes<Type = unknown, Value = unknown> {
	/** Whether `value` is one of `type`. */
	fits(value: Value, type: Type): boolean
	/** Whether every value of `a` is one of `b`, for putting the most particular first. */
	narrower(a: Type, b: Type): boolean
	/**
	 * How to ask for a parameter that what is selected did not fill. Null if there is no
	 * way to, or nothing to choose from, and then the action cannot run for now.
	 */
	input?(param: ActionParam<Type>): ActionInput<Value> | null
}

/** One field of a modal, in the terms of `InputComplex`. */
export interface ActionInput<Value = unknown> {
	/** A description of the field, as in a `Scheme`. */
	readonly field: Readonly<Record<string, unknown>>
	readonly initial: unknown
	/** What was entered, as a value of the type. It is taken as it is without this. */
	value?(entered: unknown): Value
}

export interface ActionParam<Type = unknown> {
	readonly name: string
	readonly type: Type
	/** It takes all that is selected, as an array, however many that is. */
	readonly many?: boolean
	/** The action can run with this left empty, which comes to it as `undefined`. */
	readonly optional?: boolean
}

/** What actions are being offered in, which is for a host to say. */
export interface ActionContext<Type = unknown, Value = unknown> {
	readonly types: ActionTypes<Type, Value>
	/** What is selected right now. */
	subject(): readonly Value[]
}

export interface Filled {
	/** What to perform the action with. */
	readonly args: readonly unknown[]
	/** The type of the parameter that took what is selected, if one did. */
	readonly took: {readonly type: unknown} | null
	/** What it cannot run without. An action with none of these can run. */
	readonly missing: readonly ActionParam[]
}

const NOTHING: Filled = {args: [], took: null, missing: []}

/** The first parameter that can take all of what is selected takes it. */
export function fill(
	params: readonly ActionParam[] | undefined,
	context: ActionContext | null
): Filled {
	if (params === undefined || params.length === 0) return NOTHING
	const subject = context?.subject() ?? []
	const args: unknown[] = []
	const missing: ActionParam[] = []
	let took: Filled['took'] = null
	for (const param of params) {
		const takes =
			took === null &&
			context !== null &&
			subject.length > 0 &&
			(param.many === true || subject.length === 1) &&
			subject.every(value => context.types.fits(value, param.type))
		if (takes) {
			args.push(param.many === true ? subject : subject[0])
			took = {type: param.type}
		} else {
			args.push(undefined)
			if (param.optional !== true) missing.push(param)
		}
	}
	return {args, took, missing}
}

export interface Asking {
	/** What a modal starts with, by the name of the parameter. */
	readonly initial: Record<string, unknown>
	readonly scheme: Record<string, unknown>
	/** What to perform the action with, once the modal has been filled in. */
	args(entered: Readonly<Record<string, unknown>>): unknown[]
}

/** How to ask for what is missing. Null if something of it cannot be asked for. */
export function asking(
	params: readonly ActionParam[] | undefined,
	{args, missing}: Filled,
	types: ActionTypes | null
): Asking | null {
	if (params === undefined || missing.length === 0) return null
	const inputs = new Map<ActionParam, ActionInput>()
	for (const param of missing) {
		const input = types?.input?.(param) ?? null
		if (input === null) return null
		inputs.set(param, input)
	}
	const initial: Record<string, unknown> = {}
	const scheme: Record<string, unknown> = {}
	for (const [{name}, input] of inputs) {
		initial[name] = input.initial
		scheme[name] = input.field
	}
	return {
		initial,
		scheme,
		args: entered =>
			params.map((param, i) => {
				const input = inputs.get(param)
				if (input === undefined) return args[i]
				const value = input.value
					? input.value(entered[param.name])
					: entered[param.name]
				return param.many === true ? [value] : value
			}),
	}
}

export interface Candidate<Action> {
	readonly action: Action
	readonly filled: Filled
	/** How well it matches what was searched for, from 0 to 1. */
	readonly score?: number
}

/** How much a match on what is selected counts for, against what was searched for. */
const FITS_SELECTION = 0.1

/** How many can be offered before anything has been searched for, and still say something. */
const AT_MOST_LIKELY = 5

/**
 * How particular what each candidate takes is. As one type may be neither narrower nor
 * wider than another, that goes by how many of the types among them are wider.
 */
function particularity<Action>(
	candidates: readonly Candidate<Action>[],
	types: ActionTypes | null
): (candidate: Candidate<Action>) => number {
	const taken = new Set(
		candidates.flatMap(({filled}) => (filled.took ? [filled.took.type] : []))
	)
	return ({filled}) => {
		if (filled.took === null || types === null) return 0
		const {type} = filled.took
		return [...taken].filter(
			wider =>
				wider !== type &&
				types.narrower(type, wider) &&
				!types.narrower(wider, type)
		).length
	}
}

/**
 * What is most likely wanted for what is selected, with nothing searched for yet: the most
 * particular, and the next most, for as long as all of them still fit. So many taking the
 * same thing tell nothing apart, and then there is nothing to offer.
 */
export function likely<Action>(
	candidates: readonly Candidate<Action>[],
	types: ActionTypes | null,
	atMost = AT_MOST_LIKELY
): Candidate<Action>[] {
	const fitting = candidates.filter(
		({filled}) => filled.took !== null && filled.missing.length === 0
	)
	const particular = particularity(fitting, types)
	const levels = [...new Set(fitting.map(particular))].sort((a, b) => b - a)
	const offered: Candidate<Action>[] = []
	for (const level of levels) {
		const those = fitting.filter(candidate => particular(candidate) === level)
		if (offered.length + those.length > atMost) break
		offered.push(...those)
	}
	return offered
}

/**
 * The ones that cannot run go last, and otherwise what was searched for decides, with those
 * taking what is selected ahead of the rest, the most particular first.
 */
export function ranked<Action>(
	candidates: readonly Candidate<Action>[],
	types: ActionTypes | null
): Candidate<Action>[] {
	const particular = particularity(candidates, types)
	const weight = (candidate: Candidate<Action>): number =>
		(candidate.score ?? 0) + (candidate.filled.took ? FITS_SELECTION : 0)
	return [...candidates].sort(
		(a, b) =>
			Number(a.filled.missing.length > 0) - Number(b.filled.missing.length > 0) ||
			weight(b) - weight(a) ||
			particular(b) - particular(a)
	)
}
