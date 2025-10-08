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

			// Bring all signature elements to front
			const signatures = canvas.getObjects().filter((obj) => {
				const id = obj.get("id") as string;
				return (
					obj.type === "textbox" &&
					id &&
					!id.startsWith("PLACEHOLDER-") &&
					!obj.isAnchor &&
					!obj.isQRanchor
				);
			});
			signatures.forEach((signature) => {
				canvas.bringObjectToFront(signature);
			});

			// Ensure QR anchor is still on top after signatures
			if (existingQRanchor) {
				canvas.bringObjectToFront(existingQRanchor);
			}

			canvas.requestRenderAll();
		});
	} else {
		// Add QR anchor for new canvas after a short delay
		setTimeout(() => addQRanchor(), 100);
	}

	// Keep QR anchor and signatures always on top when objects are added or reordered
	const ensureQRanchorAndSignaturesOnTop = () => {
		const objects = canvas.getObjects();

		// Find QR anchor
		const qrAnchor = objects.find((obj) => obj.isQRanchor);

		// Find signature elements (text elements with IDs that don't start with "PLACEHOLDER-")
		const signatures = objects.filter((obj) => {
			const id = obj.get("id") as string;
			return (
				obj.type === "textbox" &&
				id &&
				!id.startsWith("PLACEHOLDER-") &&
				!obj.isAnchor &&
				!obj.isQRanchor
			);
		});

		// Bring signatures to front first
		signatures.forEach((signature) => {
			canvas.bringObjectToFront(signature);
		});

		// Then bring QR anchor to front (so it's above signatures)
		if (qrAnchor) {
			canvas.bringObjectToFront(qrAnchor);
		}

		canvas.requestRenderAll();
	};

	// Add event listeners
	canvas.on("object:added", ensureQRanchorAndSignaturesOnTop);
	canvas.on("object:modified", ensureQRanchorAndSignaturesOnTop);

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
