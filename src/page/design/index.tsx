// import { useAuth } from "@/context/authContext";
import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import * as fabric from "fabric";
import CanvasArea from "@/components/design/CanvasArea";
import ToolsSidebar from "@/components/design/ToolsSidebar";
import PropertiesPanel from "@/components/design/PropertiesPanel";

interface ElementUpdate {
	fill?: string;
	stroke?: string;
	fontSize?: number;
	fontWeight?: 'normal' | 'bold';
	fontStyle?: 'normal' | 'italic';
}

const DesignPage = () => {
	// const auth = useAuth();
	const navigate = useNavigate();
	const canvasRef = useRef<fabric.Canvas | null>(null);
	const [certificateName, setCertificateName] = useState("");
	const [activeMenu, setActiveMenu] = useState<
		"background" | "element" | "text" | null
	>("element");
	const [selectedElement, setSelectedElement] = useState<fabric.Object | null>(null);
	const [, setForceUpdate] = useState({});
	const handleShare = () => {
		// Implement share functionality
		void navigate("/share");
	};
	const handleSaveDraft = () => {
		// Implement save functionality
	};

	const addElement = (type: string) => {
		if (!canvasRef.current) return;

		let fabricObject: fabric.Object;
		const color = type === "text" ? "#000000" : "#3b82f6";

		switch (type) {
			case "rectangle":
				fabricObject = new fabric.Rect({
					left: 100,
					top: 100,
					width: 120,
					height: 80,
					fill: color,
					stroke: "#ccc",
					strokeWidth: 1,
				});
				break;
			case "square":
				fabricObject = new fabric.Rect({
					left: 100,
					top: 100,
					width: 80,
					height: 80,
					fill: color,
					stroke: "#ccc",
					strokeWidth: 1,
				});
				break;
			case "circle":
				fabricObject = new fabric.Circle({
					left: 100,
					top: 100,
					radius: 40,
					fill: color,
					stroke: "#ccc",
					strokeWidth: 1,
				});
				break;
			case "triangle":
				fabricObject = new fabric.Triangle({
					left: 100,
					top: 100,
					width: 80,
					height: 80,
					fill: color,
					stroke: "#ccc",
					strokeWidth: 1,
				});
				break;
			case "line":
				fabricObject = new fabric.Line([0, 0, 100, 0], {
					left: 100,
					top: 100,
					stroke: color,
					strokeWidth: 3,
					fill: '',
					originX: 'left',
					originY: 'top'
				});
				break;
			case "text":
				fabricObject = new fabric.Textbox("Sample Text", {
					left: 100,
					top: 100,
					width: 200,
					fontSize: 18,
					fill: color,
					fontFamily: "Arial",
				});
				break;
			default:
				return;
		}

		canvasRef.current.add(fabricObject);
		canvasRef.current.setActiveObject(fabricObject);
		canvasRef.current.renderAll();
		setSelectedElement(fabricObject);
	};

	const handleShapeAdd = (shapeType: string) => {
		addElement(shapeType);
	};

	const handleTextAdd = () => {
		addElement("text");
	};

	const handleUpdateElement = (updates: ElementUpdate) => {
		if (!selectedElement || !canvasRef.current) return;

		selectedElement.set(updates);
		canvasRef.current.renderAll();
		
		// Force re-render of properties panel
		setForceUpdate({});
	};

	const handleDeleteElement = () => {
		if (!selectedElement || !canvasRef.current) return;

		canvasRef.current.remove(selectedElement);
		canvasRef.current.renderAll();
		setSelectedElement(null);
	};

	const handleCanvasReady = (canvas: fabric.Canvas) => {
		canvasRef.current = canvas;

		canvas.on("selection:created", () => {
			const activeObject = canvas.getActiveObject();
			setSelectedElement(activeObject || null);
		});

		canvas.on("selection:updated", () => {
			const activeObject = canvas.getActiveObject();
			setSelectedElement(activeObject || null);
		});

		canvas.on("selection:cleared", () => {
			setSelectedElement(null);
		});
	};
	return (
		<div className="select-none cursor-default">
			<div className="font-noto bg-secondary_background rounded-[15px] flex  flex-row items-center w-full h-[72px] px-[20px]">
				{/* div text  */}
				<div className=" pl-[10px]">
					<p className="font-semibold text-[25px] w-fit ">
						Certificate canva
					</p>
				</div>
				{/*div button*/}
				<div className="flex flex-row items-center ml-auto gap-3">
					{/* form here */}
					<input
						type="text"
						value={certificateName}
						onChange={(e) => setCertificateName(e.target.value)}
						placeholder="Enter certificate name"
						className="font-noto text-[14px] px-3 py-2 border border-gray-300 rounded-[7px] w-[200px] h-[39px] focus:outline-none focus:border-blue-500"
					/>
					<button
						className="text-noto text-[14px] bg-primary_button text-secondary_text rounded-[7px] w-[92px] h-[39px] flex justify-center items-center "
						onClick={handleSaveDraft}>
						Save draft
					</button>
					<button
						className="text-noto text-[14px] bg-primary_button text-secondary_text rounded-[7px] w-[92px] h-[39px] flex justify-center items-center "
						onClick={handleShare}>
						Share
					</button>
				</div>
			</div>
			{/* Main content area */}
			<div className="font-noto bg-secondary_background min-h-[777px] rounded-[15px] flex justify-start w-full h-full pl-[10px] mt-[25px] py-[30px] ">
				<ToolsSidebar
					activeMenu={activeMenu}
					setActiveMenu={setActiveMenu}
					onShapeAdd={handleShapeAdd}
					onTextAdd={handleTextAdd}
				/>
				<div className="flex-1 flex flex-col">
					<PropertiesPanel
						selectedElement={selectedElement}
						onUpdateElement={handleUpdateElement}
						onDeleteElement={handleDeleteElement}
					/>
					<CanvasArea onCanvasReady={handleCanvasReady} />
				</div>
			</div>
		</div>
	);
};

export { DesignPage };
