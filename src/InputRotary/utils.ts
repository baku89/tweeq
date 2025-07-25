import {Rect} from '@baku89/pave'
import {checkIntersection} from 'line-intersect'
import {vec2} from 'linearly'
import {partial} from 'lodash-es'

export function clampPosWithinRect(origin: vec2, pos: vec2, rect: Rect): vec2 {
	const [[left, top], [right, bottom]] = rect

	let ret: ReturnType<typeof checkIntersection>

	const check = partial(checkIntersection, ...origin, ...pos)

	if ((ret = check(left, top, right, top)).type === 'intersecting') {
		return [ret.point.x, ret.point.y]
	}

	if ((ret = check(right, top, right, bottom)).type === 'intersecting') {
		return [ret.point.x, ret.point.y]
	}

	if ((ret = check(right, bottom, left, bottom)).type === 'intersecting') {
		return [ret.point.x, ret.point.y]
	}

	if ((ret = check(left, bottom, left, top)).type === 'intersecting') {
		return [ret.point.x, ret.point.y]
	}

	return pos
}
