import { useState, useEffect, useRef, hydrate } from "react"
import "./style.css"
import Button from "./components/button"
import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"

const GRID_SIZE = 20
const INITIAL_STEPS = 0

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

const countNeighbors = (grid, x, y, z) => {
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

const updateCell = (cell, charged, antiCharged) => {
	if (cell === 2 && charged > 5) return 1
	if (antiCharged === 3) return 2
	if (charged % 2 === 1) return 1
	if (charged % 2 === 0) return 0
	return cell
}

const simulateStep = (grid) => {
	const newGrid = grid.map((plane, x) =>
		plane.map((row, y) =>
			row.map((cell, z) => {
				const [charged, antiCharged] = countNeighbors(grid, x, y, z)
				return updateCell(cell, charged, antiCharged)
			})
		)
	)
	return newGrid
}

const QCAutomata = () => {
	const [grid, setGrid] = useState(() => initializeGrid())
	const [steps, setSteps] = useState(INITIAL_STEPS)
	const mountRef = useRef(null)
	const sceneRef = useRef(null)
	const cameraRef = useRef(null)
	const rendererRef = useRef(null)
	const controlsRef = useRef(null)
	const cubesRef = useRef([])

	useEffect(() => {
		// full screen
		const width = window.innerWidth
		const height = window.innerHeight

		// Scene setup
		const scene = new THREE.Scene()
		sceneRef.current = scene

		// Camera setup
		const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
		camera.position.z = 20
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
						color: cellColors[grid[x][y][z]],
						transparent: true,
						opacity: cellOpacity[grid[x][y][z]],
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

		// Animation loop
		const animate = () => {
			requestAnimationFrame(animate)
			controls.update()
			renderer.render(scene, camera)
		}
		animate()

		// Cleanup
		return () => {
			mountRef.current.removeChild(renderer.domElement)
		}
	}, [])

	useEffect(() => {
		// Update cube colors based on grid state
		let index = 0
		for (let x = 0; x < GRID_SIZE; x++) {
			for (let y = 0; y < GRID_SIZE; y++) {
				for (let z = 0; z < GRID_SIZE; z++) {
					cubesRef.current[index].material.color.setHex(
						cellColors[grid[x][y][z]]
					)
					cubesRef.current[index].material.opacity = cellOpacity[grid[x][y][z]]
					index++
				}
			}
		}
	}, [grid])

	const handleStep = () => {
		setGrid(simulateStep)
		setSteps(steps + 1)
	}

	const handleReset = () => {
		setGrid(initializeGrid())
		setSteps(INITIAL_STEPS)
	}

	return (
		<div className='w-full h-full'>
			<div className='p-4 z-10 relative text-gray-100'>
				<h1 className='text-2xl font-bold mb-4'>
					3D Quantum Cellular Automata Simulation
				</h1>
				<div className='mb-4'>
					<Button onClick={handleStep} className='mr-2'>
						Step
					</Button>
					<Button onClick={handleReset} variant='outline'>
						Reset
					</Button>
				</div>
				<div className='mb-4'>Steps: {steps}</div>
			</div>
			<div ref={mountRef}></div>
		</div>
	)
}

export default QCAutomata
