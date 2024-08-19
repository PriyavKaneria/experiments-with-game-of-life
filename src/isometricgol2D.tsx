import React, { ChangeEvent, useEffect, useRef, useState } from "react"
import anime from "animejs"
import Button from "./components/button"
import { usingBasePath } from "./utils"

const CELL_WIDTH = 20
const CELL_HEIGHT = 15

const defaultWindowHeight = 950

const defaultGridSize = Math.floor((defaultWindowHeight - 100) / CELL_HEIGHT)

interface Cell {
	x: number
	y: number
	isAlive: boolean
}

const IsometricConwaysGOL2D: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const gridRef = useRef<Cell[]>([])
	const [isPlaying, setIsPlaying] = useState(false)
	const animationRef = useRef<anime.AnimeInstance | null>(null)
	const [isPaintEnabled, setIsPaintEnabled] = useState(true)
	const isMouseDownRef = useRef(false)
	const previousPlayingStateRef = useRef(false)
	const [brushSize, setBrushSize] = useState(1)

	const [gridSize, setGridSize] = useState(defaultGridSize)

	useEffect(() => {
		const handleResize = () => {
			const newGridSize = Math.floor((window.innerHeight - 100) / CELL_HEIGHT)
			setGridSize(window ? newGridSize : defaultGridSize)
		}
		window.addEventListener("resize", handleResize)
		return () => {
			window.removeEventListener("resize", handleResize)
		}
	}, [])

	useEffect(() => {
		if (canvasRef.current) {
			initializeGrid()
			drawGrid()
		}
	}, [gridSize])

	useEffect(() => {
		if (isPlaying) {
			startAnimation()
		} else {
			stopAnimation()
		}
	}, [isPlaying])

	const initializeGrid = () => {
		const newGrid: Cell[] = []
		for (let y = 0; y < gridSize; y++) {
			for (let x = 0; x < gridSize; x++) {
				newGrid.push({
					x,
					y,
					isAlive: Math.random() < 0.3,
				})
			}
		}
		gridRef.current = newGrid
	}

	const drawGrid = () => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext("2d")
		if (!ctx) return

		ctx.clearRect(0, 0, canvas.width, canvas.height)

		gridRef.current.forEach((cell) => {
			const { x, y, isAlive } = cell
			const isoX = ((x - y) * CELL_WIDTH) / 2 + canvas.width / 2
			const isoY = ((x + y) * CELL_HEIGHT) / 2

			ctx.beginPath()
			ctx.moveTo(isoX, isoY)
			ctx.lineTo(isoX + CELL_WIDTH / 2, isoY + CELL_HEIGHT / 2)
			ctx.lineTo(isoX, isoY + CELL_HEIGHT)
			ctx.lineTo(isoX - CELL_WIDTH / 2, isoY + CELL_HEIGHT / 2)
			ctx.closePath()

			ctx.fillStyle = isAlive ? "white" : "black"
			ctx.fill()

			ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"
			ctx.stroke()
		})
	}

	const getNeighbors = (x: number, y: number): Cell[] => {
		const neighbors: Cell[] = []
		const directions = [
			{ dx: -1, dy: -1 },
			{ dx: 0, dy: -1 },
			{ dx: 1, dy: -1 },
			{ dx: -1, dy: 0 },
			{ dx: 1, dy: 0 },
			{ dx: -1, dy: 1 },
			{ dx: 0, dy: 1 },
			{ dx: 1, dy: 1 },
		]

		directions.forEach(({ dx, dy }) => {
			const newX = (x + dx + gridSize) % gridSize
			const newY = (y + dy + gridSize) % gridSize
			const index = newY * gridSize + newX
			neighbors.push(gridRef.current[index])
		})

		return neighbors
	}

	const simulateStep = () => {
		const newGrid = gridRef.current.map((cell) => {
			const neighbors = getNeighbors(cell.x, cell.y)
			const aliveNeighbors = neighbors.filter((n) => n.isAlive).length

			let newState = cell.isAlive

			if (cell.isAlive) {
				newState = aliveNeighbors >= 2 && aliveNeighbors <= 3
			} else {
				newState = aliveNeighbors === 3
			}

			return { ...cell, isAlive: newState }
		})

		gridRef.current = newGrid
	}

	const startAnimation = () => {
		stopAnimation()
		animationRef.current = anime({
			duration: Infinity,
			update: () => {
				simulateStep()
				drawGrid()
			},
			easing: "linear",
		})
	}

	const stopAnimation = () => {
		if (animationRef.current) {
			animationRef.current.pause()
		}
	}
	const handleMouseDown = (e: MouseEvent) => {
		if (!isPaintEnabled) return
		isMouseDownRef.current = true
		previousPlayingStateRef.current = isPlaying
		setIsPlaying(false)
		paintCell(e)
	}

	const handleMouseUp = () => {
		if (!isPaintEnabled) return
		isMouseDownRef.current = false
		setIsPlaying(previousPlayingStateRef.current)
	}

	const handleMouseMove = (e: MouseEvent) => {
		if (!isPaintEnabled || !isMouseDownRef.current) return
		paintCell(e)
	}

	const paintCell = (e: MouseEvent) => {
		const canvas = canvasRef.current
		if (!canvas) return

		const rect = canvas.getBoundingClientRect()
		const mouseX = e.clientX - rect.left
		const mouseY = e.clientY - rect.top

		// Convert mouse coordinates to isometric grid coordinates
		let a = (2 * mouseX) / CELL_WIDTH
		let b = (2 * mouseY) / CELL_HEIGHT
		let gs = gridSize

		// Eq 1
		// x^2 + y^2 = 2 * ((a - gs)^2 + b^2)

		// Eq 2
		// x^2 + (2gs - y)^2 = 2 * (a^2 + (b - gs)^2)

		// Result values
		// x = ((b + a) - gs) / 2
		// y = ((b - a) + gs) / 2

		let x = Math.floor((b + a - gs) / 2)
		let y = Math.floor((b - a + gs) / 2)

		// Round to the nearest grid cell
		const gridX = Math.floor(x)
		const gridY = Math.floor(y)

		// Ensure we're within grid bounds
		if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
			const index = gridY * gridSize + gridX
			gridRef.current[index].isAlive = true
			drawGrid()
		}
	}

	const togglePaintEnabled = () => {
		setIsPaintEnabled(!isPaintEnabled)
	}

	const handleStep = () => {
		simulateStep()
		drawGrid()
	}

	const handleReset = () => {
		initializeGrid()
		drawGrid()
	}

	const handleBrushSizeChange = (e: ChangeEvent) => {
		setBrushSize(Number((e.target as any).value))
	}

	const handleClear = () => {
		gridRef.current = gridRef.current.map((cell) => ({
			...cell,
			isAlive: false,
		}))
		drawGrid()
	}

	const handlePlayPause = () => {
		setIsPlaying(!isPlaying)
	}

	return (
		<div className='w-full h-full overflow-hidden'>
			<div className='m-4 p-4 z-10 relative text-gray-100 bg-opacity-75 bg-black w-max select-none pointer-events-none'>
				<h1 className='text-2xl font-bold inline-block mb-2'>
					<a
						href={usingBasePath("/")}
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
					Game of Life in Isometric 2D Grid
				</h1>
				<h3 className='text-lg font-bold mb-2'>Rules:</h3>
				<p className='mb-2 max-w-5xl'>
					The rules are based on the original Game of Life rules. The rules are
					as follows
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
				<div className='mb-4 pointer-events-auto w-max'>
					<Button onClick={handleStep} className='mr-2'>
						Step
					</Button>
					<Button onClick={handlePlayPause} className='mr-2'>
						{isPlaying ? "Pause" : "Play"}
					</Button>
					<Button
						onClick={handleReset}
						className='px-4 py-2 mr-2 bg-gray-500 text-white rounded'>
						Randomize
					</Button>
					<Button
						onClick={handleClear}
						className='px-4 py-2 bg-red-500 text-white rounded'>
						Clear
					</Button>
				</div>
				<div className='flex items-center mb-4 pointer-events-auto w-max'>
					<label className='inline-flex mr-2 items-center cursor-pointer'>
						<input
							type='checkbox'
							checked={isPaintEnabled}
							onChange={togglePaintEnabled}
							className='sr-only peer'
						/>
						<div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
						<span className='ml-3 text-sm font-medium text-gray-100'>
							Mouse Painting
						</span>
					</label>
					<div className='flex items-center ml-4'>
						<label
							htmlFor='brushSize'
							className='mr-2 text-sm font-medium text-gray-100'>
							Brush Size: {brushSize}
						</label>
						<input
							type='range'
							id='brushSize'
							min='1'
							max='10'
							value={brushSize}
							onChange={handleBrushSizeChange}
							className='w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700'
						/>
					</div>
				</div>
			</div>
			<canvas
				ref={canvasRef}
				width={gridSize * CELL_WIDTH}
				height={gridSize * CELL_HEIGHT}
				style={{
					background: "black",
					position: "absolute",
					top: 0,
					right: 0,
					zIndex: 0,
					marginTop: "50px",
					marginBottom: "50px",
				}}
				onMouseDown={handleMouseDown}
				onMouseUp={handleMouseUp}
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseUp}
			/>
		</div>
	)
}

export default IsometricConwaysGOL2D
