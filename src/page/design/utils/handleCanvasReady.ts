import * as fabric from "fabric";
export const handleCanvasReadyUtil = (
	canvas: fabric.Canvas,
	canvasRef: React.RefObject<fabric.Canvas | null>,
	designData: object | null,
	addQRanchor: () => void,
	setSelectedElement: (
		value: React.SetStateAction<fabric.FabricObject<
			Partial<fabric.FabricObjectProps>,
			fabric.SerializedObjectProps,
			fabric.ObjectEvents
		> | null>
	) => void
) => {
	canvasRef.current = canvas;

	// Enable keyboard interactions on canvas
	canvas.selection = true;
	canvas.preserveObjectStacking = true;

	// Load design data if available
	if (designData) {
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

			// Check if QR anchor already exists, if not add one
			const existingQRanchor = canvas
				.getObjects()
				.find((obj) => obj.isQRanchor);
			if (!existingQRanchor) {
				setTimeout(() => addQRanchor(), 100);
			} else {
				// Ensure existing QR anchor is on top
				canvas.bringObjectToFront(existingQRanchor);
			}

			canvas.requestRenderAll();
		});
	} else {
		// Add QR anchor for new canvas after a short delay
		setTimeout(() => addQRanchor(), 100);
	}

	// Keep QR anchor always on top when objects are added or reordered
	const ensureQRanchorOnTop = () => {
		const qrAnchor = canvas.getObjects().find((obj) => obj.isQRanchor);
		if (qrAnchor) {
			canvas.bringObjectToFront(qrAnchor);
			canvas.requestRenderAll();
		}
	};

	// Add event listeners
	canvas.on("object:added", ensureQRanchorOnTop);
	canvas.on("object:modified", ensureQRanchorOnTop);

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
