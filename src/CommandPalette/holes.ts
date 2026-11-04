/**
 * An action with parameters has holes, and what is selected can fill them. Tweeq does not
 * know what a type is: it holds them for a host, and asks the host what fits what.
 */

export interface ActionTypes<Type = unknown, Value = unknown> {
	/** Whether `value` is one of `type`. */
	fits(value: Value, type: Type): boolean
	/** Whether every value of `a` is one of `b`, for putting the most particular first. */
	narrower(a: Type, b: Type): boolean
	/** What to call `type`, to say what an action is missing. */
	name?(type: Type): string
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

export interface Candidate<Action> {
	readonly action: Action
	readonly filled: Filled
	/** How well it matches what was searched for, from 0 to 1. */
	readonly score?: number
}

/** How much a match on what is selected counts for, against what was searched for. */
const FITS_SELECTION = 0.1

/**
 * The ones that cannot run go last, and otherwise what was searched for decides, with those
 * taking what is selected ahead of the rest, the most particular first. As one type may be
 * neither narrower nor wider than another, how particular it is goes by how many are wider.
 */
export function ranked<Action>(
	candidates: readonly Candidate<Action>[],
	types: ActionTypes | null
): Candidate<Action>[] {
	const taken = candidates.flatMap(({filled}) => (filled.took ? [filled.took.type] : []))
	const particular = ({filled}: Candidate<Action>): number => {
		if (filled.took === null || types === null) return 0
		const {type} = filled.took
		return new Set(
			taken.filter(
				wider =>
					wider !== type &&
					types.narrower(type, wider) &&
					!types.narrower(wider, type)
			)
		).size
	}
	const weight = (candidate: Candidate<Action>): number =>
		(candidate.score ?? 0) + (candidate.filled.took ? FITS_SELECTION : 0)
	return [...candidates].sort(
		(a, b) =>
			Number(a.filled.missing.length > 0) - Number(b.filled.missing.length > 0) ||
			weight(b) - weight(a) ||
			particular(b) - particular(a)
	)
}
