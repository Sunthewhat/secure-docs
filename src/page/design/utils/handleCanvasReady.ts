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

			// Re-attach event handlers to anchor groups after loading
			const anchorGroups = canvas.getObjects().filter((obj) => {
				return obj.type === "group" && obj.id === "PLACEHOLDER-COLUMN";
			});

			anchorGroups.forEach((group) => {
				if (group.type === "group") {
					const fabricGroup = group as fabric.Group;

					// Re-attach the scaling event handler
					fabricGroup.on("scaling", function (this: fabric.Group) {
						const text = this.getObjects()[1] as fabric.Textbox;

						// Only scale the rectangle, keep text at original scale
						const groupScaleX = this.scaleX || 1;
						const groupScaleY = this.scaleY || 1;

						// Counter-scale the text to keep it at original size
						text.set({
							scaleX: 1 / groupScaleX,
							scaleY: 1 / groupScaleY,
						});
					});
				}
			});

			// Re-attach event handlers to regular textboxes to prevent vertical stretching
			const textboxes = canvas.getObjects().filter((obj) => {
				return (
					obj.type === "textbox" &&
					!obj.isAnchor &&
					!obj.isQRanchor &&
					!(obj.id as string)?.startsWith("PLACEHOLDER-")
				);
			});

			textboxes.forEach((textbox) => {
				const fabricTextbox = textbox as fabric.Textbox;

				// Re-attach the scaling event handler
				fabricTextbox.on("scaling", function (this: fabric.Textbox) {
					// Lock vertical scaling - always keep scaleY at 1
					this.set({
						scaleY: 1,
					});
				});
			});

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
