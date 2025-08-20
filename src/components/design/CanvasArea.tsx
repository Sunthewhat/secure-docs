import * as fabric from "fabric";
import { useEffect, useRef } from "react";

interface CanvasAreaProps {
	onCanvasReady: (canvas: fabric.Canvas) => void;
}

const CanvasArea = ({ onCanvasReady }: CanvasAreaProps) => {
	const canvasElRef = useRef<HTMLCanvasElement>(null);
	const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

	useEffect(() => {
		if (!canvasElRef.current) return;

		if (fabricCanvasRef.current) return;

		const canvas = new fabric.Canvas(canvasElRef.current, {
			width: 883,
			height: 600,
			backgroundColor: "#f9fafb",
			selection: true,
		});

		fabricCanvasRef.current = canvas;

		return () => {
			if (fabricCanvasRef.current) {
				void fabricCanvasRef.current.dispose();
				fabricCanvasRef.current = null;
			}
		};
	}, []);

	useEffect(() => {
		if (fabricCanvasRef.current) {
			onCanvasReady(fabricCanvasRef.current);
		}
	}, [onCanvasReady]);

	return (
		<div className="flex-1 p-4">
			<div className="mx-auto shadow-lg border-2 border-gray-300 rounded-lg overflow-hidden">
				<canvas ref={canvasElRef} width={883} height={600} />
			</div>
		</div>
	);
};

export default CanvasArea;
