import * as fabric from "fabric";
import { useEffect, useRef, useCallback } from "react";

interface CanvasAreaProps {
	onCanvasReady: (canvas: fabric.Canvas) => void;
	showGrid: boolean;
	snapToGrid: boolean;
	gridSize: number;
}

const CanvasArea = ({ onCanvasReady, showGrid, snapToGrid, gridSize }: CanvasAreaProps) => {
	const canvasElRef = useRef<HTMLCanvasElement>(null);
	const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
	const onCanvasReadyRef = useRef(onCanvasReady);
	const gridLinesRef = useRef<fabric.Group | null>(null);

	// Keep the callback ref updated
	useEffect(() => {
		onCanvasReadyRef.current = onCanvasReady;
	}, [onCanvasReady]);

	// Function to create grid lines
	const createGrid = useCallback(
		(canvas: fabric.Canvas) => {
			const canvasWidth = canvas.getWidth();
			const canvasHeight = canvas.getHeight();
			const lines: fabric.Line[] = [];
			const centerX = canvasWidth / 2;
			const centerY = canvasHeight / 2;

			// Regular grid lines first
			for (let i = 0; i <= canvasWidth; i += gridSize) {
				const line = new fabric.Line([i, 0, i, canvasHeight], {
					stroke: "#8b5cf6",
					strokeWidth: 1,
					opacity: 0.3,
					selectable: false,
					evented: false,
					excludeFromExport: true,
					hoverCursor: "default",
					moveCursor: "default",
				});
				lines.push(line);
			}

			for (let i = 0; i <= canvasHeight; i += gridSize) {
				const line = new fabric.Line([0, i, canvasWidth, i], {
					stroke: "#8b5cf6",
					strokeWidth: 1,
					opacity: 0.3,
					selectable: false,
					evented: false,
					excludeFromExport: true,
					hoverCursor: "default",
					moveCursor: "default",
				});
				lines.push(line);
			}

			// Add center lines separately to ensure they're exactly centered
			const verticalCenterLine = new fabric.Line([centerX, 0, centerX, canvasHeight], {
				stroke: "#7c3aed",
				strokeWidth: 2,
				opacity: 1,
				selectable: false,
				evented: false,
				excludeFromExport: true,
				hoverCursor: "default",
				moveCursor: "default",
			});
			lines.push(verticalCenterLine);

			const horizontalCenterLine = new fabric.Line([0, centerY, canvasWidth, centerY], {
				stroke: "#7c3aed",
				strokeWidth: 2,
				opacity: 1,
				selectable: false,
				evented: false,
				excludeFromExport: true,
				hoverCursor: "default",
				moveCursor: "default",
			});
			lines.push(horizontalCenterLine);

			const grid = new fabric.Group(lines, {
				selectable: false,
				evented: false,
				excludeFromExport: true,
				hoverCursor: "default",
				moveCursor: "default",
				id: "grid-lines",
			});

			return grid;
		},
		[gridSize]
	);

	// Function to snap object to center lines when near
	const snapToCenterLines = useCallback((obj: fabric.Object, canvas: fabric.Canvas) => {
		const canvasWidth = canvas.getWidth();
		const canvasHeight = canvas.getHeight();
		const centerX = canvasWidth / 2;
		const centerY = canvasHeight / 2;
		const snapThreshold = 10; // Snap when within 10 pixels of center lines

		const objLeft = obj.left || 0;
		const objTop = obj.top || 0;
		const objWidth = obj.getScaledWidth();
		const objHeight = obj.getScaledHeight();
		const objCenterX = objLeft + objWidth / 2;
		const objCenterY = objTop + objHeight / 2;
		const objRight = objLeft + objWidth;
		const objBottom = objTop + objHeight;

		let snappedLeft = objLeft;
		let snappedTop = objTop;

		// Snap to vertical center line (check left edge, center, and right edge)
		if (Math.abs(objLeft - centerX) <= snapThreshold) {
			// Left edge to center
			snappedLeft = centerX;
		} else if (Math.abs(objCenterX - centerX) <= snapThreshold) {
			// Object center to center
			snappedLeft = centerX - objWidth / 2;
		} else if (Math.abs(objRight - centerX) <= snapThreshold) {
			// Right edge to center
			snappedLeft = centerX - objWidth;
		}

		// Snap to horizontal center line (check top edge, center, and bottom edge)
		if (Math.abs(objTop - centerY) <= snapThreshold) {
			// Top edge to center
			snappedTop = centerY;
		} else if (Math.abs(objCenterY - centerY) <= snapThreshold) {
			// Object center to center
			snappedTop = centerY - objHeight / 2;
		} else if (Math.abs(objBottom - centerY) <= snapThreshold) {
			// Bottom edge to center
			snappedTop = centerY - objHeight;
		}

		return { left: snappedLeft, top: snappedTop };
	}, []);

	useEffect(() => {
		const canvasElement = canvasElRef.current;
		if (!canvasElement) return;

		if (fabricCanvasRef.current) return;

		const canvas = new fabric.Canvas(canvasElement, {
			width: 850,
			height: 601,
			selection: true,
		});

		// Set white background color - using set() method for better compatibility
		canvas.set("backgroundColor", "#ffffff").requestRenderAll();
		canvas.renderAll();

		// Store current values for event handlers
		const currentSnapToGrid = snapToGrid;
		const currentSnapToCenterLines = snapToCenterLines;

		// Add snap-to-center-lines functionality
		const handleObjectMoving = (e: fabric.TEvent) => {
			if (currentSnapToGrid && (e as any).target) {
				const obj = (e as any).target as fabric.Object;
				const snapped = currentSnapToCenterLines(obj, canvas);
				obj.set({
					left: snapped.left,
					top: snapped.top,
				});
				canvas.renderAll();
			}
		};

		const handleObjectScaling = (e: fabric.TEvent) => {
			if (currentSnapToGrid && (e as any).target) {
				const obj = (e as any).target as fabric.Object;
				const snapped = currentSnapToCenterLines(obj, canvas);
				obj.set({
					left: snapped.left,
					top: snapped.top,
				});
				canvas.renderAll();
			}
		};

		canvas.on("object:moving", handleObjectMoving);
		canvas.on("object:scaling", handleObjectScaling);

		fabricCanvasRef.current = canvas;

		// Call onCanvasReady immediately after canvas creation using ref
		onCanvasReadyRef.current(canvas);

		return () => {
			if (fabricCanvasRef.current) {
				fabricCanvasRef.current.off("object:moving", handleObjectMoving);
				fabricCanvasRef.current.off("object:scaling", handleObjectScaling);
				void fabricCanvasRef.current.dispose();
				fabricCanvasRef.current = null;
			}
		};
	}, [snapToGrid, snapToCenterLines]); // Dependencies for snap functionality

	// Handle grid visibility changes
	useEffect(() => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		// Remove existing grid
		if (gridLinesRef.current) {
			canvas.remove(gridLinesRef.current);
			gridLinesRef.current = null;
		}

		// Add grid if showGrid is true
		if (showGrid) {
			const grid = createGrid(canvas);
			gridLinesRef.current = grid;
			canvas.add(grid);
			canvas.sendObjectToBack(grid);

			// Ensure grid stays behind other objects but visible
			canvas.on("after:render", () => {
				if (gridLinesRef.current) {
					canvas.sendObjectToBack(gridLinesRef.current);
				}
			});

			canvas.renderAll();
		} else {
			canvas.renderAll();
		}
	}, [showGrid, gridSize, createGrid]);

	return (
		<div className="flex-1 p-4">
			<div className="mx-auto shadow-lg border-2 border-gray-300 rounded-lg overflow-hidden w-fit bg-white">
				<canvas ref={canvasElRef} width={850} height={601} />
			</div>
		</div>
	);
};

export default CanvasArea;
