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

/** How a hole is filled: typed in, or by pointing at what is already there. */
export type ActionInput<Value = unknown> = ActionLiteral<Value> | ActionPick<Value>

/** Something that can be entered right there, as a field in the terms of `InputComplex`. */
export interface ActionLiteral<Value = unknown> {
	/** A description of the field, as in a `Scheme`. */
	readonly field: Readonly<Record<string, unknown>>
	readonly initial: unknown
	/** What was entered, as a value of the type. It is taken as it is without this. */
	value?(entered: unknown): Value
}

/**
 * Something that is somewhere already. While its hole is the active one, selecting it fills
 * the hole. It can also be pulled from the hole to it, or dragged from where it is.
 */
export interface ActionPick<Value = unknown> {
	/** What it says while empty, like "Select path". */
	readonly placeholder: string
	/** What it says with `value` in it. */
	label(value: Value): string
	/** What is at this place on screen, to pull a line from the hole to. */
	at?(x: number, y: number): Value | null
	/** What a drag beginning at this place on screen would be dragging. */
	from?(x: number, y: number): Value | null
}

export const isPick = <Value>(input: ActionInput<Value>): input is ActionPick<Value> =>
	'placeholder' in input

export interface ActionParam<Type = unknown> {
	readonly name: string
	readonly type: Type
	/** It takes all that is selected, as an array, however many that is. */
	readonly many?: boolean
	/** The action can run with this left empty, which comes to it as `undefined`. */
	readonly optional?: boolean
	/** It is always asked for, and what happens to be selected has no say in it. */
	readonly asked?: boolean
}

/** What actions are being offered in, which is for a host to say. */
export interface ActionContext<Type = unknown, Value = unknown> {
	readonly types: ActionTypes<Type, Value>
	/** What is selected right now. */
	subject(): readonly Value[]
	/**
	 * What there is to do to that, past the actions there always are. These are offered by the
	 * palette under `heading`, if they are few enough to read, and can always be searched for.
	 */
	suggestions?(): {
		readonly heading: string
		readonly items: readonly SuggestedAction[]
	} | null
}

export interface SuggestedAction {
	readonly id: string
	readonly label: string
	readonly icon?: string
	/** What it has yet to be given, which is asked for, as any other action's is. */
	readonly params?: readonly ActionParam[]
	perform(...args: any[]): unknown
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
			param.asked !== true &&
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

/** Whether all that is missing can be asked for. */
export const canAsk = (
	{missing}: Filled,
	types: ActionTypes | null
): boolean =>
	missing.length > 0 && missing.every(param => (types?.input?.(param) ?? null) !== null)

export interface Hole {
	readonly param: ActionParam
	/** Which of the arguments it is. */
	readonly index: number
	readonly input: ActionInput
	/** What is in it, which is an array if it takes many. */
	readonly value: unknown
	readonly empty: boolean
}

/** An action, waiting for its holes to be filled. */
export interface Form<Action> {
	readonly action: Action
	readonly args: readonly unknown[]
	readonly holes: readonly Hole[]
	/** The hole that what is selected next goes in. */
	readonly active: number | null
}

const nextEmpty = (holes: readonly Hole[]): number | null => {
	const at = holes.findIndex(hole => hole.empty && isPick(hole.input))
	return at < 0 ? null : at
}

/** A form for what is missing. Null if something of it cannot be asked for. */
export function formOf<Action>(
	action: Action,
	params: readonly ActionParam[] | undefined,
	filled: Filled,
	types: ActionTypes | null
): Form<Action> | null {
	if (params === undefined || !canAsk(filled, types)) return null
	const holes = filled.missing.map((param): Hole => {
		const input = types!.input!(param)!
		return isPick(input)
			? {param, index: params.indexOf(param), input, value: undefined, empty: true}
			: {param, index: params.indexOf(param), input, value: input.initial, empty: false}
	})
	return {action, args: filled.args, holes, active: nextEmpty(holes)}
}

const withHole = <Action>(
	form: Form<Action>,
	at: number,
	hole: Partial<Hole>
): Form<Action> => {
	const holes = form.holes.map((it, i) => (i === at ? {...it, ...hole} : it))
	return {...form, holes, active: nextEmpty(holes)}
}

/** With something typed into a hole. */
export const entered = <Action>(
	form: Form<Action>,
	at: number,
	value: unknown
): Form<Action> => withHole(form, at, {value, empty: false})

/** With `values` in a hole, if they fit it. Otherwise it is as it was. */
export function picked<Action>(
	form: Form<Action>,
	at: number,
	values: readonly unknown[],
	types: ActionTypes | null
): Form<Action> {
	const hole = form.holes[at]
	if (hole === undefined || types === null || values.length === 0) return form
	const many = hole.param.many === true
	if (!many && values.length !== 1) return form
	if (!values.every(value => types.fits(value, hole.param.type))) return form
	const filled = withHole(form, at, {value: many ? values : values[0], empty: false})
	// There may be more of them to come, by adding to what is selected.
	return many ? {...filled, active: at} : filled
}

/** What was selected goes in the active hole, if it fits. */
export const tookSelection = <Action>(
	form: Form<Action>,
	subject: readonly unknown[],
	types: ActionTypes | null
): Form<Action> =>
	form.active === null ? form : picked(form, form.active, subject, types)

/** With a hole as the active one, emptied if something is in it, for filling it again. */
export const activated = <Action>(form: Form<Action>, at: number): Form<Action> => ({
	...form,
	holes: form.holes.map((hole, i) =>
		i === at ? {...hole, value: undefined, empty: true} : hole
	),
	active: at,
})

export const isComplete = <Action>({holes}: Form<Action>): boolean =>
	holes.every(({empty}) => !empty)

/** What to perform the action with. */
export function argsOf<Action>({args, holes}: Form<Action>): unknown[] {
	const all = [...args]
	for (const {index, input, value} of holes) {
		all[index] = !isPick(input) && input.value ? input.value(value) : value
	}
	return all
}

/** Where a box goes so that enough of it stays on screen to take hold of it again. */
export function keptOnScreen(
	[x, y]: readonly [number, number],
	[width, height]: readonly [number, number],
	[screenWidth, screenHeight]: readonly [number, number]
): [number, number] {
	return [
		Math.max(0, Math.min(x, screenWidth - width)),
		Math.max(0, Math.min(y, screenHeight - height)),
	]
}

export interface Candidate<Action> {
	readonly action: Action
	readonly filled: Filled
	/** How well it matches what was searched for, from 0 to 1. */
	readonly score?: number
}

/** How much a match on what is selected counts for, against what was searched for. */
const FITS_SELECTION = 0.1

/** How much having to be asked for something counts against it, against what was searched for. */
const HAS_TO_ASK = 0.05

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
	const stuck = ({filled}: Candidate<Action>): boolean =>
		filled.missing.length > 0 && !canAsk(filled, types)
	const weight = (candidate: Candidate<Action>): number =>
		(candidate.score ?? 0) +
		(candidate.filled.took ? FITS_SELECTION : 0) -
		(candidate.filled.missing.length > 0 ? HAS_TO_ASK : 0)
	return [...candidates].sort(
		(a, b) =>
			Number(stuck(a)) - Number(stuck(b)) ||
			weight(b) - weight(a) ||
			particular(b) - particular(a)
	)
}
