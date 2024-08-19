import {
	LocationProvider,
	ErrorBoundary,
	hydrate,
	prerender as ssr,
	Router,
} from "preact-iso"
// import { createHashHistory } from "history"
import QCAutomata from "./qcautomata"
import ConwaysGOL3D from "./conwaysgol3D"
import ConwaysGOL2D from "./conwaysgol2D"
import ConwaysGOL2DWASM from "./conwaysgol2D-wasm"
import IsometricConwaysGOL from "./isometricgol"
import Home from "./home"
import "./styles/style.css"
import { usingBasePath } from "./utils"

const App = () => {
	return (
		<LocationProvider>
			<ErrorBoundary>
				<Router
				// history={createHashHistory()}
				>
					<Home path={usingBasePath("/")} />
					<ConwaysGOL2D path={usingBasePath("/conwaysgol2D")} />
					<ConwaysGOL2DWASM path={usingBasePath("/conwaysgol2D-wasm")} />
					<IsometricConwaysGOL path={usingBasePath("/isometricgol")} />
					<ConwaysGOL3D path={usingBasePath("/conwaysgol3D")} />
					<QCAutomata path={usingBasePath("/qcautomata")} />
				</Router>
			</ErrorBoundary>
		</LocationProvider>
	)
}

if (typeof window !== "undefined") {
	hydrate(<App />, document.getElementById("app"))
}

export async function prerender(data) {
	return await ssr(<App {...data} />)
}
