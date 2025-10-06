import { useState, useRef, useEffect, useCallback, ReactNode } from "react";
import {
	useNavigate,
	useParams,
	useLocation,
	useOutletContext,
} from "react-router";
import * as fabric from "fabric";
import DesignHeader from "@/components/design/DesignHeader";
import CertificateCanvas from "@/components/design/CertificateCanvas";
import DesignWarning from "@/components/modal/DesignWarning";
import { Axios } from "@/util/axiosInstance";
import { CertType, GetCertificateResponse } from "@/types/response";
import { useToast } from "@/components/toast/ToastContext"; // ✅ NEW
import { addElement } from "./utils/addElement";
import { handleSaveCertificateUtil } from "./utils/handleSaveCertificate";
import { handleShareUtil } from "./utils/handleShareCertificate";
import { addBackgroundImageUtil } from "./utils/addBackgroundImage";
import { handleCanvasReadyUtil } from "./utils/handleCanvasReady";

// Extend fabric.Object to include custom properties
declare module "fabric" {
	interface FabricObject {
		id?: string;
		dbField?: string;
		isAnchor?: boolean;
		isQRanchor?: boolean;
		undeleteable?: boolean;
	}
}

// Ensure custom properties are registered
if (fabric.FabricObject) {
	fabric.FabricObject.customProperties =
		fabric.FabricObject.customProperties || [];
	const customProps = [
		"name",
		"id",
		"dbField",
		"isAnchor",
		"isQRanchor",
		"undeleteable",
	];
	customProps.forEach((prop) => {
		if (!fabric.FabricObject.customProperties.includes(prop)) {
			fabric.FabricObject.customProperties.push(prop);
		}
	});
}

interface ElementUpdate {
	fill?: string;
	stroke?: string;
	fontSize?: number;
	fontWeight?: "normal" | "bold";
	fontStyle?: "normal" | "italic";
	underline?: boolean;
	textAlign?: "left" | "center" | "right";
	text?: string;
	dbField?: string;
	anchorId?: string;
}

const DesignPage = () => {
	const navigate = useNavigate();
	const { certId } = useParams<{ certId?: string }>();
	const location = useLocation();
	const canvasRef = useRef<fabric.Canvas | null>(null);
	const [certificateName, setCertificateName] = useState("");
	const [activeMenu, setActiveMenu] = useState<
		"background" | "element" | "image" | "text" | "anchor" | null
	>("element");
	const [selectedElement, setSelectedElement] =
		useState<fabric.Object | null>(null);
	const [, setForceUpdate] = useState({});
	const toast = useToast(); // ✅ NEW

	const [isDataFetched, setIsDataFetched] = useState(false);
	const [designData, setDesignData] = useState<object | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [certificateId, setCertificateId] = useState<string | null>(
		certId || null
	);
	const [showWarningModal, setShowWarningModal] = useState(false);
	const [showGrid] = useState(false);
	const [snapToGrid] = useState(true);
	const [gridSize] = useState(20);
	const [lastSaved, setLastSaved] = useState<string | null>(null);

	const { setPageTopBarProps } = useOutletContext<{
		setPageTopBarProps: (props: { content: ReactNode } | null) => void;
	}>();

	// Fetch certificate design
	const fetchCertificateDesign = useCallback(async () => {
		if (isDataFetched || isLoading || !certificateId) {
			return;
		}

		setIsLoading(true);

		try {
			const response = await Axios.get<GetCertificateResponse>(
				`/certificate/${certificateId}`
			);

			if (response.status === 200) {
				const certificate = response.data.data;
				setCertificateName(certificate.name);

				if (certificate.design) {
					const parsedDesign = JSON.parse(certificate.design);
					setDesignData(parsedDesign);
				} else {
					setDesignData(null);
				}

				setIsDataFetched(true);
			} else {
				console.error("Failed to fetch certificate design");
				toast.error("Failed to fetch certificate design.");
			}
		} catch (error) {
			console.error("Error fetching certificate design:", error);
			toast.error("Error fetching certificate design.");
		} finally {
			setIsLoading(false);
		}
	}, [certificateId, isDataFetched, isLoading, toast]);

	// Fetch certificate design when certId or certificateId changes
	useEffect(() => {
		if (certId) {
			setCertificateId(certId);
		}
	}, [certId]);

	useEffect(() => {
		if (certificateId && !isDataFetched && !isLoading) {
			fetchCertificateDesign();
		}
	}, [certificateId, isDataFetched, isLoading, fetchCertificateDesign]);

	// Update state when URL changes (for redirect after first save)
	useEffect(() => {
		if (certId && certId !== certificateId) {
			setCertificateId(certId);
			setIsDataFetched(false); // Reset to allow fetching new data
		}
	}, [location.pathname, certId, certificateId]);

	// Auto-save to server every 30 seconds
	useEffect(() => {
		if (!certificateId || !canvasRef.current) return;

		const autoSaveInterval = setInterval(async () => {
			try {
				const canvasData = canvasRef.current?.toJSON();
				if (!canvasData) return;

				const requestData = {
					name: certificateName,
					design: JSON.stringify(canvasData),
				};

				const response = await Axios.put(
					`/certificate/${certificateId}?autosave=true`,
					requestData
				);

				if (
					response.status === 200 &&
					response.data?.data?.updated_at
				) {
					setLastSaved(response.data.data.updated_at);
				}
				console.log("Auto-saved to server");
			} catch (error) {
				console.error("Auto-save failed:", error);
			}
		}, 30 * 1000); // Save every 30 seconds

		return () => clearInterval(autoSaveInterval);
	}, [certificateId, certificateName]);

	// Add keyboard delete functionality
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!canvasRef.current) return;

			// Don't trigger delete if user is typing in an input field
			const target = e.target as HTMLElement;
			if (
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable
			) {
				return;
			}

			const activeObject = canvasRef.current.getActiveObject();
			if (!activeObject) return;

			if (
				activeObject.type === "textbox" ||
				activeObject.type === "text"
			) {
				const textObject = activeObject as fabric.Textbox;
				if (textObject.isEditing) {
					return;
				}
			}

			// Delete with Delete, Backspace, or Ctrl+X
			if (
				e.key === "Delete" ||
				e.key === "Backspace" ||
				(e.ctrlKey && e.key.toLowerCase() === "x")
			) {
				if (e.ctrlKey && e.key.toLowerCase() === "x") {
					e.preventDefault();
				}

				// Check if element is undeleteable (like QR anchors)
				if (activeObject.undeleteable || activeObject.isQRanchor) {
					toast.error("This QR code anchor cannot be deleted."); // ✅ toast instead of alert
					return;
				}

				canvasRef.current.remove(activeObject);
				canvasRef.current.renderAll();
				setSelectedElement(null);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [toast]); // ✅ include toast

	const addBackgroundImage = (imageUrl: string) => {
		addBackgroundImageUtil(canvasRef, imageUrl, toast);
	};

	const removeBackgroundImage = () => {
		if (!canvasRef.current) return;

		const canvas = canvasRef.current;
		const existingBg = canvas
			.getObjects()
			.find((obj) => obj.id === "background-image");

		if (existingBg) {
			canvas.remove(existingBg);
			canvas.renderAll();
		}
	};

	const addImage = (imageUrl: string) => {
		if (!canvasRef.current) return;

		fabric.Image.fromURL(imageUrl, {
			crossOrigin: "anonymous",
		})
			.then((img: fabric.Image) => {
				if (!canvasRef.current) return;

				const canvas = canvasRef.current;

				// Set default properties for selectable images
				img.set({
					left: 100,
					top: 100,
					scaleX: 0.3, // Default smaller scale for selectable images
					scaleY: 0.3,
					selectable: true, // Images should be selectable
					evented: true, // Images should receive events
					id: `image-${Date.now()}`, // Unique ID for each image
				});

				canvas.add(img);
				canvas.setActiveObject(img); // Select the newly added image
				canvas.renderAll();
				setSelectedElement(img);
			})
			.catch((error) => {
				console.error("Error loading image:", error);
				toast.error("Failed to load image."); // ✅
			});
	};

	const handleShapeAdd = (shapeType: string) => {
		addElement(canvasRef, shapeType, setSelectedElement);
	};

	const handleTextAdd = () => {
		addElement(canvasRef, "text", setSelectedElement);
	};

	const handleUpdateElement = (updates: ElementUpdate) => {
		if (!selectedElement || !canvasRef.current) return;

		selectedElement.set(updates);
		canvasRef.current.renderAll();
		setForceUpdate({});
	};

	const addQRanchor = () => {
		if (!canvasRef.current) {
			return;
		}

		// Create a placeholder rectangle for QR code
		const qrAnchor = new fabric.Rect({
			left: 650, // Position on right side
			top: 450, // Position at bottom
			width: 100,
			height: 100,
			fill: "rgba(59, 130, 246, 0.1)", // Light blue background
			stroke: "#3b82f6",
			strokeWidth: 2,
			strokeDashArray: [5, 5], // Dashed border
			selectable: true,
			evented: true,
			hasControls: true, // Enable resize controls
			hasBorders: true, // Show selection borders
			lockRotation: true, // Disable rotation
			lockUniScaling: false, // Allow non-uniform scaling
			hasRotatingPoint: false, // Hide rotation control
			// Custom properties to identify as QR anchor
			id: `qr-anchor-${Date.now()}`,
			isQRanchor: true,
			undeleteable: true,
		});

		// Hide the rotation control specifically
		qrAnchor.setControlVisible("mtr", false);

		// Override rotation methods to prevent rotation
		(qrAnchor as fabric.Rect & { rotate: () => fabric.Rect }).rotate =
			function () {
				return this;
			};

		// Set angle to 0 and lock it
		qrAnchor.set("angle", 0);

		canvasRef.current.add(qrAnchor);
		canvasRef.current.bringObjectToFront(qrAnchor);
		canvasRef.current.renderAll();
	};

	const handleSaveCertificate = async () => {
		const updatedAt = await handleSaveCertificateUtil(
			certificateName,
			canvasRef,
			certificateId,
			toast
		);
		if (updatedAt) {
			setLastSaved(updatedAt);
		}
		return true;
	};

	const handleShare = () => {
		setShowWarningModal(true);
	};

	const handleConfirmShare = (_certId: string) => {
		setShowWarningModal(false);
		handleShareUtil(
			certificateId,
			certificateName,
			canvasRef,
			navigate,
			toast
		);
	};

	const handleCanvasReady = (canvas: fabric.Canvas) => {
		handleCanvasReadyUtil(
			canvas,
			canvasRef,
			designData,
			addQRanchor,
			setSelectedElement
		);
	};

	useEffect(() => {
		setPageTopBarProps({
			content: (
				<DesignHeader
					certificateName={certificateName}
					setCertificateName={setCertificateName}
					onSave={handleSaveCertificate}
					onShare={handleShare}
					lastSaved={lastSaved}
				/>
			),
		});
		return () => setPageTopBarProps(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [certificateName, lastSaved, setPageTopBarProps]);

	// Show loading state while fetching design data or if no certificate ID
	if (isLoading || (certId && !isDataFetched)) {
		return (
			<div className="select-none cursor-default">
				<DesignHeader
					certificateName={certificateName}
					setCertificateName={setCertificateName}
					onSave={handleSaveCertificate}
					onShare={handleShare}
					lastSaved={lastSaved}
				/>
				<div className="flex items-center justify-center h-96">
					<p className="text-lg">Loading design...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="select-none cursor-default">
			<div className="text-4xl font-semibold text-white">
				<h1>Certificate Canvas</h1>
			</div>
			<CertificateCanvas
				activeMenu={activeMenu}
				setActiveMenu={setActiveMenu}
				selectedElement={selectedElement}
				onShapeAdd={handleShapeAdd}
				onTextAdd={handleTextAdd}
				onUpdateElement={handleUpdateElement}
				onCanvasReady={handleCanvasReady}
				onBackgroundAdd={addBackgroundImage}
				onBackgroundRemove={removeBackgroundImage}
				onImageAdd={addImage}
				showGrid={showGrid}
				snapToGrid={snapToGrid}
				gridSize={gridSize}
				onBringForward={() => {
					if (!selectedElement || !canvasRef.current) return;
					canvasRef.current.bringObjectForward(selectedElement);
					// Ensure QR anchor stays on top
					const qrAnchor = canvasRef.current
						.getObjects()
						.find((obj) => obj.isQRanchor);
					if (qrAnchor) {
						canvasRef.current.bringObjectToFront(qrAnchor);
					}
					canvasRef.current.renderAll();
				}}
				onSendBackward={() => {
					if (!selectedElement || !canvasRef.current) return;
					if (selectedElement.id === "background-image") return;
					canvasRef.current.sendObjectBackwards(selectedElement);
					canvasRef.current.renderAll();
				}}
				onBringToFront={() => {
					if (!selectedElement || !canvasRef.current) return;
					canvasRef.current.bringObjectToFront(selectedElement);
					// Ensure QR anchor stays on top
					const qrAnchor = canvasRef.current
						.getObjects()
						.find((obj) => obj.isQRanchor);
					if (qrAnchor && qrAnchor !== selectedElement) {
						canvasRef.current.bringObjectToFront(qrAnchor);
					}
					canvasRef.current.renderAll();
				}}
				onSendToBack={() => {
					if (!selectedElement || !canvasRef.current) return;
					if (selectedElement.id === "background-image") return;
					canvasRef.current.sendObjectToBack(selectedElement);
					// Ensure background image stays at the back
					const backgroundImage = canvasRef.current
						.getObjects()
						.find((obj) => obj.id === "background-image");
					if (backgroundImage) {
						canvasRef.current.sendObjectToBack(backgroundImage);
					}
					canvasRef.current.renderAll();
				}}
			/>
			<DesignWarning
				open={showWarningModal}
				cert={
					{
						name: certificateName,
						id: certificateId || "",
					} as CertType
				}
				onClose={() => setShowWarningModal(false)}
				onConfirm={handleConfirmShare}
			/>
		</div>
	);
};

export { DesignPage };
