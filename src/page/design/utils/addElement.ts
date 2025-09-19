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
		case "anchor": {
			// Create a rectangle with dashed border
			const anchorBorder = new fabric.Rect({
				left: 100,
				top: 100,
				width: 150,
				height: 40,
				fill: "transparent",
				stroke: "#000000",
				strokeWidth: 2,
				strokeDashArray: [5, 5], // Dashed border
				selectable: false,
				evented: false,
			});

			// Create text without border
			const anchorText = new fabric.Textbox("COLUMN", {
				left: 100,
				top: 110,
				width: 150,
				fontSize: 16,
				fill: "#000000",
				fontFamily: "Arial",
				textAlign: "center",
				// Custom properties for database field mapping
				dbField: "column",
				isAnchor: true,
				// Lock text editing on canvas
				editable: false,
				selectable: false,
				evented: false,
				id: "PLACEHOLDER-COLUMN",
			});

			// Group them together
			fabricObject = new fabric.Group([anchorBorder, anchorText], {
				left: 100,
				top: 100,
				selectable: true,
				evented: true,
				dbField: "column",
				isAnchor: true,
				id: "PLACEHOLDER-COLUMN",
			});
			break;
		}
		default:
			return;
	}

	canvasRef.current.add(fabricObject);
	canvasRef.current.setActiveObject(fabricObject);
	canvasRef.current.renderAll();
	setSelectedElement(fabricObject);
};
