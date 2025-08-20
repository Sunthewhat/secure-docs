import * as fabric from "fabric";

interface ElementUpdate {
	fill?: string;
	stroke?: string;
	fontSize?: number;
	fontWeight?: "normal" | "bold";
	fontStyle?: "normal" | "italic";
	text?: string;
	id?: string;
}

interface PropertiesPanelProps {
	selectedElement: fabric.Object | null;
	onUpdateElement: (updates: ElementUpdate) => void;
	onDeleteElement: () => void;
}

const PropertiesPanel = ({
	selectedElement,
	onUpdateElement,
	onDeleteElement,
}: PropertiesPanelProps) => {
	if (!selectedElement) {
		return (
			<div
				className="bg-white border border-gray-300 rounded-lg p-4 mb-4 shadow-sm mx-auto"
				style={{ width: "883px", height: "60px" }}>
				<div className="text-sm text-gray-500 text-center">
					Select an element to edit its properties
				</div>
			</div>
		);
	}

	const isText =
		selectedElement instanceof fabric.Textbox ||
		selectedElement instanceof fabric.Text;
	const isAnchor = selectedElement.get("isAnchor") === true;

	const handleColorChange = (color: string) => {
		const isLine = selectedElement instanceof fabric.Line;
		if (isLine) {
			onUpdateElement({ stroke: color });
		} else {
			onUpdateElement({ fill: color });
		}
	};

	const handleFontSizeChange = (fontSize: number) => {
		if (fontSize >= 8 && fontSize <= 72) {
			onUpdateElement({ fontSize });
		}
	};

	const handleBoldToggle = () => {
		const currentWeight =
			(selectedElement.get("fontWeight") as string) || "normal";
		const newWeight = currentWeight === "bold" ? "normal" : "bold";
		onUpdateElement({ fontWeight: newWeight });
	};

	const handleItalicToggle = () => {
		const currentStyle =
			(selectedElement.get("fontStyle") as string) || "normal";
		const newStyle = currentStyle === "italic" ? "normal" : "italic";
		onUpdateElement({ fontStyle: newStyle });
	};

	const handleFieldNameChange = (fieldName: string) => {
		console.log(fieldName);

		onUpdateElement({
			text: fieldName,
			id: `PLACEHOLDER-${fieldName}`,
		});
	};

	const isLine = selectedElement instanceof fabric.Line;
	const currentColor =
		((isLine
			? selectedElement.get("stroke")
			: selectedElement.get("fill")) as string) || "#000000";
	const currentFontSize = Math.round(
		(selectedElement.get("fontSize") as number) || 16
	);
	const isBold = (selectedElement.get("fontWeight") as string) === "bold";
	const isItalic = (selectedElement.get("fontStyle") as string) === "italic";
	const currentDbField = (selectedElement.get("text") as string) || "";

	return (
		<div
			className="bg-white border border-gray-300 rounded-lg p-4 mb-4 shadow-sm mx-auto flex items-center justify-between"
			style={{ width: "883px", height: "60px" }}>
			{/* Left side controls */}
			<div className="flex items-center gap-6">
				{/* Color Picker */}
				<div className="flex items-center gap-3">
					<label className="text-sm font-medium">Color:</label>
					<input
						type="color"
						value={currentColor}
						onChange={(e) => handleColorChange(e.target.value)}
						className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
					/>
					<span className="text-xs text-gray-600">
						{currentColor}
					</span>
				</div>

				{/* Anchor Properties */}
				{isAnchor && (
					<div className="flex items-center gap-3">
						<label className="text-sm font-medium">
							Field name:
						</label>
						<input
							type="text"
							value={currentDbField}
							onChange={(e) =>
								handleFieldNameChange(e.target.value)
							}
							placeholder="e.g., name, course, date"
							className="px-2 py-1 border border-gray-300 rounded text-sm w-32"
						/>
					</div>
				)}

				{/* Text Properties */}
				{isText && !isAnchor && (
					<>
						{/* Font Size */}
						<div className="flex items-center gap-3">
							<label className="text-sm font-medium">Size:</label>
							<select
								value={currentFontSize}
								onChange={(e) =>
									handleFontSizeChange(
										parseInt(e.target.value)
									)
								}
								className="px-2 py-1 border border-gray-300 rounded text-sm bg-white">
								<option value={8}>8px</option>
								<option value={10}>10px</option>
								<option value={12}>12px</option>
								<option value={14}>14px</option>
								<option value={16}>16px</option>
								<option value={18}>18px</option>
								<option value={20}>20px</option>
								<option value={24}>24px</option>
								<option value={28}>28px</option>
								<option value={32}>32px</option>
								<option value={36}>36px</option>
								<option value={48}>48px</option>
								<option value={60}>60px</option>
								<option value={72}>72px</option>
							</select>
						</div>

						{/* Text Style Buttons */}
						<div className="flex items-center gap-2">
							<button
								onClick={handleBoldToggle}
								className={`px-3 py-1 text-sm font-bold border rounded ${
									isBold
										? "bg-blue-500 text-white border-blue-500"
										: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
								}`}>
								B
							</button>
							<button
								onClick={handleItalicToggle}
								className={`px-3 py-1 text-sm italic border rounded ${
									isItalic
										? "bg-blue-500 text-white border-blue-500"
										: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
								}`}>
								I
							</button>
						</div>
					</>
				)}

				{/* Font size for anchors */}
				{isAnchor && (
					<div className="flex items-center gap-3">
						<label className="text-sm font-medium">Size:</label>
						<select
							value={currentFontSize}
							onChange={(e) =>
								handleFontSizeChange(parseInt(e.target.value))
							}
							className="px-2 py-1 border border-gray-300 rounded text-sm bg-white">
							<option value={8}>8px</option>
							<option value={10}>10px</option>
							<option value={12}>12px</option>
							<option value={14}>14px</option>
							<option value={16}>16px</option>
							<option value={18}>18px</option>
							<option value={20}>20px</option>
							<option value={24}>24px</option>
							<option value={28}>28px</option>
							<option value={32}>32px</option>
							<option value={36}>36px</option>
							<option value={48}>48px</option>
							<option value={60}>60px</option>
							<option value={72}>72px</option>
						</select>
					</div>
				)}
			</div>

			{/* Right side - Delete Button */}
			<div className="flex items-center">
				<button
					onClick={onDeleteElement}
					className="px-3 py-1 text-sm bg-red-500 text-white border border-red-500 rounded hover:bg-red-600 transition-colors">
					Delete
				</button>
			</div>
		</div>
	);
};

export default PropertiesPanel;
