import { usingBasePath } from "./utils"

const Home: React.FC = () => {
	return (
		<div className='p-4 font-serif text-gray-100 bg-black w-screen h-screen'>
			<h1 className='text-6xl font-bold'>
				<img
					src={usingBasePath("/assets/logo.jpeg")}
					alt='logo'
					className='h-16 w-16 inline-block mr-4 mb-3'
				/>
				Index
			</h1>
			<ul className='pl-5 list-disc list-outside [&_ul]:list-[revert]'>
				<li className='mb-6 mt-4'>
					<p className='text-5xl font-semibold'>2D</p>
					<ul className='pl-5 text-2xl'>
						<li className='my-3'>
							<a href={usingBasePath("/conwaysgol2D")}>
								Conway's Game of Life 2D
							</a>
						</li>
						<li className='my-3'>
							<a href={usingBasePath("/conwaysgol2D-wasm")}>
								Conway's Game of Life 2D [Using Rust + WASM (WebAssembly)]
							</a>
						</li>
						<li className='my-3'>
							<a href={usingBasePath("/isometricgol2D")}>
								Game of Life in Isometric 2D Grid
							</a>
						</li>
					</ul>
				</li>
				<li className='my-6'>
					<p className='text-5xl font-semibold'>3D</p>
					<ul className='pl-5 text-2xl'>
						<li className='my-3'>
							<a href={usingBasePath("/conwaysgol3D")}>
								Conway's Game of Life 3D
							</a>
						</li>
						<li className='my-3'>
							<a href={usingBasePath("/qcautomata")}>
								Quantum Computing Automata
							</a>
						</li>
					</ul>
				</li>
			</ul>
		</div>
	)
}

export default Home
