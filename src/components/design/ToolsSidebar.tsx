import backgroundIcon from "@/asset/design/background.svg";
import lineIcon from "@/asset/design/tools/line.svg";
import textIcon from "@/asset/design/text.svg";
import circleIcon from "@/asset/design/tools/circle.svg";
import rectangleIcon from "@/asset/design/tools/rectangle.svg";
import squareIcon from "@/asset/design/tools/square.svg";
import triangleIcon from "@/asset/design/tools/triangle.svg";
import uploadIcon from "@/asset/design/tools/upload.svg";

interface ToolsSidebarProps {
	activeMenu: "background" | "element" | "image" | "text" | "anchor" | null;
	setActiveMenu: (
		menu: "background" | "element" | "image" | "text" | "anchor" | null
	) => void;
	onShapeAdd: (shapeType: string) => void;
	onTextAdd: () => void;
	onBackgroundAdd: (imageUrl: string) => void;
	onImageAdd: (imageUrl: string) => void;
}

const ToolsSidebar = ({
	activeMenu,
	setActiveMenu,
	onShapeAdd,
	onTextAdd,
	onBackgroundAdd,
	onImageAdd,
}: ToolsSidebarProps) => {
	return (
		<div className="flex">
			{/* Main Sidebar */}
			<div className="flex flex-col min-h-full border-r-[3px] border-gray-950 pr-2">
				<div
					className={`flex flex-col justify-center items-center w-20 h-20 mb-6 cursor-pointer rounded-lg ${
						activeMenu === "background"
							? "bg-black text-white"
							: "hover:bg-gray-100"
					}`}
					onClick={() =>
						setActiveMenu(
							activeMenu === "background" ? null : "background"
						)
					}>
					<img
						src={backgroundIcon}
						alt="Background"
						className="w-6 h-6 mb-2"
						style={{
							filter:
								activeMenu === "background"
									? "brightness(0) invert(1)"
									: "",
						}}
					/>
					<span className="text-[14px]">Background</span>
				</div>
				<div
					className={`flex flex-col justify-center items-center w-20 h-20 mb-6 cursor-pointer rounded-lg ${
						activeMenu === "element"
							? "bg-black text-white"
							: "hover:bg-gray-100"
					}`}
					onClick={() =>
						setActiveMenu(
							activeMenu === "element" ? null : "element"
						)
					}>
					<img
						src={lineIcon}
						alt="Line"
						className="w-6 h-6 mb-2"
						style={{
							filter:
								activeMenu === "element"
									? "brightness(0) invert(1)"
									: "",
						}}
					/>
					<span className="text-[14px]">Element</span>
				</div>
				<div
					className={`flex flex-col justify-center items-center w-20 h-20 mb-6 cursor-pointer rounded-lg ${
						activeMenu === "image"
							? "bg-black text-white"
							: "hover:bg-gray-100"
					}`}
					onClick={() =>
						setActiveMenu(activeMenu === "image" ? null : "image")
					}>
					<img
						src={uploadIcon}
						alt="Image"
						className="w-6 h-6 mb-2"
						style={{
							filter:
								activeMenu === "image"
									? "brightness(0) invert(1)"
									: "brightness(0)",
						}}
					/>
					<span className="text-[14px]">Image</span>
				</div>
				<div
					className={`flex flex-col justify-center items-center w-20 h-20 mb-6 cursor-pointer rounded-lg ${
						activeMenu === "text"
							? "bg-black text-white"
							: "hover:bg-gray-100"
					}`}
					onClick={() =>
						setActiveMenu(activeMenu === "text" ? null : "text")
					}>
					<img
						src={textIcon}
						alt="Text"
						className="w-8 h-8 mb-2"
						style={{
							filter:
								activeMenu === "text"
									? "brightness(0) invert(1)"
									: "brightness(0)",
						}}
					/>
					<span className="text-[14px]">Text</span>
				</div>
				<div
					className={`flex flex-col justify-center items-center w-20 h-20 mb-6 cursor-pointer rounded-lg ${
						activeMenu === "anchor"
							? "bg-black text-white"
							: "hover:bg-gray-100"
					}`}
					onClick={() =>
						setActiveMenu(activeMenu === "anchor" ? null : "anchor")
					}>
					<img
						src={textIcon}
						alt="Anchor"
						className="w-8 h-8 mb-2"
						style={{
							filter:
								activeMenu === "anchor"
									? "brightness(0) invert(1)"
									: "brightness(0)",
						}}
					/>
					<span className="text-[14px]">Anchor</span>
				</div>
			</div>

			{/* Tools Sidebar */}
			<div className="w-50 px-3">
				{activeMenu === "background" && (
					<div className="bg-white rounded-lg ">
						<div className="grid grid-cols-2 gap-2">
							<div className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50">
								<img
									src={uploadIcon}
									alt="Upload"
									className="w-6 h-6 mb-2"
									style={{ filter: "brightness(0)" }}
								/>
								<span className="text-[14px]">Upload</span>
							</div>
							<div
								className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50"
								onClick={() =>
									onBackgroundAdd(
										"https://marketplace.canva.com/EAFh7cFx9So/5/0/1600w/canva-white-and-gold-certificate-of-appreciation-fE_Brsy8-8E.jpg"
									)
								}>
								<div className="w-6 h-6 mb-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded"></div>
								<span className="text-[12px]">Mock BG</span>
							</div>
						</div>
					</div>
				)}

				{activeMenu === "element" && (
					<div className="bg-white rounded-lg ">
						<div className="grid grid-cols-2 gap-2">
							<div
								className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50"
								onClick={() => onShapeAdd("rectangle")}>
								<img
									src={rectangleIcon}
									alt="Rectangle"
									className="w-6 h-6 mb-2"
									style={{ filter: "brightness(0)" }}
								/>
								<span className="text-[14px]">Rectangle</span>
							</div>
							<div
								className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50"
								onClick={() => onShapeAdd("square")}>
								<img
									src={squareIcon}
									alt="Square"
									className="w-6 h-6 mb-2"
									style={{ filter: "brightness(0)" }}
								/>
								<span className="text-[14px]">Square</span>
							</div>
							<div
								className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50"
								onClick={() => onShapeAdd("circle")}>
								<img
									src={circleIcon}
									alt="Circle"
									className="w-6 h-6 mb-2"
									style={{ filter: "brightness(0)" }}
								/>
								<span className="text-[14px]">Circle</span>
							</div>

							<div
								className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50"
								onClick={() => onShapeAdd("triangle")}>
								<img
									src={triangleIcon}
									alt="Triangle"
									className="w-6 h-6 mb-2"
									style={{ filter: "brightness(0)" }}
								/>
								<span className="text-[14px]">Triangle</span>
							</div>
							<div
								className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50"
								onClick={() => onShapeAdd("line")}>
								<img
									src={lineIcon}
									alt="Line"
									className="w-6 h-6 mb-2"
									style={{ filter: "brightness(0)" }}
								/>
								<span className="text-[14px]">Line</span>
							</div>
						</div>
					</div>
				)}

				{activeMenu === "image" && (
					<div className="bg-white rounded-lg ">
						<div className="grid grid-cols-2 gap-2">
							<div className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50">
								<img
									src={uploadIcon}
									alt="Upload"
									className="w-6 h-6 mb-2"
									style={{ filter: "brightness(0)" }}
								/>
								<span className="text-[14px]">Upload</span>
							</div>
							<div 
								className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50"
								onClick={() => onImageAdd('https://marketplace.canva.com/EAFh7cFx9So/5/0/1600w/canva-white-and-gold-certificate-of-appreciation-fE_Brsy8-8E.jpg')}
							>
								<div className="w-6 h-6 mb-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded"></div>
								<span className="text-[12px]">Mock Image</span>
							</div>
						</div>
					</div>
				)}

				{activeMenu === "text" && (
					<div className="bg-white rounded-lg ">
						<div className="grid grid-cols-1 gap-2">
							<div
								className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50"
								onClick={onTextAdd}>
								<span className="text-[14px]">Text Box</span>
							</div>
						</div>
					</div>
				)}

				{activeMenu === "anchor" && (
					<div className="bg-white rounded-lg ">
						<div className="grid grid-cols-1 gap-2">
							<div
								className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50"
								onClick={() => onShapeAdd("anchor")}>
								<span className="text-[12px]">
									Column Anchor
								</span>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default ToolsSidebar;
