import * as fabric from "fabric";
import CanvasArea from "./CanvasArea";
import ToolsSidebar from "./ToolsSidebar";
import PropertiesPanel from "./PropertiesPanel";

interface ElementUpdate {
	fill?: string;
	stroke?: string;
	fontSize?: number;
	fontWeight?: 'normal' | 'bold';
	fontStyle?: 'normal' | 'italic';
}

interface CertificateCanvasProps {
	activeMenu: "background" | "element" | "text" | null;
	setActiveMenu: (menu: "background" | "element" | "text" | null) => void;
	selectedElement: fabric.Object | null;
	onShapeAdd: (shapeType: string) => void;
	onTextAdd: () => void;
	onUpdateElement: (updates: ElementUpdate) => void;
	onDeleteElement: () => void;
	onCanvasReady: (canvas: fabric.Canvas) => void;
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
}: CertificateCanvasProps) => {
	return (
		<div className="font-noto bg-secondary_background min-h-[777px] rounded-[15px] flex justify-start w-full h-full pl-[10px] mt-[25px] py-[30px] ">
			<ToolsSidebar
				activeMenu={activeMenu}
				setActiveMenu={setActiveMenu}
				onShapeAdd={onShapeAdd}
				onTextAdd={onTextAdd}
			/>
			<div className="flex-1 flex flex-col">
				<PropertiesPanel
					selectedElement={selectedElement}
					onUpdateElement={onUpdateElement}
					onDeleteElement={onDeleteElement}
				/>
				<CanvasArea onCanvasReady={onCanvasReady} />
			</div>
		</div>
	);
};

export default CertificateCanvas;