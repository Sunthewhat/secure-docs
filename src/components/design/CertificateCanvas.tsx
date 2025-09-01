import * as fabric from "fabric";
import CanvasArea from "./CanvasArea";
import ToolsSidebar from "./ToolsSidebar";
import PropertiesPanel from "./PropertiesPanel";

interface ElementUpdate {
	fill?: string;
	stroke?: string;
	fontSize?: number;
	fontWeight?: "normal" | "bold";
	fontStyle?: "normal" | "italic";
	text?: string;
	dbField?: string;
	anchorId?: string;
}

interface CertificateCanvasProps {
	activeMenu: "background" | "element" | "image" | "text" | "anchor" | null;
	setActiveMenu: (
		menu: "background" | "element" | "image" | "text" | "anchor" | null
	) => void;
	selectedElement: fabric.Object | null;
	onShapeAdd: (shapeType: string) => void;
	onTextAdd: () => void;
	onUpdateElement: (updates: ElementUpdate) => void;
	onDeleteElement: () => void;
	onCanvasReady: (canvas: fabric.Canvas) => void;
	onBackgroundAdd: (imageUrl: string) => void;
	onBackgroundRemove?: () => void;
	onImageAdd: (imageUrl: string) => void;
	onBringForward?: () => void;
	onSendBackward?: () => void;
	onBringToFront?: () => void;
	onSendToBack?: () => void;
}

const CertificateCanvas = ({
	activeMenu,
	setActiveMenu,
	selectedElement,
	onShapeAdd,
	onTextAdd,
	onUpdateElement,
	onDeleteElement,
	onCanvasReady,
	onBackgroundAdd,
	onBackgroundRemove,
	onImageAdd,
	onBringForward,
	onSendBackward,
	onBringToFront,
	onSendToBack,
}: CertificateCanvasProps) => {
	return (
		<div className="font-noto bg-secondary_background min-h-[777px] rounded-[15px] flex justify-start w-full h-full pl-[10px] mt-[25px] py-[30px] ">
			<ToolsSidebar
				activeMenu={activeMenu}
				setActiveMenu={setActiveMenu}
				onShapeAdd={onShapeAdd}
				onTextAdd={onTextAdd}
				onBackgroundAdd={onBackgroundAdd}
				onBackgroundRemove={onBackgroundRemove}
				onImageAdd={onImageAdd}
			/>
			<div className="flex-1 flex flex-col">
				<PropertiesPanel
					selectedElement={selectedElement}
					onUpdateElement={onUpdateElement}
					onDeleteElement={onDeleteElement}
					onBringForward={onBringForward}
					onSendBackward={onSendBackward}
					onBringToFront={onBringToFront}
					onSendToBack={onSendToBack}
				/>
				<CanvasArea onCanvasReady={onCanvasReady} />
			</div>
		</div>
	);
};

export default CertificateCanvas;
