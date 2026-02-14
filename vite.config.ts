import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: true,
		allowedHosts: ['www.hojunyang.xyz', 'hojunyang.xyz', 'hojunyang.duckdns.org']
	},
	preview: {
		host: true,
		allowedHosts: ['www.hojunyang.xyz', 'hojunyang.xyz', 'hojunyang.duckdns.org']
	}
});
