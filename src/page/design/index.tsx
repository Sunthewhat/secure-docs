import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import * as fabric from "fabric";
import DesignHeader from "@/components/design/DesignHeader";
import CertificateCanvas from "@/components/design/CertificateCanvas";
import { Axios } from "@/util/axiosInstance";
import { GetCertificateResponse } from "@/types/response";

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
	text?: string;
	dbField?: string;
	anchorId?: string;
}

const DesignPage = () => {
	const navigate = useNavigate();
	const { certId } = useParams<{ certId?: string }>();
	const canvasRef = useRef<fabric.Canvas | null>(null);
	const [certificateName, setCertificateName] = useState("");
	const [activeMenu, setActiveMenu] = useState<
		"background" | "element" | "image" | "text" | "anchor" | null
	>("element");
	const [selectedElement, setSelectedElement] =
		useState<fabric.Object | null>(null);
	const [, setForceUpdate] = useState({});

	// Edit mode state - initialize based on current URL
	const [isEditing, setIsEditing] = useState(() => {
		const isEditPath = window.location.pathname.includes("/edit");
		return isEditPath;
	});
	const [isDataFetched, setIsDataFetched] = useState(false);
	const [designData, setDesignData] = useState<object | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [certificateId, setCertificateId] = useState<string | null>(() => {
		const isEditPath = window.location.pathname.includes("/edit");
		return isEditPath && certId ? certId : null;
	});

	// Local storage key for persisting canvas state in create mode
	const CANVAS_STORAGE_KEY = "design-canvas-state";

	// Save canvas state to local storage (only for create mode)
	const saveCanvasToLocalStorage = useCallback(() => {
		if (!canvasRef.current || isEditing) return;

		try {
			const canvasData = canvasRef.current.toJSON();
			localStorage.setItem(
				CANVAS_STORAGE_KEY,
				JSON.stringify({
					canvasData,
					certificateName,
					timestamp: Date.now(),
				})
			);
		} catch (error) {
			console.error("Failed to save canvas to local storage:", error);
		}
	}, [certificateName, isEditing]);

	// Load canvas state from local storage (only for create mode)
	const loadCanvasFromLocalStorage = useCallback(() => {
		if (isEditing) return null;

		try {
			const stored = localStorage.getItem(CANVAS_STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				return parsed;
			}
		} catch (error) {
			console.error("Failed to load canvas from local storage:", error);
		}
		return null;
	}, [isEditing]);

	// Clear local storage when successfully saved to database
	const clearLocalStorage = useCallback(() => {
		try {
			localStorage.removeItem(CANVAS_STORAGE_KEY);
		} catch (error) {
			console.error("Failed to clear local storage:", error);
		}
	}, []);

	// Fetch existing certificate design when in edit mode
	const fetchCertificateDesign = useCallback(async () => {
		if (isDataFetched || isLoading) {
			return;
		}

		if (!isEditing || !certificateId) {
			return;
		}

		setIsLoading(true);

		try {
			const response = await Axios.get<GetCertificateResponse>(
				`/certificate/${certId}`
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
			}
		} catch (error) {
			console.error("Error fetching certificate design:", error);
		} finally {
			setIsLoading(false);
		}
	}, [isEditing, certificateId, certId, isDataFetched, isLoading]);

	// Check for edit mode from URL parameters
	useEffect(() => {
		const currentPath = window.location.pathname;
		const isEditPath = currentPath.includes("/edit");
		if (isEditPath && certId) {
			setIsEditing(true);
			setCertificateId(certId);
			fetchCertificateDesign();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Auto-save when certificate name changes (create mode only)
	useEffect(() => {
		if (!isEditing && certificateName) {
			saveCanvasToLocalStorage();
		}
	}, [certificateName, saveCanvasToLocalStorage, isEditing]);

	// Add keyboard delete functionality
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!canvasRef.current) return;

			const activeObject = canvasRef.current.getActiveObject();
			if (!activeObject) return;

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
					alert("This QR code anchor cannot be deleted.");
					return;
				}

				canvasRef.current.remove(activeObject);
				canvasRef.current.renderAll();
				setSelectedElement(null);
				// Auto-save after deletion
				if (!isEditing) {
					saveCanvasToLocalStorage();
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isEditing, saveCanvasToLocalStorage]);

	const handleShare = async () => {
		if (!certificateName.trim()) {
			alert("Please enter a certificate name");
			return;
		}

		if (!canvasRef.current) {
			alert("Canvas not ready");
			return;
		}

		try {
			const canvas = canvasRef.current;
			const fabricDesign = canvas.toJSON();

			const payload = {
				name: certificateName,
				design: JSON.stringify(fabricDesign),
			};

			let response;
			if (isEditing && certificateId) {
				response = await Axios.put(
					`/certificate/${certificateId}`,
					payload
				);
			} else {
				response = await Axios.post("/certificate", payload);
			}

			if (response.status === 200) {
				const certId = isEditing
					? certificateId
					: response.data.data.id;
				// Clear local storage when successfully saved
				if (!isEditing) {
					clearLocalStorage();
				}
				void navigate(`/share/${certId}`);
			} else {
				alert(response.data?.msg || "Failed to save certificate");
			}
		} catch (error) {
			console.error("Save failed:", error);
			alert("Failed to save certificate. Please try again.");
		}
	};

	const addBackgroundImage = (imageUrl: string) => {
		if (!canvasRef.current) return;

		fabric.Image.fromURL(imageUrl, {
			crossOrigin: "anonymous", // Handle CORS for external images
		})
			.then((img: fabric.Image) => {
				if (!canvasRef.current) return;

				const canvas = canvasRef.current;
				const canvasWidth = canvas.width || 800;
				const canvasHeight = canvas.height || 600;

				// Scale image to fit canvas while maintaining aspect ratio
				const scaleX = canvasWidth / (img.width || 1);
				const scaleY = canvasHeight / (img.height || 1);
				const scale = Math.min(scaleX, scaleY);

				img.set({
					left: 0,
					top: 0,
					scaleX: scale,
					scaleY: scale,
					selectable: false, // Background should not be selectable
					evented: false, // Background should not receive events
					id: "background-image",
				});

				// Remove existing background if any
				const existingBg = canvas
					.getObjects()
					.find((obj) => obj.id === "background-image");
				if (existingBg) {
					canvas.remove(existingBg);
				}

				canvas.add(img);
				canvas.sendObjectToBack(img); // Send to back to act as background
				canvas.renderAll();
			})
			.catch((error) => {
				console.error("Error loading image:", error);
			});
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
			});
	};

	const handleSaveCertificate = async () => {
		if (!certificateName.trim()) {
			alert("Please enter a certificate name");
			return;
		}

		if (!canvasRef.current) {
			alert("Canvas not ready");
			return;
		}

		try {
			const canvas = canvasRef.current;

			const fabricDesign = canvas.toJSON();

			const payload = {
				name: certificateName,
				design: JSON.stringify(fabricDesign),
			};

			let response;
			if (isEditing && certificateId) {
				response = await Axios.put(
					`/certificate/${certificateId}`,
					payload
				);
			} else {
				response = await Axios.post("/certificate", payload);
			}

			if (response.status === 200) {
				// Clear local storage when successfully saved
				if (!isEditing) {
					clearLocalStorage();
				}
				alert(
					isEditing
						? "Certificate updated successfully!"
						: "Certificate saved successfully!"
				);
			} else {
				alert(response.data?.msg || "Failed to save certificate");
			}
		} catch (error) {
			console.error("Save failed:", error);
			alert("Failed to save certificate. Please try again.");
		}
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
					fill: "",
					originX: "left",
					originY: "top",
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
			case "anchor":
				fabricObject = new fabric.Textbox("COLUMN", {
					left: 100,
					top: 100,
					width: 150,
					fontSize: 16,
					fill: "#3b82f6",
					fontFamily: "Arial",
					textAlign: "center",
					// Custom properties for database field mapping
					dbField: "column",
					isAnchor: true,
					// Lock text editing on canvas
					editable: false,
					selectable: true,
					id: "PLACEHOLDER-COLUMN",
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
			hasControls: false, // Remove resize/rotate controls
			hasBorders: false, // Remove selection borders
			lockRotation: true, // Disable rotation
			// Custom properties to identify as QR anchor
			id: `qr-anchor-${Date.now()}`,
			isQRanchor: true,
			undeleteable: true,
		});

		canvasRef.current.add(qrAnchor);
		canvasRef.current.bringObjectToFront(qrAnchor);
		canvasRef.current.renderAll();

		// Auto-save after adding QR anchor
		if (!isEditing) {
			saveCanvasToLocalStorage();
		}
	};

	const handleDeleteElement = () => {
		if (!selectedElement || !canvasRef.current) return;

		// Check if element is undeleteable (like QR anchors)
		if (selectedElement.undeleteable || selectedElement.isQRanchor) {
			alert("This QR code anchor cannot be deleted.");
			return;
		}

		canvasRef.current.remove(selectedElement);
		canvasRef.current.renderAll();
		setSelectedElement(null);
	};

	const handleCanvasReady = (canvas: fabric.Canvas) => {
		canvasRef.current = canvas;

		// Enable keyboard interactions on canvas
		canvas.selection = true;
		canvas.preserveObjectStacking = true;

		// Load design data if it's already available (edit mode)
		if (isEditing && designData) {
			canvas.loadFromJSON(designData).then((canvas) => {
				// Fix background image properties after restoration
				const backgroundImage = canvas
					.getObjects()
					.find((obj) => obj.id === "background-image");
				if (backgroundImage) {
					backgroundImage.set({
						selectable: false,
						evented: false,
					});
					canvas.sendObjectToBack(backgroundImage);
				}
				canvas.requestRenderAll();
			});
		} else if (!isEditing) {
			// Load from local storage for create mode
			const storedData = loadCanvasFromLocalStorage();

			if (storedData) {
				setCertificateName(storedData.certificateName || "");
				if (storedData.canvasData) {
					canvas
						.loadFromJSON(storedData.canvasData)
						.then((canvas) => {
							// Fix background image properties after restoration
							const backgroundImage = canvas
								.getObjects()
								.find((obj) => obj.id === "background-image");
							if (backgroundImage) {
								backgroundImage.set({
									selectable: false,
									evented: false,
								});
								canvas.sendObjectToBack(backgroundImage);
							}

							// Check if QR anchor already exists, if not add one
							const existingQRanchor = canvas
								.getObjects()
								.find((obj) => obj.isQRanchor);
							if (!existingQRanchor) {
								setTimeout(() => addQRanchor(), 100);
							}

							canvas.requestRenderAll();
						});
				} else {
					// Add QR anchor for new canvas after a short delay
					setTimeout(() => addQRanchor(), 100);
				}
			} else {
				// First time creating canvas - add QR anchor after a short delay
				setTimeout(() => addQRanchor(), 100);
			}
		}

		// Auto-save to local storage on canvas changes (create mode only)
		const handleCanvasChange = () => {
			if (!isEditing) {
				saveCanvasToLocalStorage();
			}
		};

		// Keep QR anchor always on top when objects are added
		const handleObjectAdded = () => {
			const qrAnchor = canvas.getObjects().find((obj) => obj.isQRanchor);
			if (qrAnchor) {
				canvas.bringObjectToFront(qrAnchor);
			}
			handleCanvasChange();
		};

		// Add event listeners for canvas changes
		canvas.on("object:added", handleObjectAdded);
		canvas.on("object:removed", handleCanvasChange);
		canvas.on("object:modified", handleCanvasChange);
		canvas.on("path:created", handleCanvasChange);

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
	// Show loading state while fetching design data for edit mode
	if (isEditing && isLoading) {
		return (
			<div className="select-none cursor-default">
				<DesignHeader
					certificateName={certificateName}
					setCertificateName={setCertificateName}
					isEditing={isEditing}
					onSave={handleSaveCertificate}
					onShare={handleShare}
				/>
				<div className="flex items-center justify-center h-96">
					<p className="text-lg">Loading design...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="select-none cursor-default">
			<DesignHeader
				certificateName={certificateName}
				setCertificateName={setCertificateName}
				isEditing={isEditing}
				onSave={handleSaveCertificate}
				onShare={handleShare}
			/>
			<CertificateCanvas
				activeMenu={activeMenu}
				setActiveMenu={setActiveMenu}
				selectedElement={selectedElement}
				onShapeAdd={handleShapeAdd}
				onTextAdd={handleTextAdd}
				onUpdateElement={handleUpdateElement}
				onDeleteElement={handleDeleteElement}
				onCanvasReady={handleCanvasReady}
				onBackgroundAdd={addBackgroundImage}
				onBackgroundRemove={removeBackgroundImage}
				onImageAdd={addImage}
				onBringForward={() => {
					if (!selectedElement || !canvasRef.current) return;
					canvasRef.current.bringObjectForward(selectedElement);
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
		</div>
	);
};

export { DesignPage };
