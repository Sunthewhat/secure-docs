import * as fabric from "fabric";
import CanvasArea from "./CanvasArea";
import ToolsSidebar from "./ToolsSidebar";
import PropertiesPanel from "./PropertiesPanel";
import { MenuType } from "@/page/design/utils/types";

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
	activeMenu: MenuType;
	setActiveMenu: (menu: MenuType) => void;
	selectedElement: fabric.Object | null;
	onShapeAdd: (shapeType: string) => void;
	onTextAdd: () => void;
	onUpdateElement: (updates: ElementUpdate) => void;
	onCanvasReady: (canvas: fabric.Canvas) => void;
	onBackgroundAdd: (imageUrl: string) => void;
	onBackgroundRemove?: () => void;
	onImageAdd: (imageUrl: string) => void;
	onBringForward?: () => void;
	onSendBackward?: () => void;
	onBringToFront?: () => void;
	onSendToBack?: () => void;
	showGrid: boolean;
	snapToGrid: boolean;
	gridSize: number;
}

const CertificateCanvas = ({
	activeMenu,
	setActiveMenu,
	selectedElement,
	onShapeAdd,
	onTextAdd,
	onUpdateElement,
	onCanvasReady,
	onBackgroundAdd,
	onBackgroundRemove,
	onImageAdd,
	onBringForward,
	onSendBackward,
	onBringToFront,
	onSendToBack,
	showGrid,
	snapToGrid,
	gridSize,
}: CertificateCanvasProps) => {
	return (
		<div className="font-noto bg-designcanvas_background min-h-[777px] rounded-[15px] flex justify-start w-full h-full pl-[10px] mt-[25px] py-[30px] ">
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
					onBringForward={onBringForward}
					onSendBackward={onSendBackward}
					onBringToFront={onBringToFront}
					onSendToBack={onSendToBack}
				/>
				<CanvasArea
					onCanvasReady={onCanvasReady}
					showGrid={showGrid}
					snapToGrid={snapToGrid}
					gridSize={gridSize}
				/>
			</div>
		</div>
	);
};

export default CertificateCanvas;
