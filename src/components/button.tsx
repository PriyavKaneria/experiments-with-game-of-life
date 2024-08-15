const Button = ({
	children,
	onClick = () => {},
	className = "",
	variant = "",
}) => {
	const variantClass = variant === "outline" ? "border border-blue-500" : ""
	return (
		<button
			onClick={onClick}
			className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${className} ${variantClass}`}>
			{children}
		</button>
	)
}

export default Button
