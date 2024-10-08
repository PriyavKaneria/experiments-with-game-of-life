import React, { useEffect, useRef, useState } from "react"
import init, { Universe } from "conwaysgol2d-wasm"
import Button from "./components/button"
import { usingBasePath } from "./utils"

const CELL_SIZE = 5

const ConwaysGOL2DWASM: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const universeRef = useRef<Universe | null>(null)
	const wasmRef = useRef<any>(null)
	const [isPlaying, setIsPlaying] = useState(false)
	const [brushSize, setBrushSize] = useState(1)
	const animationIdRef = useRef<number | null>(null)
	const isMouseDownRef = useRef(false)
	const wasPlayingRef = useRef(false)

	const [grid_size_x, setGridSizeX] = useState(1920)
	const [grid_size_y, setGridSizeY] = useState(950)

	useEffect(() => {
		const handleResize = () => {
			setGridSizeX(window ? window.innerWidth : 1920)
			setGridSizeY(window ? window.innerHeight : 950)
		}
		window.addEventListener("resize", handleResize)
		return () => {
			window.removeEventListener("resize", handleResize)
		}
	}, [])

	useEffect(() => {
		const initializeWasm = async () => {
			console.log(init)

			wasmRef.current = await init()
			const universeInstance = Universe.new(
				Number(grid_size_x / CELL_SIZE),
				Number(grid_size_y / CELL_SIZE)
			)
			universeRef.current = universeInstance
			drawGrid()
		}
		initializeWasm()
	}, [grid_size_x, grid_size_y])

	useEffect(() => {
		if (isPlaying) {
			startAnimation()
		} else {
			stopAnimation()
		}
	}, [isPlaying])

	const drawGrid = () => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext("2d")
		if (!ctx) return

		canvas.height = universeRef.current.height() * CELL_SIZE
		canvas.width = universeRef.current.width() * CELL_SIZE

		ctx.beginPath()
		ctx.fillStyle = "black"
		ctx.fillRect(0, 0, canvas.width, canvas.height)

		const cellsPtr = universeRef.current.cells()
		const cells = new Uint8Array(
			wasmRef.current.memory.buffer,
			cellsPtr,
			universeRef.current.width() * universeRef.current.height()
		)

		ctx.fillStyle = "white"
		for (let row = 0; row < universeRef.current.height(); row++) {
			for (let col = 0; col < universeRef.current.width(); col++) {
				const idx = row * universeRef.current.width() + col
				if (cells[idx] !== 0) {
					ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE)
				}
			}
		}

		ctx.stroke()
	}

	const simulateStep = () => {
		if (universeRef.current) {
			universeRef.current.simulate_step()
			drawGrid()
		}
	}

	const startAnimation = () => {
		stopAnimation()
		const renderLoop = () => {
			if (universeRef.current && universeRef.current.is_playing()) {
				universeRef.current.simulate_step()
				drawGrid()
				animationIdRef.current = requestAnimationFrame(renderLoop)
			}
		}
		animationIdRef.current = requestAnimationFrame(renderLoop)
	}

	const stopAnimation = () => {
		if (animationIdRef.current !== null) {
			cancelAnimationFrame(animationIdRef.current)
			animationIdRef.current = null
		}
	}

	const handleStep = () => {
		simulateStep()
	}

	const handleReset = () => {
		if (universeRef.current) {
			universeRef.current.randomize()
			drawGrid()
		}
	}

	const handleClear = () => {
		if (universeRef.current) {
			universeRef.current.clear()
			drawGrid()
		}
	}

	const handlePlayPause = () => {
		if (universeRef.current) {
			if (isPlaying) {
				universeRef.current.pause()
			} else {
				universeRef.current.play()
				startAnimation()
			}
			setIsPlaying(!isPlaying)
		}
	}

	const handleMouseDown = (e: MouseEvent) => {
		if (universeRef.current) {
			isMouseDownRef.current = true
			wasPlayingRef.current = universeRef.current.is_playing()
			universeRef.current.pause()
			setIsPlaying(false)
			paintCell(e)
		}
	}

	const handleMouseUp = () => {
		if (universeRef.current) {
			if (isMouseDownRef.current && wasPlayingRef.current) {
				universeRef.current.play()
				setIsPlaying(true)
			}
			isMouseDownRef.current = false
		}
	}

	const handleMouseMove = (e: MouseEvent) => {
		if (universeRef.current && isMouseDownRef.current) {
			paintCell(e)
		}
	}

	const paintCell = (e: MouseEvent) => {
		const canvas = canvasRef.current
		if (!canvas || !universeRef.current) return

		const rect = canvas.getBoundingClientRect()
		const scaleX = canvas.width / rect.width
		const scaleY = canvas.height / rect.height

		const canvasLeft = (e.clientX - rect.left) * scaleX
		const canvasTop = (e.clientY - rect.top) * scaleY

		const row = Math.min(
			Math.floor(canvasTop / CELL_SIZE),
			universeRef.current.height() - 1
		)
		const col = Math.min(
			Math.floor(canvasLeft / CELL_SIZE),
			universeRef.current.width() - 1
		)

		universeRef.current.paint_cell(row, col, brushSize)
		drawGrid()
	}

	const handleBrushSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setBrushSize(Number((e.target as any).value))
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
					2D Conway's Game of Life (Made using Rust + WASM - WebAssembly)
				</h1>
				<h3 className='text-lg font-bold mb-2'>Rules:</h3>
				<p className='mb-2 max-w-5xl'>
					You can find the source code for the Rust and Wasm build here -
					<a
						href='https://github.com/PriyavKaneria/Conways-Game-of-Life-using-Rust-WASM'
						target='_blank'
						rel='noreferrer noopener'
						className='underline pointer-events-auto'>
						{" "}
						here
					</a>
				</p>
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
				width={grid_size_x}
				height={grid_size_y}
				style={{
					background: "black",
					position: "absolute",
					top: 0,
					left: 0,
					zIndex: 0,
				}}
				onMouseDown={handleMouseDown}
				onMouseUp={handleMouseUp}
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseUp}
			/>
		</div>
	)
}

export default ConwaysGOL2DWASM
