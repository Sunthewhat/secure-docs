const CanvasArea = () => {
	return (
		<div className="flex-1 p-4">
			<div
				className="bg-white mx-auto shadow-lg border-2 border-gray-300 rounded-lg"
				style={{ width: "883px", height: "600px" }}>
				{/* Certificate Background */}
				<div className="w-full h-full bg-gray-50 flex items-center justify-center">
					<div className="text-gray-400 text-lg">Design Canvas</div>
				</div>
			</div>
		</div>
	);
};

export default CanvasArea;
