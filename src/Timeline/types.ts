import {vec2} from 'linearly'

export interface TimelineProps {
	/**
	 * タイムライン全体のフレーム範囲
	 */
	frameRange: vec2
	/**
	 * 1フレームの幅
	 */
	frameWidth: number
	/**
	 * 1フレームの幅の範囲
	 */
	frameWidthRange: vec2
}
