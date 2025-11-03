import { useState, useEffect } from "react";
import backgroundIcon from "@/asset/design/background.svg";
import lineIcon from "@/asset/design/tools/line.svg";
import textIcon from "@/asset/design/text.svg";
import circleIcon from "@/asset/design/tools/circle.svg";
import rectangleIcon from "@/asset/design/tools/rectangle.svg";
import squareIcon from "@/asset/design/tools/square.svg";
import triangleIcon from "@/asset/design/tools/triangle.svg";
import imageIcon from "@/asset/design/image.svg";
import elementIcon from "@/asset/design/element.svg";
import uploadIcon from "@/asset/design/tools/upload.svg";
import anchorIcon from "@/asset/design/anchor.svg";
import signatureIcon from "@/asset/design/signature.svg";
import { uploadBackground, uploadImage } from "@/api/file/upload";
import { getBackgrounds, getGraphics } from "@/api/file/get";
import { deleteBackground, deleteImage } from "@/api/file/delete";
import { MenuType } from "@/page/design/utils/types";
import { AddSignerModal } from "@/components/modal/AddSignerModal";
import ConfirmModal from "@/components/modal/ConfirmModal";
import { addSigner } from "@/api/signer/create";
import { getSigners } from "@/api/signer/get";
import { useToast } from "@/components/toast/ToastContext";
import { Signer } from "@/types/response";

interface ToolsSidebarProps {
	activeMenu: MenuType;
	setActiveMenu: (menu: MenuType) => void;
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
	const toast = useToast();
	const [backgrounds, setBackgrounds] = useState<string[]>([]);
	const [graphics, setGraphics] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [signers, setSigners] = useState<Signer[]>([]);
	const [isSignerModalOpen, setIsSignerModalOpen] = useState(false);
	const [signerLoading, setSignerLoading] = useState(false);
	const [signatureSearch, setSignatureSearch] = useState("");
	const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
		open: boolean;
		type: "background" | "image" | null;
		url: string | null;
	}>({
		open: false,
		type: null,
		url: null,
	});

	// Extract fetchFiles function to be reusable
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

	const fetchSigners = async () => {
		try {
			const response = await getSigners();
			if (response.success && response.data) {
				setSigners(response.data);
			}
		} catch (error) {
			console.error("Error fetching signers:", error);
		}
	};

	useEffect(() => {
		fetchFiles();
		fetchSigners();
	}, []);

	const handleRemoveBackground = () => {
		if (onBackgroundRemove) {
			onBackgroundRemove();
		}
	};

	const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file && file.type.startsWith("image/")) {
			try {
				const response = await uploadBackground(file);
				onBackgroundAdd(response.data.url);
				// Refresh the backgrounds list to show the newly uploaded image
				fetchFiles();
			} catch (error) {
				console.error("Error uploading background:", error);
				alert("Failed to upload background image");
			}
		}
		// Clear the input value to allow uploading the same file again
		event.target.value = "";
	};

	const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file && file.type.startsWith("image/")) {
			try {
				const response = await uploadImage(file);
				onImageAdd(response.data.url);
				// Refresh the graphics list to show the newly uploaded image
				fetchFiles();
			} catch (error) {
				console.error("Error uploading image:", error);
				alert("Failed to upload image");
			}
		}
		// Clear the input value to allow uploading the same file again
		event.target.value = "";
	};

	const handleAddSigner = async (name: string, email: string) => {
		setSignerLoading(true);
		try {
			const response = await addSigner(name, email);
			if (response.success) {
				// Successfully added signer
				toast.success(`Signer ${name} added successfully!`);
				setIsSignerModalOpen(false);
				// Refresh the signers list
				fetchSigners();
			} else {
				toast.error(response.msg || "Failed to add signer");
			}
		} catch (error) {
			console.error("Error adding signer:", error);
			toast.error("Failed to add signer");
		} finally {
			setSignerLoading(false);
		}
	};

	const handleDeleteBackground = (bgUrl: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setDeleteConfirmModal({
			open: true,
			type: "background",
			url: bgUrl,
		});
	};

	const handleDeleteImage = (imageUrl: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setDeleteConfirmModal({
			open: true,
			type: "image",
			url: imageUrl,
		});
	};

	const handleConfirmDelete = async () => {
		const { type, url } = deleteConfirmModal;

		if (!url || !type) return;

		try {
			const response = type === "background"
				? await deleteBackground(url)
				: await deleteImage(url);

			if (response.success) {
				toast.success(`${type === "background" ? "Background" : "Image"} deleted successfully!`);
				// Refresh the files list
				fetchFiles();
			} else {
				toast.error(response.msg || `Failed to delete ${type}`);
			}
		} catch (error) {
			console.error(`Error deleting ${type}:`, error);
			toast.error(`Failed to delete ${type}`);
		} finally {
			setDeleteConfirmModal({
				open: false,
				type: null,
				url: null,
			});
		}
	};

	const handleCancelDelete = () => {
		setDeleteConfirmModal({
			open: false,
			type: null,
			url: null,
		});
	};

	return (
		<div className="flex">
			{/* Main Sidebar */}
			<div className="flex flex-col min-h-full border-r-[3px] border-gray-950 pr-2">
				<div
					className={`flex flex-col justify-center items-center w-20 h-20 mb-6 cursor-pointer rounded-lg ${
						activeMenu === "background" ? "bg-black text-white" : "hover:bg-gray-100/80"
					}`}
					onClick={() => setActiveMenu(activeMenu === "background" ? null : "background")}
				>
					<img
						src={backgroundIcon}
						alt="Background"
						className="w-6 h-6 mb-2"
						style={{
							filter: activeMenu === "background" ? "brightness(0) invert(1)" : "",
						}}
					/>
					<span className="text-[14px]">Background</span>
				</div>
				<div
					className={`flex flex-col justify-center items-center w-20 h-20 mb-6 cursor-pointer rounded-lg ${
						activeMenu === "element" ? "bg-black text-white" : "hover:bg-gray-100/80"
					}`}
					onClick={() => setActiveMenu(activeMenu === "element" ? null : "element")}
				>
					<img
						src={elementIcon}
						alt="Line"
						className="w-6 h-6 mb-2"
						style={{
							filter: activeMenu === "element" ? "brightness(0) invert(1)" : "",
						}}
					/>
					<span className="text-[14px]">Element</span>
				</div>
				<div
					className={`flex flex-col justify-center items-center w-20 h-20 mb-6 cursor-pointer rounded-lg ${
						activeMenu === "image" ? "bg-black text-white" : "hover:bg-gray-100/80"
					}`}
					onClick={() => setActiveMenu(activeMenu === "image" ? null : "image")}
				>
					<img
						src={imageIcon}
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
						activeMenu === "text" ? "bg-black text-white" : "hover:bg-gray-100/80"
					}`}
					onClick={() => setActiveMenu(activeMenu === "text" ? null : "text")}
				>
					<img
						src={textIcon}
						alt="Text"
						className="w-8 h-8 mb-2"
						style={{
							filter:
								activeMenu === "text" ? "brightness(0) invert(1)" : "brightness(0)",
						}}
					/>
					<span className="text-[14px]">Text</span>
				</div>
				<div
					className={`flex flex-col justify-center items-center w-20 h-20 mb-6 cursor-pointer rounded-lg ${
						activeMenu === "anchor" ? "bg-black text-white" : "hover:bg-gray-100/80"
					}`}
					onClick={() => setActiveMenu(activeMenu === "anchor" ? null : "anchor")}
				>
					<img
						src={anchorIcon}
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
				<div
					className={`flex flex-col justify-center items-center w-20 h-20 mb-6 cursor-pointer rounded-lg ${
						activeMenu === "signature" ? "bg-black text-white" : "hover:bg-gray-100/80"
					}`}
					onClick={() => setActiveMenu(activeMenu === "signature" ? null : "signature")}
				>
					<img
						src={signatureIcon}
						alt="Signature"
						className="w-8 h-8 mb-2"
						style={{
							filter:
								activeMenu === "signature"
									? "brightness(0) invert(1)"
									: "brightness(0)",
						}}
					/>
					<span className="text-[14px]">Signature</span>
				</div>
			</div>

			{/* Tools Sidebar */}
			<div className="w-50 px-3 min-h-full">
				{activeMenu === "background" && (
					<div className=" rounded-lg">
						<div className="grid grid-cols-2 gap-2 max-h-[717px] overflow-y-auto">
							<label className="flex flex-col justify-center items-center w-20 h-20 border bg-designcanvas_background shadow-sm rounded-lg cursor-pointer hover:bg-gray-50/80">
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
								className="flex flex-col justify-center items-center w-20 h-20 border bg-designcanvas_background shadow-sm rounded-lg cursor-pointer hover:bg-gray-50/80"
								onClick={handleRemoveBackground}
							>
								<div className="w-6 h-6 mb-2 bg-white border border-gray-300 rounded"></div>
								<span className="text-[12px]">Remove</span>
							</div>
							{backgrounds.map((bgUrl, index) => (
								<div
									key={index}
									className="flex flex-col justify-center items-center w-20 h-20 border bg-designcanvas_background shadow-sm rounded-lg cursor-pointer hover:bg-gray-50/80 relative overflow-hidden group"
									onClick={() => onBackgroundAdd(bgUrl)}
								>
									<img
										src={bgUrl}
										alt={`Background ${index + 1}`}
										className="w-full h-full object-cover rounded-lg"
									/>
									<button
										onClick={(e) => handleDeleteBackground(bgUrl, e)}
										className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 text-xs font-bold"
										title="Delete background"
									>
										×
									</button>
								</div>
							))}
							{loading && (
								<div className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg">
									<span className="text-[10px] text-gray-500">Loading...</span>
								</div>
							)}
						</div>
					</div>
				)}

				{activeMenu === "element" && (
					<div className=" rounded-lg ">
						<div className="grid grid-cols-2 gap-2">
							<div
								className="flex flex-col justify-center items-center w-20 h-20 border bg-designcanvas_background shadow-sm rounded-lg cursor-pointer hover:bg-gray-50/80"
								onClick={() => onShapeAdd("rectangle")}
							>
								<img
									src={rectangleIcon}
									alt="Rectangle"
									className="w-6 h-6 mb-2"
									style={{ filter: "brightness(0)" }}
								/>
								<span className="text-[14px]">Rectangle</span>
							</div>
							<div
								className="flex flex-col justify-center items-center w-20 h-20 border bg-designcanvas_background shadow-sm rounded-lg cursor-pointer hover:bg-gray-50/80"
								onClick={() => onShapeAdd("square")}
							>
								<img
									src={squareIcon}
									alt="Square"
									className="w-6 h-6 mb-2"
									style={{ filter: "brightness(0)" }}
								/>
								<span className="text-[14px]">Square</span>
							</div>
							<div
								className="flex flex-col justify-center items-center w-20 h-20 border bg-designcanvas_background shadow-sm rounded-lg cursor-pointer hover:bg-gray-50/80"
								onClick={() => onShapeAdd("circle")}
							>
								<img
									src={circleIcon}
									alt="Circle"
									className="w-6 h-6 mb-2"
									style={{ filter: "brightness(0)" }}
								/>
								<span className="text-[14px]">Circle</span>
							</div>

							<div
								className="flex flex-col justify-center items-center w-20 h-20 border bg-designcanvas_background shadow-sm rounded-lg cursor-pointer hover:bg-gray-50/80"
								onClick={() => onShapeAdd("triangle")}
							>
								<img
									src={triangleIcon}
									alt="Triangle"
									className="w-6 h-6 mb-2"
									style={{ filter: "brightness(0)" }}
								/>
								<span className="text-[14px]">Triangle</span>
							</div>
							<div
								className="flex flex-col justify-center items-center w-20 h-20 border bg-designcanvas_background shadow-sm rounded-lg cursor-pointer hover:bg-gray-50/80"
								onClick={() => onShapeAdd("line")}
							>
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
					<div className=" rounded-lg">
						<div className="grid grid-cols-2 gap-2 max-h-[717px] overflow-y-auto">
							<label className="flex flex-col justify-center items-center w-20 h-20 border bg-designcanvas_background shadow-sm rounded-lg cursor-pointer hover:bg-gray-50/80">
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
									className="flex flex-col justify-center items-center w-20 h-20 border bg-designcanvas_background shadow-sm rounded-lg cursor-pointer hover:bg-gray-50/80 relative overflow-hidden group"
									onClick={() => onImageAdd(graphicUrl)}
								>
									<img
										src={graphicUrl}
										alt={`Graphic ${index + 1}`}
										className="w-full h-full object-cover rounded-lg"
									/>
									<button
										onClick={(e) => handleDeleteImage(graphicUrl, e)}
										className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 text-xs font-bold"
										title="Delete image"
									>
										×
									</button>
								</div>
							))}
							{loading && (
								<div className="flex flex-col justify-center items-center w-20 h-20 border bg-designcanvas_background shadow-sm rounded-lg">
									<span className="text-[10px] text-gray-500">Loading...</span>
								</div>
							)}
						</div>
					</div>
				)}

				{activeMenu === "text" && (
					<div className=" rounded-lg ">
						<div className="grid grid-cols-1 gap-2">
							<div
								className="flex flex-col justify-center items-center w-20 h-20 border bg-designcanvas_background shadow-sm  rounded-lg cursor-pointer hover:bg-gray-50/80"
								onClick={onTextAdd}
							>
								<span className="text-[14px]">Text Box</span>
							</div>
						</div>
					</div>
				)}

				{activeMenu === "anchor" && (
					<div className=" rounded-lg ">
						<div className="grid grid-cols-1 gap-2">
							<div
								className="flex flex-col justify-center items-center w-20 h-20 border bg-designcanvas_background shadow-sm rounded-lg cursor-pointer hover:bg-gray-50/80"
								onClick={() => onShapeAdd("anchor")}
							>
								<span className="text-[12px]">Add Anchor</span>
							</div>
						</div>
					</div>
				)}

				{activeMenu === "signature" && (
					<div className=" rounded-lg ">
						<input
							type="text"
							placeholder="Search signatures..."
							value={signatureSearch}
							onChange={(e) => setSignatureSearch(e.target.value)}
							className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
						/>
						<div className="grid grid-cols-1 gap-2 max-h-[717px] overflow-y-auto">
							{signers
								.filter((signer) =>
									signer.display_name
										.toLowerCase()
										.includes(signatureSearch.toLowerCase())
								)
								.map((signer) => (
									<div
										key={signer.id}
										className="flex flex-col justify-center items-center w-full h-10 border bg-designcanvas_background shadow-sm rounded-lg cursor-pointer hover:bg-gray-50/80"
										onClick={() =>
											onShapeAdd(
												`signature-${signer.id}-${signer.display_name}`
											)
										}
									>
										<span className="text-[12px] truncate px-2">
											{signer.display_name}
										</span>
									</div>
								))}
							<div
								className="flex flex-col justify-center items-center w-full h-10 border bg-designcanvas_background shadow-sm rounded-lg cursor-pointer hover:bg-gray-50/80"
								onClick={() => setIsSignerModalOpen(true)}
							>
								<span className="text-[12px]">+ Add Signer</span>
							</div>
						</div>
					</div>
				)}
			</div>

			<AddSignerModal
				open={isSignerModalOpen}
				onClose={() => setIsSignerModalOpen(false)}
				onConfirm={handleAddSigner}
				loading={signerLoading}
			/>

			<ConfirmModal
				open={deleteConfirmModal.open}
				title={`Delete ${deleteConfirmModal.type === "background" ? "Background" : "Image"}`}
				message={`Are you sure you want to delete this ${deleteConfirmModal.type}? This action cannot be undone.`}
				confirmText="Delete"
				cancelText="Cancel"
				onConfirm={handleConfirmDelete}
				onClose={handleCancelDelete}
			/>
		</div>
	);
};

export default ToolsSidebar;
