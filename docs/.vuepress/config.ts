import {defineUserConfig} from 'vuepress'
import {defaultTheme} from '@vuepress/theme-default'
import {viteBundler} from '@vuepress/bundler-vite'
import glsl from 'vite-plugin-glsl'

export default defineUserConfig({
	title: 'Tweeq',
	base: '/tweeq/',
	head: [
		['link', {rel: 'icon', href: './logo.svg'}],
		['link', {rel: 'preconnect', href: 'https://fonts.googleapis.com'}],
		[
			'link',
			{rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true},
		],
		[
			'link',
			{
				rel: 'stylesheet',
				href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500&family=Work+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&display=swap',
				crossorigin: 'anonymous',
			},
		],
		['link', {rel: 'icon', href: '/logo.svg'}],
		[
			'link',
			{
				rel: 'stylesheet',
				href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
				crossorigin: 'anonymous',
			},
		],
		[
			'script',
			{
				src: 'https://cdn.jsdelivr.net/npm/ccapture.js-npmfixed@1.1.0/build/CCapture.all.min.js',
				crossorigin: 'anonymous',
			},
		],
	],
	theme: defaultTheme({
		navbar: [
			{
				text: 'Home',
				link: '/',
			},
			{
				text: 'Components',
				link: '/components',
			},
		],
		logo: '/logo.svg',
		repo: 'baku89/tweeq',
	}),
	locales: {
		'/': {
			lang: 'English',
			title: 'Tweeq',
			description:
				'A collection of Vue.js components for designers and artists',
		},
	},
	bundler: viteBundler({
		viteOptions: {
			plugins: [glsl()],
			define: {
				// This is needed to make the PromiseQueue class available in the browser.
				'process.env.PROMISE_QUEUE_COVERAGE': false,
			},
		},
	}),
	markdown: {
		//@ts-ignore
		linkify: true,
		typographer: true,
		code: {
			lineNumbers: false,
		},
	},
})
