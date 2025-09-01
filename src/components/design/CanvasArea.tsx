import * as fabric from "fabric";
import { useEffect, useRef } from "react";

interface CanvasAreaProps {
	onCanvasReady: (canvas: fabric.Canvas) => void;
}

const CanvasArea = ({ onCanvasReady }: CanvasAreaProps) => {
	const canvasElRef = useRef<HTMLCanvasElement>(null);
	const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
	const onCanvasReadyRef = useRef(onCanvasReady);

	// Keep the callback ref updated
	useEffect(() => {
		onCanvasReadyRef.current = onCanvasReady;
	}, [onCanvasReady]);

	useEffect(() => {
		const canvasElement = canvasElRef.current;
		if (!canvasElement) return;

		if (fabricCanvasRef.current) return;

		const canvas = new fabric.Canvas(canvasElement, {
			width: 850,
			height: 601,
			backgroundColor: "#f9fafb",
			selection: true,
		});

		fabricCanvasRef.current = canvas;

		// Call onCanvasReady immediately after canvas creation using ref
		onCanvasReadyRef.current(canvas);

		return () => {
			if (fabricCanvasRef.current) {
				void fabricCanvasRef.current.dispose();
				fabricCanvasRef.current = null;
			}
		};
	}, []); // No dependencies to prevent canvas recreation

	return (
		<div className="flex-1 p-4">
			<div className="mx-auto shadow-lg border-2 border-gray-300 rounded-lg overflow-hidden w-fit">
				<canvas ref={canvasElRef} width={850} height={601} />
			</div>
		</div>
	);
};

export default CanvasArea;
