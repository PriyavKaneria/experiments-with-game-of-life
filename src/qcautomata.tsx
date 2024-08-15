import { useState, useEffect, useRef, hydrate } from "react"
import "./style.css"
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

const QCAutomata = () => {
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
			<div className='p-4 z-10 relative text-gray-100 select-none pointer-events-none'>
				<h1 className='text-2xl font-bold mb-4'>
					3D Quantum Cellular Automata Simulation
				</h1>
				<h3 className='text-lg font-bold mb-4'>Rules:</h3>
				<p className='mb-4 max-w-5xl'>
					The universe of Quantum Cellular Automata is a three-dimensional cubic
					grid of cells, each in a superposition of three possible states:
					charged, neutral, or anti-charged. Each cell interacts with its 26
					neighbors (including diagonal and corner neighbors). At each step in
					time, the following transitions occur:
				</p>
				<ul className='list-disc list-inside mb-4'>
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
					<Button onClick={handleReset} className='mr-2'>
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
