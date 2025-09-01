import { useState, useEffect } from "react";
import backgroundIcon from "@/asset/design/background.svg";
import lineIcon from "@/asset/design/tools/line.svg";
import textIcon from "@/asset/design/text.svg";
import circleIcon from "@/asset/design/tools/circle.svg";
import rectangleIcon from "@/asset/design/tools/rectangle.svg";
import squareIcon from "@/asset/design/tools/square.svg";
import triangleIcon from "@/asset/design/tools/triangle.svg";
import uploadIcon from "@/asset/design/tools/upload.svg";
import { uploadBackground, uploadImage } from "@/api/file/upload";
import { getBackgrounds, getGraphics } from "@/api/file/get";

interface ToolsSidebarProps {
	activeMenu: "background" | "element" | "image" | "text" | "anchor" | null;
	setActiveMenu: (
		menu: "background" | "element" | "image" | "text" | "anchor" | null
	) => void;
	onShapeAdd: (shapeType: string) => void;
	onTextAdd: () => void;
	onBackgroundAdd: (imageUrl: string) => void;
	onImageAdd: (imageUrl: string) => void;
	onBackgroundRemove?: () => void;
}

const ToolsSidebar = ({
	activeMenu,
	setActiveMenu,
	onShapeAdd,
	onTextAdd,
	onBackgroundAdd,
	onImageAdd,
	onBackgroundRemove,
}: ToolsSidebarProps) => {
	const [backgrounds, setBackgrounds] = useState<string[]>([]);
	const [graphics, setGraphics] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchFiles = async () => {
			setLoading(true);
			try {
				const [backgroundsRes, graphicsRes] = await Promise.all([
					getBackgrounds(),
					getGraphics(),
				]);

				if (backgroundsRes.success && backgroundsRes.data) {
					setBackgrounds(backgroundsRes.data.files || []);
				}

				if (graphicsRes.success && graphicsRes.data) {
					setGraphics(graphicsRes.data.files || []);
				}
			} catch (error) {
				console.error("Error fetching files:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchFiles();
	}, []);

	const handleRemoveBackground = () => {
		if (onBackgroundRemove) {
			onBackgroundRemove();
		}
	};

	const handleBackgroundUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (file && file.type.startsWith("image/")) {
			try {
				const response = await uploadBackground(file);
				onBackgroundAdd(response.data.url);
			} catch (error) {
				console.error("Error uploading background:", error);
				alert("Failed to upload background image");
			}
		}
	};

	const handleImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (file && file.type.startsWith("image/")) {
			try {
				const response = await uploadImage(file);
				onImageAdd(response.data.url);
			} catch (error) {
				console.error("Error uploading image:", error);
				alert("Failed to upload image");
			}
		}
	};
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
					<div className="bg-white rounded-lg">
						<div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
							<label className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50">
								<img
									src={uploadIcon}
									alt="Upload"
									className="w-6 h-6 mb-2"
									style={{ filter: "brightness(0)" }}
								/>
								<span className="text-[14px]">Upload</span>
								<input
									type="file"
									accept="image/*"
									onChange={handleBackgroundUpload}
									className="hidden"
								/>
							</label>
							<div
								className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50"
								onClick={handleRemoveBackground}>
								<div className="w-6 h-6 mb-2 bg-white border border-gray-300 rounded"></div>
								<span className="text-[12px]">Remove</span>
							</div>
							{backgrounds.map((bgUrl, index) => (
								<div
									key={index}
									className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50 relative overflow-hidden"
									onClick={() => onBackgroundAdd(bgUrl)}>
									<img
										src={bgUrl}
										alt={`Background ${index + 1}`}
										className="w-full h-full object-cover rounded-lg"
									/>
								</div>
							))}
							{loading && (
								<div className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg">
									<span className="text-[10px] text-gray-500">
										Loading...
									</span>
								</div>
							)}
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
					<div className="bg-white rounded-lg">
						<div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
							<label className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50">
								<img
									src={uploadIcon}
									alt="Upload"
									className="w-6 h-6 mb-2"
									style={{ filter: "brightness(0)" }}
								/>
								<span className="text-[14px]">Upload</span>
								<input
									type="file"
									accept="image/*"
									onChange={handleImageUpload}
									className="hidden"
								/>
							</label>
							{graphics.map((graphicUrl, index) => (
								<div
									key={index}
									className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50 relative overflow-hidden"
									onClick={() => onImageAdd(graphicUrl)}>
									<img
										src={graphicUrl}
										alt={`Graphic ${index + 1}`}
										className="w-full h-full object-cover rounded-lg"
									/>
								</div>
							))}
							{loading && (
								<div className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg">
									<span className="text-[10px] text-gray-500">
										Loading...
									</span>
								</div>
							)}
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
								<span className="text-[12px]">Add Anchor</span>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default ToolsSidebar;
