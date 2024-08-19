import { useState, useEffect, useRef } from "react"
import Button from "./components/button"
import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"

const GRID_SIZE = 20

const cellColors = {
	0: 0x000000, // neutral (transparent)
	1: 0x3b82f6, // charged (blue)
	2: 0xef4444, // anti-charged (red)
}

const cellOpacity = {
	0: 0,
	1: 0.25,
	2: 0.25,
}

const initializeGrid = () => {
	return Array(GRID_SIZE)
		.fill(0)
		.map(() =>
			Array(GRID_SIZE)
				.fill(0)
				.map(() =>
					Array(GRID_SIZE)
						.fill(0)
						.map(() => Math.floor(Math.random() * 3))
				)
		)
}

const countNeighbors = (grid: any[], x: number, y: number, z: number) => {
	let charged = 0
	let antiCharged = 0
	for (let dx = -1; dx <= 1; dx++) {
		for (let dy = -1; dy <= 1; dy++) {
			for (let dz = -1; dz <= 1; dz++) {
				if (dx === 0 && dy === 0 && dz === 0) continue
				const nx = x + dx,
					ny = y + dy,
					nz = z + dz
				if (
					nx >= 0 &&
					nx < GRID_SIZE &&
					ny >= 0 &&
					ny < GRID_SIZE &&
					nz >= 0 &&
					nz < GRID_SIZE
				) {
					if (grid[nx][ny][nz] === 1) charged++
					if (grid[nx][ny][nz] === 2) antiCharged++
				}
			}
		}
	}
	return [charged, antiCharged]
}

const updateCell = (cell: number, charged: number, antiCharged: number) => {
	if (cell === 2 && charged > 5) return 1
	if (antiCharged === 3) return 2
	if (charged % 2 === 1) return 1
	if (charged % 2 === 0) return 0
	return cell
}

const simulateStep = (grid: any[]) => {
	const newGrid = grid.map((plane, x) =>
		plane.map((row: any[], y: any) =>
			row.map((cell: any, z: any) => {
				const [charged, antiCharged] = countNeighbors(grid, x, y, z)
				return updateCell(cell, charged, antiCharged)
			})
		)
	)
	return newGrid
}

const QCAutomata: React.FC = () => {
	const grid = useRef(initializeGrid())
	const steps = useRef(0)
	const mountRef = useRef(null)
	const sceneRef = useRef(null)
	const cameraRef = useRef(null)
	const rendererRef = useRef(null)
	const controlsRef = useRef(null)
	const cubesRef = useRef([])

	const [ready, setReady] = useState(false)
	const playing = useRef(false)

	useEffect(() => {
		// full screen
		const width = window.innerWidth
		const height = window.innerHeight

		// Scene setup
		const scene = new THREE.Scene()
		sceneRef.current = scene

		// Camera setup
		const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
		camera.position.z = 10
		cameraRef.current = camera

		// Renderer setup
		const renderer = new THREE.WebGLRenderer()
		renderer.setSize(width, height)
		mountRef.current.style.position = "fixed"
		mountRef.current.style.top = 0
		mountRef.current.style.zIndex = 0
		mountRef.current.appendChild(renderer.domElement)
		rendererRef.current = renderer

		// Orbit controls setup
		const controls = new OrbitControls(camera, renderer.domElement)
		controlsRef.current = controls

		// Lighting
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
		scene.add(ambientLight)

		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
		directionalLight.position.set(10, 10, 10)
		scene.add(directionalLight)

		// Create cubes
		const cubeSize = 0.2
		const spacing = 0.3
		const offset = GRID_SIZE / 2

		for (let x = 0; x < GRID_SIZE; x++) {
			for (let y = 0; y < GRID_SIZE; y++) {
				for (let z = 0; z < GRID_SIZE; z++) {
					const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize)
					const material = new THREE.MeshPhongMaterial({
						color: cellColors[grid.current[x][y][z]],
						transparent: true,
						opacity: cellOpacity[grid.current[x][y][z]],
					})
					const cube = new THREE.Mesh(geometry, material)
					cube.position.set(
						(x - offset) * spacing,
						(y - offset) * spacing,
						(z - offset) * spacing
					)
					scene.add(cube)
					cubesRef.current.push(cube)
				}
			}
		}

		setReady(true)

		// Cleanup
		return () => {
			mountRef.current.removeChild(renderer.domElement)
		}
	}, [])

	useEffect(() => {
		// Animation loop
		const animate = () => {
			requestAnimationFrame(animate)
			if (playing.current) {
				handleStep()
			}
			controlsRef.current.update()
			rendererRef.current.render(sceneRef.current, cameraRef.current)
		}
		animate()
	}, [ready])

	const updateGridColors = () => {
		// Update cube colors based on grid state
		let index = 0
		for (let x = 0; x < GRID_SIZE; x++) {
			for (let y = 0; y < GRID_SIZE; y++) {
				for (let z = 0; z < GRID_SIZE; z++) {
					cubesRef.current[index].material.color.setHex(
						cellColors[grid.current[x][y][z]]
					)
					cubesRef.current[index].material.opacity =
						cellOpacity[grid.current[x][y][z]]
					index++
				}
			}
		}
	}

	const handleStep = () => {
		grid.current = simulateStep(grid.current) as any
		updateGridColors()
		steps.current++
	}

	const handleReset = () => {
		grid.current = initializeGrid()
		updateGridColors()
		steps.current = 0
	}

	const handlePlay = () => {
		playing.current = true
	}

	const handlePause = () => {
		playing.current = false
	}

	return (
		<div className='w-full h-full'>
			<div className='m-4 p-4 z-10 relative text-gray-100 bg-opacity-75 bg-black w-max select-none pointer-events-none'>
				<h1 className='text-2xl font-bold inline-block mb-2'>
					<a
						href='./'
						allowTransparency={false}
						className='pointer-events-auto'>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							xmlnsXlink='http://www.w3.org/1999/xlink'
							fill='#f3f4f6'
							height='32px'
							width='32px'
							version='1.1'
							viewBox='0 0 512 512'
							className='inline-block mr-3 mb-2'
							xmlSpace='preserve'>
							<g>
								<g>
									<g>
										<path d='M0,0v512h512V0H0z M469.333,469.333H42.667V42.667h426.667V469.333z' />
										<path d='M110.931,243.242c-0.226,0.302-0.461,0.598-0.671,0.913c-0.204,0.304-0.38,0.62-0.566,0.932     c-0.17,0.285-0.349,0.564-0.506,0.857c-0.17,0.318-0.315,0.646-0.468,0.971c-0.145,0.306-0.297,0.607-0.428,0.921     c-0.13,0.315-0.236,0.637-0.35,0.957c-0.121,0.337-0.25,0.669-0.354,1.013c-0.097,0.32-0.168,0.646-0.249,0.969     c-0.089,0.351-0.187,0.698-0.258,1.055c-0.074,0.375-0.118,0.753-0.173,1.13c-0.044,0.311-0.104,0.617-0.135,0.933     c-0.138,1.4-0.138,2.811,0,4.211c0.031,0.315,0.09,0.621,0.135,0.933c0.054,0.377,0.098,0.756,0.173,1.13     c0.071,0.358,0.169,0.704,0.258,1.055c0.081,0.324,0.152,0.649,0.249,0.969c0.104,0.344,0.233,0.677,0.354,1.013     c0.115,0.32,0.22,0.642,0.35,0.957c0.13,0.314,0.283,0.615,0.428,0.921c0.153,0.325,0.297,0.653,0.468,0.971     c0.157,0.293,0.336,0.572,0.506,0.857c0.186,0.312,0.363,0.628,0.566,0.932c0.211,0.315,0.445,0.611,0.671,0.913     c0.191,0.255,0.368,0.516,0.571,0.764c0.439,0.535,0.903,1.05,1.392,1.54c0.007,0.008,0.014,0.016,0.021,0.023l85.333,85.333     c8.331,8.331,21.839,8.331,30.17,0c8.331-8.331,8.331-21.839,0-30.17l-48.915-48.915H384c11.782,0,21.333-9.551,21.333-21.333     s-9.551-21.333-21.333-21.333H179.503l48.915-48.915c8.331-8.331,8.331-21.839,0-30.17s-21.839-8.331-30.17,0l-85.333,85.333     c-0.008,0.008-0.014,0.016-0.021,0.023c-0.488,0.49-0.952,1.004-1.392,1.54C111.299,242.726,111.122,242.987,110.931,243.242z' />
									</g>
								</g>
							</g>
						</svg>
					</a>
					3D Quantum Cellular Automata Simulation
				</h1>
				<h3 className='text-lg font-bold mb-2'>Rules:</h3>
				<p className='mb-2 max-w-3xl'>
					Three-dimensional cubic grid of cells, each in a superposition of
					three possible states: charged, neutral, or anti-charged. The
					following rules apply:
				</p>
				<ul className='list-disc list-inside mb-2'>
					<li>
						Any cell with an even number of charged neighbors becomes neutral.
					</li>
					<li>
						Any cell with an odd number of charged neighbors becomes charged.
					</li>
					<li>
						Any cell with exactly three anti-charged neighbors becomes
						anti-charged.
					</li>
					<li>
						Any anti-charged cell with more than five charged neighbors becomes
						charged.
					</li>
					<li>All other cells maintain their current state.</li>
				</ul>
				<div className='mb-4 pointer-events-auto'>
					<Button onClick={handleStep} className='mr-2'>
						Step
					</Button>
					<Button onClick={handleReset} className='mr-2 bg-gray-500'>
						Reset
					</Button>
					<Button onClick={handlePlay} className='mr-2'>
						Play
					</Button>
					<Button onClick={handlePause} variant='outline'>
						Pause
					</Button>
				</div>
				<div className='mb-4'>Steps: {steps.current}</div>
			</div>
			<div ref={mountRef}></div>
		</div>
	)
}

export default QCAutomata
