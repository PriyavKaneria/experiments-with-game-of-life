import { hydrate } from "react"
import QCAutomata from "./qcautomata"
import ConwaysGOL from "./conwaysgol"

if (typeof window !== "undefined") {
	hydrate(<ConwaysGOL />, document.getElementById("app"))
}
