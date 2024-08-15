import { useState, useEffect, useRef, hydrate } from "react"
import "./style.css"
import Button from "./components/button"
import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import useInterval from "./components/useInterval"

const GRID_SIZE = 20
const SURVIVAL = "4"
const BIRTH = "4"
const STATES = 5

// Using Moore neighborhood by default

const cellColors = {
	0: [0, 0, 0], // dead (black)
	1: [146, 100, 74], // alive (white)
}

const cellOpacities = {
	0: 0,
	1: 0.6,
}
const FADE_OPACITY_WITH_STATE = true
const FADE_STEP = 0.1

const ConwaysGOL = () => {
	const states = useRef(STATES)
	const survival = useRef(SURVIVAL)
	const birth = useRef(BIRTH)

	const initializeGrid = () => {
		return Array(GRID_SIZE)
			.fill(0)
			.map((_, i) =>
				Array(GRID_SIZE)
					.fill(0)
					.map(
						(_, j) =>
							Array(GRID_SIZE)
								.fill(0)
								.map((_, k) => {
									if (
										[
											"10,10,10",
											"10,10,11",
											"10,11,10",
											"10,11,11",
											"11,10,10",
											"11,10,11",
											"11,11,10",
											"11,11,11",
										].includes(`${i},${j},${k}`)
										// 9 <= i &&
										// i <= 12 &&
										// 9 <= j &&
										// j <= 12 &&
										// 9 <= k &&
										// k <= 12
									)
										return states.current
									return 0
								})
						// .map((_, k) => {
						// 	// low density and only either states or 0
						// 	if (Math.random() < 0.1) {
						// 		return states
						// 	}
						// 	return 0
						// })
					)
			)
	}

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
						color: getColor(grid.current[x][y][z]),
						transparent: true,
						opacity: getCellOpacity(grid.current[x][y][z]),
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

	function isNumberInSet(number: number, str: string) {
		const segments = str.split(",")

		for (let segment of segments) {
			if (segment.includes("-")) {
				const [start, end] = segment.split("-").map(Number)
				if (number >= start && number <= end) {
					return true
				}
			} else if (Number(segment) === number) {
				return true
			}
		}

		return false
	}

	const simulateStep = (grid: any[]) => {
		const newGrid = grid.map((plane: any[], x: any) =>
			plane.map((row: any[], y: any) =>
				row.map((cell: number, z: any) => {
					// if dying let it die
					if (cell < STATES && cell > 0) {
						return cell - 1
					}
					// dead or alive
					const [alive] = countNeighbors(grid, x, y, z)
					return updateCell(cell, alive)
				})
			)
		)
		return newGrid
	}

	const countNeighbors = (grid: any[], x: number, y: number, z: number) => {
		let alive = 0
		for (let dx = -1; dx <= 1; dx++) {
			for (let dy = -1; dy <= 1; dy++) {
				for (let dz = -1; dz <= 1; dz++) {
					if (dx === 0 && dy === 0 && dz === 0) continue
					let nx = x + dx,
						ny = y + dy,
						nz = z + dz
					// wrap around
					if (nx < 0) nx += GRID_SIZE
					if (nx >= GRID_SIZE) nx -= GRID_SIZE
					if (ny < 0) ny += GRID_SIZE
					if (ny >= GRID_SIZE) ny -= GRID_SIZE
					if (nz < 0) nz += GRID_SIZE
					if (nz >= GRID_SIZE) nz -= GRID_SIZE
					// below if is guaranteed but kept for clarity
					if (
						nx >= 0 &&
						nx < GRID_SIZE &&
						ny >= 0 &&
						ny < GRID_SIZE &&
						nz >= 0 &&
						nz < GRID_SIZE
					) {
						if (grid[nx][ny][nz] === states.current) alive++
					}
				}
			}
		}
		return [alive]
	}

	const updateCell = (cell: number, alive: number) => {
		// alive
		if (cell === states.current) {
			// Parse survival rule
			if (isNumberInSet(alive, survival.current)) return states.current // survive
			return states.current - 1 // underpopulation or overpopulation
		}
		// dead
		else {
			// Parse birth rule
			if (isNumberInSet(alive, birth.current)) return states.current // birth
			return 0 // stay dead
		}
	}

	const updateGridColors = () => {
		// Update cube colors based on grid state
		let index = 0
		for (let x = 0; x < GRID_SIZE; x++) {
			for (let y = 0; y < GRID_SIZE; y++) {
				for (let z = 0; z < GRID_SIZE; z++) {
					cubesRef.current[index].material.color.set(
						getColor(grid.current[x][y][z])
					)
					cubesRef.current[index].material.opacity = getCellOpacity(
						grid.current[x][y][z]
					)
					index++
				}
			}
		}
	}

	const getCellOpacity = (cell: number) => {
		let cellOpacity = 0
		// alive
		if (cell == states.current) {
			cellOpacity = cellOpacities[1]
		}
		// dead
		else if (cell == 0) {
			cellOpacity = cellOpacities[0]
		}
		// dying with fade
		else if (FADE_OPACITY_WITH_STATE) {
			cellOpacity = cell * FADE_STEP
		}
		// dying
		else {
			cellOpacity = 1
		}
		return cellOpacity
	}

	const getColor = (cell: number) => {
		const cellColor = cellColors[cell > 0 ? 1 : 0]
		const hslString = `hsl(${cellColor[0]}, ${cellColor[1]}%, ${cellColor[2]}%)`
		// change hue if cell is dying
		if (cell < states.current) {
			return `hsl(${(cellColor[0] + 20 * cell) % 360}, ${cellColor[1]}%, ${
				cellColor[2]
			}%)`
		}
		return hslString
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

	// useInterval(
	// 	() => {
	// 		playing && handleStep()
	// 	},
	// 	30,
	// 	0
	// )

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
					3D Cellular Automata (Conway's Game of Life) Simulation
				</h1>
				<h3 className='text-lg font-bold mb-4'>Rules:</h3>
				<p className='mb-4 max-w-5xl'>
					The rules are based on the original Game of Life rules with some
					modifications. The rules are as follows
				</p>
				<ul className='list-disc list-inside mb-4'>
					<li>
						Any live cell with fewer than two live neighbors dies, as if by
						underpopulation.
					</li>
					<li>
						Any live cell with two or three live neighbors lives on to the next
						generation.
					</li>
					<li>
						Any live cell with more than three live neighbors dies, as if by
						overpopulation.
					</li>
					<li>
						Any dead cell with exactly three live neighbors becomes a live cell,
						as if by reproduction.
					</li>
				</ul>
				<div className='mb-4 pointer-events-auto'>
					<Button onClick={handleStep} className='mr-2'>
						Step
					</Button>
					<Button onClick={handleReset} className='mr-2' variant='outline'>
						Reset
					</Button>
					<Button onClick={handlePlay} className='mr-2'>
						Play
					</Button>
					<Button onClick={handlePause} variant='outline'>
						Pause
					</Button>
				</div>
				<div className='mb-4 pointer-events-auto'>
					{/* Labels and inputs for settings config */}
					<label htmlFor='survival' className='mr-2'>
						Survival
					</label>
					<input
						type='text'
						id='survival'
						name='survival'
						className='text-black mr-3 px-2 w-24'
						defaultValue={survival.current}
						onChange={(e) => {
							survival.current = (e.target as any).value
						}}
					/>
					<label htmlFor='birth' className='mr-2'>
						Birth
					</label>
					<input
						type='text'
						id='birth'
						name='birth'
						className='text-black mr-3 px-2 w-24'
						defaultValue={birth.current}
						onChange={(e) => {
							birth.current = (e.target as any).value
						}}
					/>
					<label htmlFor='states' className='mr-2'>
						States
					</label>
					<input
						type='number'
						id='states'
						name='states'
						className='text-black mr-3 px-2 w-24'
						defaultValue={states.current.toString()}
						onChange={(e) => {
							states.current = Number((e.target as any).value)
						}}
					/>
				</div>
				<div className='mb-4'>Steps: {steps.current}</div>
			</div>
			<div ref={mountRef}></div>
		</div>
	)
}

export default ConwaysGOL
