import * as fabric from "fabric";

export const addElement = (
	canvasRef: React.RefObject<fabric.Canvas | null>,
	type: string,
	setSelectedElement: React.Dispatch<
		React.SetStateAction<fabric.FabricObject<
			Partial<fabric.FabricObjectProps>,
			fabric.SerializedObjectProps,
			fabric.ObjectEvents
		> | null>
	>
) => {
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
		case "line": {
			const lineWidth = 100;
			const lineHeight = 0;

			fabricObject = new fabric.Line([0, 0, lineWidth, lineHeight], {
				left: 100,
				top: 100,
				stroke: color,
				strokeWidth: 3,
				fill: "",
				originX: "left",
				originY: "top",
			});

			// Add event handler to maintain line aspect ratio during scaling
			fabricObject.on("scaling", function (this: fabric.Line) {
				// For a horizontal line, always reset scaleY to 1 to keep it straight
				this.scaleY = 1;
			});
			break;
		}
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
		case "anchor": {
			// Create a rectangle with dashed border and embedded text
			fabricObject = new fabric.Rect({
				left: 100,
				top: 100,
				width: 150,
				height: 40,
				fill: "transparent",
				stroke: "#000000",
				strokeWidth: 2,
				strokeDashArray: [5, 5],
				// Custom properties for database field mapping
				dbField: "column",
				isAnchor: true,
				id: "PLACEHOLDER-COLUMN",
			});

			// Store text as a property that we'll render separately
			const anchorText = new fabric.Textbox("COLUMN", {
				left: 100 + 75,
				top: 100 + 20,
				width: 150,
				fontSize: 16,
				fill: "#000000",
				fontFamily: "Arial",
				textAlign: "center",
				originX: "center",
				originY: "center",
				// Custom properties for database field mapping
				dbField: "column",
				isAnchor: true,
				// Lock text editing and scaling on canvas
				editable: false,
				lockScalingX: true,
				lockScalingY: true,
				lockMovementX: true,
				lockMovementY: true,
				selectable: false,
				evented: false,
				hasControls: false,
				id: "PLACEHOLDER-COLUMN-TEXT",
			});

			// Add both objects to canvas
			canvasRef.current.add(fabricObject);
			canvasRef.current.add(anchorText);

			// Link them together - when rect moves/scales, update text position
			fabricObject.on("moving", function (this: fabric.Rect) {
				anchorText.set({
					left:
						(this.left || 0) +
						((this.width || 150) * (this.scaleX || 1)) / 2,
					top:
						(this.top || 0) +
						((this.height || 40) * (this.scaleY || 1)) / 2,
				});
				anchorText.setCoords();
			});

			fabricObject.on("scaling", function (this: fabric.Rect) {
				anchorText.set({
					left:
						(this.left || 0) +
						((this.width || 150) * (this.scaleX || 1)) / 2,
					top:
						(this.top || 0) +
						((this.height || 40) * (this.scaleY || 1)) / 2,
				});
				anchorText.setCoords();
			});

			fabricObject.on("rotating", function (this: fabric.Rect) {
				anchorText.set({
					angle: this.angle || 0,
				});
				anchorText.setCoords();
			});

			// When rectangle is removed, remove text too
			fabricObject.on("removed", function () {
				canvasRef.current?.remove(anchorText);
			});

			canvasRef.current.setActiveObject(fabricObject);
			canvasRef.current.renderAll();
			setSelectedElement(fabricObject);
			return;
		}
		default: {
			// Handle signature with signer ID
			if (type.startsWith("signature-")) {
				console.log(type);

				// Parse signerId and displayName from the format: "signature-{id}-{displayName}"
				const parts = type.replace("signature-", "").split("-");

				let signerId = "";
				for (let i = 0; i < 5; i++)
					signerId += i < 4 ? parts[i] + "-" : parts[i];

				let displayName = "";
				for (let i = 5; i < parts.length; i++)
					displayName +=
						i < parts.length - 1 ? parts[i] + "-" : parts[i];

				// Create a rectangle with 16:9 aspect ratio (landscape)
				const width = 320;
				const height = 180; // 320 / 16 * 9 = 180

				const signatureRect = new fabric.Rect({
					left: 0,
					top: 0,
					width: width,
					height: height,
					fill: "#00000040", // Light blue background
					stroke: "#FFFFFF",
					strokeWidth: 2,
					strokeDashArray: [5, 5], // Dashed border
					selectable: false,
					evented: false,
				});

				// Create text to display the signer's name
				const signatureText = new fabric.Textbox(displayName, {
					left: width / 2,
					top: height / 2,
					fontSize: 24,
					fill: "#000000",
					fontFamily: "Arial",
					textAlign: "center",
					originX: "center",
					originY: "center",
					selectable: false,
					evented: false,
					editable: false,
					width: width - 20,
				});

				// Group the rectangle and text together
				fabricObject = new fabric.Group(
					[signatureRect, signatureText],
					{
						left: 100,
						top: 100,
						id: `SIGNATURE-${signerId}`,
						lockRotation: false,
					}
				);

				// Add custom properties after creation
				(
					fabricObject as fabric.Group & { isSignature: boolean }
				).isSignature = true;

				// Add event handler to maintain 16:9 aspect ratio during scaling
				fabricObject.on("scaling", function (this: fabric.Group) {
					const aspectRatio = 16 / 9;

					// Calculate new dimensions based on the original group size
					const currentWidth =
						(this.width || width) * (this.scaleX || 1);
					const currentHeight =
						(this.height || height) * (this.scaleY || 1);

					// Determine which dimension to use as base
					const widthChange = Math.abs(currentWidth - width);
					const heightChange = Math.abs(currentHeight - height);

					if (widthChange > heightChange) {
						// Width changed more, adjust height
						const targetHeight = currentWidth / aspectRatio;
						this.scaleY = targetHeight / (this.height || height);
					} else {
						// Height changed more, adjust width
						const targetWidth = currentHeight * aspectRatio;
						this.scaleX = targetWidth / (this.width || width);
					}
				});
			} else {
				return;
			}
		}
	}

	canvasRef.current.add(fabricObject);
	canvasRef.current.setActiveObject(fabricObject);
	canvasRef.current.renderAll();
	setSelectedElement(fabricObject);
};
