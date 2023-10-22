import {mapValues} from 'lodash'
import {defineStore} from 'pinia'
import Queue from 'promise-queue'
import Regl, {DrawConfig} from 'regl'
import sleep from 'sleep-promise'

const drawQueue = new Queue(1, Infinity)

type Uniforms = Record<
	string,
	number | number[] | readonly [number, number, number, number]
>

export const useReglContextStore = defineStore('tweeq.reglContext', () => {
	const REGL_QUAD_DEFAULT: DrawConfig = {
		vert: `
		precision mediump float;
		attribute vec2 position;
		varying vec2 uv;
		void main() {
			uv = position / 2.0 + 0.5;
			gl_Position = vec4(position, 0, 1);
		}`,
		attributes: {
			position: [-1, -1, 1, -1, -1, 1, 1, 1],
		},
		depth: {
			enable: false,
		},
		count: 4,
		primitive: 'triangle strip',
	}

	const canvas = document.createElement('canvas')

	const regl = Regl({
		canvas,
		attributes: {
			depth: false,
			premultipliedAlpha: false,
		},
	})

	function draw(frag: string, uniforms: Uniforms, img: HTMLImageElement) {
		drawQueue.add(async () => {
			canvas.width = img.clientWidth
			canvas.height = img.clientHeight

			const prop = regl.prop as any

			regl({
				...REGL_QUAD_DEFAULT,
				frag,
				viewport: {
					x: 0,
					y: 0,
					width: img.clientWidth,
					height: img.clientHeight,
				},
				uniforms: mapValues(uniforms, (_, key) => prop(key)),
			})(uniforms)

			await sleep(1)

			// Get the data of canvas and set it to the image's src
			img.src = canvas.toDataURL()
		})
	}

	return {
		draw,
	}
})
