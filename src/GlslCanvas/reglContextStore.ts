import {defineStore} from 'pinia'
import Queue from 'promise-queue'
import Regl, {DrawConfig} from 'regl'

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

	function createDraw() {
		let id: number | null = null

		return function (frag: string, uniforms: Uniforms, img: HTMLImageElement) {
			const currentId = Math.random()
			id = currentId

			drawQueue.add(async () => {
				if (id !== currentId) return

				canvas.width = img.clientWidth
				canvas.height = img.clientHeight

				regl({
					...REGL_QUAD_DEFAULT,
					frag,
					viewport: {
						x: 0,
						y: 0,
						width: img.clientWidth,
						height: img.clientHeight,
					},
					uniforms,
				})(uniforms)

				// NOTE: This is a hack to wait for the canvas to update
				// await sleep(0)

				// Get the data of canvas and set it to the image's src
				img.src = canvas.toDataURL()
			})
		}
	}

	return {
		createDraw,
	}
})
