import { ToastContextType } from '@/components/toast/ToastContext';
import * as fabric from 'fabric';
export const addBackgroundImageUtil = (
	canvasRef: React.RefObject<fabric.Canvas | null>,
	imageUrl: string,
	toast: ToastContextType
) => {
	if (!canvasRef.current) return;

	fabric.FabricImage.fromURL(imageUrl, {
		crossOrigin: 'anonymous', // Handle CORS for external images
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
				id: 'background-image',
			});

			// Remove existing background if any
			const existingBg = canvas.getObjects().find((obj) => obj.id === 'background-image');
			if (existingBg) {
				canvas.remove(existingBg);
			}

			canvas.add(img);
			canvas.sendObjectToBack(img); // Send to back to act as background
			canvas.renderAll();
		})
		.catch((error) => {
			console.error('Error loading image:', error);
			toast.error('Failed to load background image.'); // ✅
		});
};
