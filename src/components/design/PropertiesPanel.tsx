import * as fabric from "fabric";
import { useState, useRef } from "react";
import PositionModal from "./PositionModal";
import AlignLeftIcon from "@/asset/design/tools/align-left.svg";
import AlignCenterIcon from "@/asset/design/tools/align-center.svg";
import AlignRightIcon from "@/asset/design/tools/align-right.svg";

interface ElementUpdate {
	fill?: string;
	stroke?: string;
	strokeWidth?: number;
	fontSize?: number;
	fontWeight?: "normal" | "bold";
	fontStyle?: "normal" | "italic";
	fontFamily?: string;
	underline?: boolean;
	textAlign?: "left" | "center" | "right";
	text?: string;
	id?: string;
}

interface PropertiesPanelProps {
	selectedElement: fabric.Object | null;
	onUpdateElement: (updates: ElementUpdate) => void;
	onBringForward?: () => void;
	onSendBackward?: () => void;
	onBringToFront?: () => void;
	onSendToBack?: () => void;
}

const PropertiesPanel = ({
	selectedElement,
	onUpdateElement,
	onBringForward,
	onSendBackward,
	onBringToFront,
	onSendToBack,
}: PropertiesPanelProps) => {
	const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
	const [isAlignDropdownOpen, setIsAlignDropdownOpen] = useState(false);
	const positionButtonRef = useRef<HTMLButtonElement>(null);
	const alignButtonRef = useRef<HTMLButtonElement>(null);

	// Don't show properties panel if no element is selected
	if (!selectedElement) {
		return (
			<div
				className="bg-designcanvas_background border border-gray-300 rounded-full p-4 mb-4 shadow-sm mx-auto"
				style={{ width: "854px", height: "60px" }}>
				<div className="text-base text-white text-center">
					Select an element to edit its properties
				</div>
			</div>
		);
	}

	const isText = selectedElement instanceof fabric.Textbox;
	const isAnchor = selectedElement.get("isAnchor") === true;
	const isQRanchor = selectedElement.get("isQRanchor") === true;
	const isImage = selectedElement.type === "image";

	const handleColorChange = (color: string) => {
		const isLine = selectedElement instanceof fabric.Line;

		// Handle Groups (text anchors) differently than individual text objects
		if (selectedElement instanceof fabric.Group && isAnchor) {
			// For text anchors (Groups), update the text object within the group
			const textObject = selectedElement
				.getObjects()
				.find((obj) => obj instanceof fabric.Textbox) as fabric.Textbox;
			if (textObject) {
				textObject.set("fill", color);
				// Use onUpdateElement to trigger proper re-render
				onUpdateElement({ fill: color });
			}
		} else if (isLine) {
			onUpdateElement({ stroke: color });
		} else {
			onUpdateElement({ fill: color });
		}
	};

	const handleFontSizeChange = (fontSize: number) => {
		if (fontSize >= 8 && fontSize <= 72) {
			// Handle Groups (text anchors) differently than individual text objects
			if (selectedElement instanceof fabric.Group && isAnchor) {
				// For text anchors (Groups), update the text object within the group
				const textObject = selectedElement
					.getObjects()
					.find(
						(obj) => obj instanceof fabric.Textbox
					) as fabric.Textbox;
				if (textObject) {
					textObject.set("fontSize", fontSize);
					// Use onUpdateElement to trigger proper re-render
					onUpdateElement({ fontSize });
				}
			} else {
				onUpdateElement({ fontSize });
			}
		}
	};

	const handleBoldToggle = () => {
		const currentWeight = getFontProperty("fontWeight", "normal");
		const newWeight = currentWeight === "bold" ? "normal" : "bold";

		// Handle Groups (text anchors) differently than individual text objects
		if (selectedElement instanceof fabric.Group && isAnchor) {
			// For text anchors (Groups), update the text object within the group
			const textObject = selectedElement
				.getObjects()
				.find((obj) => obj instanceof fabric.Textbox) as fabric.Textbox;
			if (textObject) {
				textObject.set("fontWeight", newWeight);
				// Use onUpdateElement to trigger proper re-render
				onUpdateElement({ fontWeight: newWeight });
			}
		} else {
			onUpdateElement({ fontWeight: newWeight });
		}
	};

	const handleItalicToggle = () => {
		const currentStyle = getFontProperty("fontStyle", "normal");
		const newStyle = currentStyle === "italic" ? "normal" : "italic";

		// Handle Groups (text anchors) differently than individual text objects
		if (selectedElement instanceof fabric.Group && isAnchor) {
			// For text anchors (Groups), update the text object within the group
			const textObject = selectedElement
				.getObjects()
				.find((obj) => obj instanceof fabric.Textbox) as fabric.Textbox;
			if (textObject) {
				textObject.set("fontStyle", newStyle);
				// Use onUpdateElement to trigger proper re-render
				onUpdateElement({ fontStyle: newStyle });
			}
		} else {
			onUpdateElement({ fontStyle: newStyle });
		}
	};

	const handleUnderlineToggle = () => {
		const currentUnderline = getFontProperty("underline", false);

		// Handle Groups (text anchors) differently than individual text objects
		if (selectedElement instanceof fabric.Group && isAnchor) {
			// For text anchors (Groups), update the text object within the group
			const textObject = selectedElement
				.getObjects()
				.find((obj) => obj instanceof fabric.Textbox) as fabric.Textbox;
			if (textObject) {
				textObject.set("underline", !currentUnderline);
				// Use onUpdateElement to trigger proper re-render
				onUpdateElement({ underline: !currentUnderline });
			}
		} else {
			onUpdateElement({ underline: !currentUnderline });
		}
	};

	const handleTextAlignChange = (alignment: "left" | "center" | "right") => {
		// Handle Groups (text anchors) differently than individual text objects
		if (selectedElement instanceof fabric.Group && isAnchor) {
			// For text anchors (Groups), update the text object within the group
			const textObject = selectedElement
				.getObjects()
				.find((obj) => obj instanceof fabric.Textbox) as fabric.Textbox;
			if (textObject) {
				textObject.set("textAlign", alignment);
				// Use onUpdateElement to trigger proper re-render
				onUpdateElement({ textAlign: alignment });
			}
		} else {
			onUpdateElement({ textAlign: alignment });
		}
		setIsAlignDropdownOpen(false);
	};

	const handleFontFamilyChange = (fontFamily: string) => {
		// Handle Groups (text anchors) differently than individual text objects
		if (selectedElement instanceof fabric.Group && isAnchor) {
			// For text anchors (Groups), update the text object within the group
			const textObject = selectedElement
				.getObjects()
				.find((obj) => obj instanceof fabric.Textbox) as fabric.Textbox;
			if (textObject) {
				textObject.set("fontFamily", fontFamily);
				// Use onUpdateElement to trigger proper re-render
				onUpdateElement({ fontFamily });
			}
		} else {
			onUpdateElement({ fontFamily });
		}
	};

	const handleBorderWidthChange = (strokeWidth: number) => {
		if (strokeWidth >= 0 && strokeWidth <= 50) {
			onUpdateElement({ strokeWidth });
		}
	};

	const handleBorderColorChange = (color: string) => {
		onUpdateElement({ stroke: color });
	};

	const handleFieldNameChange = (fieldName: string) => {
		console.log(fieldName);

		// Handle Groups (text anchors) differently than individual text objects
		if (selectedElement instanceof fabric.Group && isAnchor) {
			// For text anchors (Groups), update the text object within the group
			const textObject = selectedElement
				.getObjects()
				.find((obj) => obj instanceof fabric.Textbox) as fabric.Textbox;
			if (textObject) {
				textObject.set("text", fieldName);
				textObject.set("id", `PLACEHOLDER-${fieldName}`);
				selectedElement.set("id", `PLACEHOLDER-${fieldName}`);
				// Use onUpdateElement to trigger proper re-render
				onUpdateElement({
					id: `PLACEHOLDER-${fieldName}`,
				});
			}
		} else {
			// For individual text objects
			onUpdateElement({
				text: fieldName,
				id: `PLACEHOLDER-${fieldName}`,
			});
		}
	};

	const isLine = selectedElement instanceof fabric.Line;

	// Get current color - handle both individual elements and Groups (text anchors)
	const getCurrentColor = () => {
		if (selectedElement instanceof fabric.Group && isAnchor) {
			// For text anchors (Groups), find the text object within the group
			const textObject = selectedElement
				.getObjects()
				.find((obj) => obj instanceof fabric.Textbox);
			return textObject
				? (textObject.get("fill") as string) || "#000000"
				: "#000000";
		}
		return (
			((isLine
				? selectedElement.get("stroke")
				: selectedElement.get("fill")) as string) || "#000000"
		);
	};

	const currentColor = getCurrentColor();
	const currentStrokeWidth =
		(selectedElement.get("strokeWidth") as number) ?? 1;
	const currentBorderColor =
		(selectedElement.get("stroke") as string) || "#000000";
	// Get font properties - handle both individual text objects and Groups (text anchors)
	const getFontProperty = (property: string, defaultValue: any) => {
		if (selectedElement instanceof fabric.Group && isAnchor) {
			// For text anchors (Groups), find the text object within the group
			const textObject = selectedElement
				.getObjects()
				.find((obj) => obj instanceof fabric.Textbox);
			return textObject
				? textObject.get(property) || defaultValue
				: defaultValue;
		}
		return selectedElement.get(property) || defaultValue;
	};

	const currentFontSize = Math.round(getFontProperty("fontSize", 16));
	const isBold = getFontProperty("fontWeight", "normal") === "bold";
	const isItalic = getFontProperty("fontStyle", "normal") === "italic";
	const isUnderlined = getFontProperty("underline", false);
	const currentFontFamily = getFontProperty("fontFamily", "Arial");
	const currentTextAlign = getFontProperty("textAlign", "left") as
		| "left"
		| "center"
		| "right";

	// Get current text - handle both individual text objects and Groups (text anchors)
	const getCurrentText = () => {
		if (selectedElement instanceof fabric.Group && isAnchor) {
			// For text anchors (Groups), find the text object within the group
			const textObject = selectedElement
				.getObjects()
				.find((obj) => obj instanceof fabric.Textbox);
			return textObject ? (textObject.get("text") as string) || "" : "";
		}
		return (selectedElement.get("text") as string) || "";
	};
	const currentDbField = getCurrentText();

	return (
		<>
			<div className="bg-designcanvas_background border border-gray-300 w-[854px] h-[60px] rounded-full px-10 mb-4 shadow-sm mx-auto flex items-center justify-between">
				{/* Left side controls */}
				<div className="flex items-center gap-4">
					{/* QR Anchor Properties */}
					{isQRanchor && (
						<div className="flex items-center gap-3">
							<span className="text-base font-medium text-white">
								QR Code Anchor (move only)
							</span>
						</div>
					)}

					{/* Image Properties */}
					{isImage && (
						<div className="flex items-center gap-3">
							<span className="text-base font-medium text-white">
								Image selected
							</span>
						</div>
					)}
					{/* Color Picker - Not for images or QR anchors */}
					{!isImage && !isQRanchor && (
						<div className="flex items-center gap-1">
							<label className="text-sm font-medium">
								Color:
							</label>
							<input
								type="color"
								value={currentColor}
								onChange={(e) =>
									handleColorChange(e.target.value)
								}
								className="w-8 h-8 rounded cursor-pointer"
							/>
						</div>
					)}

					{/* Border Width - For lines and shapes with strokes */}
					{!isLine &&
						selectedElement.get("stroke") &&
						!isText &&
						!isImage &&
						!isQRanchor && (
							<div className="flex items-center gap-3">
								<label className="text-sm font-medium">
									Border:
								</label>
								<select
									value={currentStrokeWidth}
									onChange={(e) =>
										handleBorderWidthChange(
											parseInt(e.target.value)
										)
									}
									className="px-3 py-1 border border-gray-300 rounded-2xl text-sm bg-designcanvas_background">
									<option value={0}>0px</option>
									<option value={1}>1px</option>
									<option value={2}>2px</option>
									<option value={3}>3px</option>
									<option value={4}>4px</option>
									<option value={5}>5px</option>
									<option value={6}>6px</option>
									<option value={8}>8px</option>
									<option value={10}>10px</option>
									<option value={12}>12px</option>
									<option value={15}>15px</option>
									<option value={20}>20px</option>
									<option value={25}>25px</option>
									<option value={30}>30px</option>
									<option value={40}>40px</option>
									<option value={50}>50px</option>
								</select>
							</div>
						)}

					{/* Border Color - For elements with strokes (but not lines) */}
					{!isLine &&
						selectedElement.get("stroke") &&
						!isText &&
						!isImage &&
						!isQRanchor && (
							<div className="flex items-center gap-3">
								<label className="text-sm font-medium">
									Border:
								</label>
								<input
									type="color"
									value={currentBorderColor}
									onChange={(e) =>
										handleBorderColorChange(e.target.value)
									}
									className="w-8 h-8 rounded cursor-pointer"
								/>
							</div>
						)}

					{/* Anchor Properties */}
					{isAnchor && (
						<div className="flex items-center gap-2">
							<label className="text-sm font-medium">
								Field:
							</label>
							<input
								type="text"
								value={currentDbField}
								onChange={(e) =>
									handleFieldNameChange(e.target.value)
								}
								placeholder="e.g., name, course, date"
								className="px-3 py-1 border border-gray-300 rounded-full text-sm w-24"
							/>
						</div>
					)}

					{/* Text Properties */}
					{isText && !isAnchor && (
						<>
							{/* Font Family */}
							<div className="flex items-center gap-2">
								<label className="text-sm font-medium">
									Font:
								</label>
								<select
									value={currentFontFamily}
									onChange={(e) =>
										handleFontFamilyChange(e.target.value)
									}
									className="px-2 py-1 border w-20 border-gray-300 rounded text-sm bg-designcanvas_background">
									<option value="Arial">Arial</option>
									<option value="Helvetica">Helvetica</option>
									<option value="Times New Roman">
										Times New Roman
									</option>
									<option value="Georgia">Georgia</option>
									<option value="Verdana">Verdana</option>
									<option value="Tahoma">Tahoma</option>
									<option value="Courier New">
										Courier New
									</option>
									<option value="Impact">Impact</option>
									<option value="Comic Sans MS">
										Comic Sans MS
									</option>
								</select>
							</div>

							{/* Font Size */}
							<div className="flex items-center gap-2">
								<label className="text-sm font-medium">
									Size:
								</label>
								<select
									value={currentFontSize}
									onChange={(e) =>
										handleFontSizeChange(
											parseInt(e.target.value)
										)
									}
									className="px-2 py-1 w-20 border border-gray-300 rounded text-sm bg-designcanvas_background">
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
											: "bg-designcanvas_background text-gray-700 border-gray-300 hover:bg-gray-50"
									}`}>
									B
								</button>
								<button
									onClick={handleItalicToggle}
									className={`px-3 py-1 text-sm italic border rounded ${
										isItalic
											? "bg-blue-500 text-white border-blue-500"
											: "bg-designcanvas_background text-gray-700 border-gray-300 hover:bg-gray-50"
									}`}>
									I
								</button>
								<button
									onClick={handleUnderlineToggle}
									className={`px-3 py-1 text-sm underline border rounded ${
										isUnderlined
											? "bg-blue-500 text-white border-blue-500"
											: "bg-designcanvas_background text-gray-700 border-gray-300 hover:bg-gray-50"
									}`}>
									U
								</button>
							</div>

							{/* Text Alignment Button with Dropdown */}
							<div className="relative flex items-center">
								<button
									ref={alignButtonRef}
									onClick={() =>
										setIsAlignDropdownOpen(
											!isAlignDropdownOpen
										)
									}
									className="px-2 py-1 border rounded bg-designcanvas_background text-gray-700 border-gray-300 hover:bg-gray-50">
									<img
										src={
											currentTextAlign === "left"
												? AlignLeftIcon
												: currentTextAlign === "center"
												? AlignCenterIcon
												: AlignRightIcon
										}
										alt={`Align ${currentTextAlign}`}
										className="w-6 h-6"
									/>
								</button>

								{/* Alignment Dropdown */}
								{isAlignDropdownOpen && (
									<div className="absolute top-full mt-1 left-0 bg-white border border-gray-300 rounded shadow-lg z-50 flex flex-col p-1">
										<button
											onClick={() =>
												handleTextAlignChange("left")
											}
											className="px-1 py-2 hover:bg-gray-100 rounded flex items-center justify-center">
											<img
												src={AlignLeftIcon}
												alt="Align Left"
												className="w-5 h-5"
											/>
										</button>
										<button
											onClick={() =>
												handleTextAlignChange("center")
											}
											className="px-1 py-2 hover:bg-gray-100 rounded flex items-center justify-center">
											<img
												src={AlignCenterIcon}
												alt="Align Center"
												className="w-5 h-5"
											/>
										</button>
										<button
											onClick={() =>
												handleTextAlignChange("right")
											}
											className="px-1 py-2 hover:bg-gray-100 rounded flex items-center justify-center">
											<img
												src={AlignRightIcon}
												alt="Align Right"
												className="w-5 h-5"
											/>
										</button>
									</div>
								)}
							</div>
						</>
					)}

					{/* Font properties for anchors */}
					{isAnchor && (
						<>
							{/* Font Family for anchors */}
							<div className="flex items-center gap-3">
								<label className="text-sm font-medium">
									Font:
								</label>
								<select
									value={currentFontFamily}
									onChange={(e) =>
										handleFontFamilyChange(e.target.value)
									}
									className="px-2 py-1 w-20 border border-gray-300 rounded text-sm bg-designcanvas_background">
									<option value="Arial">Arial</option>
									<option value="Helvetica">Helvetica</option>
									<option value="Times New Roman">
										Times New Roman
									</option>
									<option value="Georgia">Georgia</option>
									<option value="Verdana">Verdana</option>
									<option value="Tahoma">Tahoma</option>
									<option value="Courier New">
										Courier New
									</option>
									<option value="Impact">Impact</option>
									<option value="Comic Sans MS">
										Comic Sans MS
									</option>
								</select>
							</div>
							{/* Font Size for anchors */}
							<div className="flex items-center gap-3">
								<label className="text-sm font-medium">
									Size:
								</label>
								<select
									value={currentFontSize}
									onChange={(e) =>
										handleFontSizeChange(
											parseInt(e.target.value)
										)
									}
									className="px-2 py-1 w-20 border border-gray-300 rounded text-sm bg-designcanvas_background">
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

							{/* Text Style Buttons for Anchors */}
							<div className="flex items-center gap-2">
								<button
									onClick={handleBoldToggle}
									className={`px-3 py-1 text-sm font-bold border rounded ${
										isBold
											? "bg-blue-500 text-white border-blue-500"
											: "bg-designcanvas_background text-gray-700 border-gray-300 hover:bg-gray-50"
									}`}>
									B
								</button>
								<button
									onClick={handleItalicToggle}
									className={`px-3 py-1 text-sm italic border rounded ${
										isItalic
											? "bg-blue-500 text-white border-blue-500"
											: "bg-designcanvas_background text-gray-700 border-gray-300 hover:bg-gray-50"
									}`}>
									I
								</button>
							</div>

							{/* Text Alignment Button with Dropdown for Anchors */}
							<div className="relative flex items-center">
								<button
									ref={alignButtonRef}
									onClick={() =>
										setIsAlignDropdownOpen(
											!isAlignDropdownOpen
										)
									}
									className="px-2 py-1 border rounded bg-designcanvas_background text-gray-700 border-gray-300 hover:bg-gray-50">
									<img
										src={
											currentTextAlign === "left"
												? AlignLeftIcon
												: currentTextAlign === "center"
												? AlignCenterIcon
												: AlignRightIcon
										}
										alt={`Align ${currentTextAlign}`}
										className="w-6 h-6"
									/>
								</button>

								{/* Alignment Dropdown */}
								{isAlignDropdownOpen && (
									<div className="absolute top-full mt-1 left-0 bg-white border border-gray-300 rounded shadow-lg z-50 flex flex-col p-1">
										<button
											onClick={() =>
												handleTextAlignChange("left")
											}
											className="px-1 py-2 hover:bg-gray-100 rounded flex items-center justify-center">
											<img
												src={AlignLeftIcon}
												alt="Align Left"
												className="w-5 h-5"
											/>
										</button>
										<button
											onClick={() =>
												handleTextAlignChange("center")
											}
											className="px-1 py-2 hover:bg-gray-100 rounded flex items-center justify-center">
											<img
												src={AlignCenterIcon}
												alt="Align Center"
												className="w-5 h-5"
											/>
										</button>
										<button
											onClick={() =>
												handleTextAlignChange("right")
											}
											className="px-1 py-2 hover:bg-gray-100 rounded flex items-center justify-center">
											<img
												src={AlignRightIcon}
												alt="Align Right"
												className="w-5 h-5"
											/>
										</button>
									</div>
								)}
							</div>
						</>
					)}
				</div>

				{/* Right side - Position and Delete Buttons (not for QR anchors) */}
				{!isQRanchor && (
					<div className="flex items-center gap-2">
						<button
							ref={positionButtonRef}
							onClick={() => setIsPositionModalOpen(true)}
							className="px-5 py-2 h-10 text-sm bg-primary_button text-white rounded-full border-none hover:bg-blue-600 hover:border-blue-600 hover:shadow-md active:bg-blue-700 active:border-blue-700 active:scale-95 transition-all duration-150">
							Position
						</button>
					</div>
				)}
			</div>

			<PositionModal
				visible={isPositionModalOpen}
				onClose={() => setIsPositionModalOpen(false)}
				onBringForward={onBringForward || (() => {})}
				onSendBackward={onSendBackward || (() => {})}
				onBringToFront={onBringToFront || (() => {})}
				onSendToBack={onSendToBack || (() => {})}
				buttonRef={positionButtonRef}
			/>
		</>
	);
};

export default PropertiesPanel;
