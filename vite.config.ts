import { defineConfig } from "vite"
import preact from "@preact/preset-vite"

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		preact({
			prerender: {
				enabled: true,
				renderTarget: "#app",
			},
		}),
	],
	optimizeDeps: {
		exclude: ["conwaysgol2d-wasm"],
	},
	assetsInclude: ["**/conwaysgol2D-wasm/*.wasm"],
	// server: {
	// 	fs: {
	// 		allow: [".."],
	// 	},
	// },
	// base: "/experiments-with-game-of-life/",
})
