import {whenever} from '@vueuse/core'
import {uniqueId} from 'lodash-es'
import PQueue from 'p-queue'
import {defineStore} from 'pinia'
import Regl, {type DrawConfig} from 'regl'
import {type Ref} from 'vue'

type Uniforms = Record<
	string,
	number | number[] | readonly [number, number, number, number]
>

export const useReglContextStore = defineStore('tweeq.reglContext', () => {
	const drawQueue = new PQueue({concurrency: 1})

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

	function createDraw(img: Ref<HTMLImageElement | null>) {
		let latestWorkId = uniqueId()

		const {promise: waitTillImgMounted, resolve} = (
			Promise as any
		).withResolvers() as {
			promise: Promise<HTMLImageElement>
			resolve: (value: HTMLImageElement) => void
		}

		const pause = whenever(
			img,
			img => {
				pause()
				resolve(img)
			},
			{immediate: true, flush: 'sync'}
		)

		return function (frag: string, uniforms: Uniforms) {
			const workId = uniqueId()
			latestWorkId = workId

			drawQueue.add(async () => {
				if (latestWorkId !== workId) return

				const img = await waitTillImgMounted

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
				})()

				// Get the data of canvas and set it to the image's src
				img.src = canvas.toDataURL()
			})
		}
	}

	return {
		createDraw,
	}
})
