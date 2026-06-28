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
	/**
	 * スクロールで `frameRange` の外（空白領域）へ出られる上限を、ビューポート幅に
	 * 対する割合で指定する。0.5 なら、コンテンツ端が画面中央に来る位置まで（＝画面の
	 * 半分が空白になるところまで）しかスクロールできない。
	 * @default 0.5
	 */
	overscroll?: number
}
