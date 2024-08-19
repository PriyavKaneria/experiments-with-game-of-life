export const usingBasePath = (path) => {
	const APP_BASE = import.meta.env.BASE_URL.replace(/\/$/, "")
	return APP_BASE + path
}
