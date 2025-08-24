import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import * as fabric from "fabric";
import DesignHeader from "@/components/design/DesignHeader";
import CertificateCanvas from "@/components/design/CertificateCanvas";
import { Axios } from "@/util/axiosInstance";

// Ensure custom properties are registered
if (fabric.FabricObject) {
	fabric.FabricObject.customProperties =
		fabric.FabricObject.customProperties || [];
	const customProps = ["name", "id", "dbField", "isAnchor"];
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
	const location = useLocation();
	const canvasRef = useRef<fabric.Canvas | null>(null);
	const [certificateName, setCertificateName] = useState("");
	const [activeMenu, setActiveMenu] = useState<
		"background" | "element" | "text" | "anchor" | null
	>("element");
	const [selectedElement, setSelectedElement] =
		useState<fabric.Object | null>(null);
	const [, setForceUpdate] = useState({});

	// Edit mode state
	const [isEditing, setIsEditing] = useState(false);
	const [certificateId, setCertificateId] = useState<string | null>(null);

	// Check for edit mode from navigation state
	useEffect(() => {
		if (location.state?.isEditing) {
			setIsEditing(true);
			setCertificateId(location.state.certificateId);
		}
	}, [location.state]);

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
				void navigate(`/share/${certId}`);
			} else {
				alert(response.data?.msg || "Failed to save certificate");
			}
		} catch (error) {
			console.error("Save failed:", error);
			alert("Failed to save certificate. Please try again.");
		}
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

			// Debug: Check custom properties
			console.log(
				"Custom properties:",
				fabric.FabricObject.customProperties
			);

			// Debug: Check individual objects
			canvas.getObjects().forEach((obj, i) => {
				console.log(`Object ${i}:`, {
					type: obj.type,
					id: (obj as any).id,
					dbField: (obj as any).dbField,
					isAnchor: (obj as any).isAnchor,
				});
			});

			const fabricDesign = canvas.toJSON();
			console.log("Fabric design:", fabricDesign);

			const payload = {
				name: certificateName,
				design: JSON.stringify(fabricDesign),
			};
			console.log("Payload:", payload);

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
				alert(
					isEditing
						? "Certificate updated successfully!"
						: "Certificate saved successfully!"
				);
				if (isEditing) {
					void navigate("/share");
				}
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
				fabricObject = new fabric.Textbox("{{COLUMN}}", {
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
			/>
		</div>
	);
};

export { DesignPage };
