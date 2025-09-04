import * as fabric from 'fabric';
export const handleCanvasReadyUtil = (
	canvas: fabric.Canvas,
	canvasRef: React.RefObject<fabric.Canvas | null>,
	isEditing: boolean,
	designData: object | null,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	loadCanvasFromLocalStorage: () => any,
	saveCanvasToLocalStorage: () => void,
	setCertificateName: (value: React.SetStateAction<string>) => void,
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

	// Load design data if it's already available (edit mode)
	if (isEditing && designData) {
		canvas.loadFromJSON(designData).then((canvas) => {
			// Fix background image properties after restoration
			const backgroundImage = canvas
				.getObjects()
				.find((obj) => obj.id === 'background-image');
			if (backgroundImage) {
				backgroundImage.set({
					selectable: false,
					evented: false,
				});
				canvas.sendObjectToBack(backgroundImage);
			}
			canvas.requestRenderAll();
		});
	} else if (!isEditing) {
		// Load from local storage for create mode
		const storedData = loadCanvasFromLocalStorage();

		if (storedData) {
			setCertificateName(storedData.certificateName || '');
			if (storedData.canvasData) {
				canvas.loadFromJSON(storedData.canvasData).then((canvas) => {
					// Fix background image properties after restoration
					const backgroundImage = canvas
						.getObjects()
						.find((obj) => obj.id === 'background-image');
					if (backgroundImage) {
						backgroundImage.set({
							selectable: false,
							evented: false,
						});
						canvas.sendObjectToBack(backgroundImage);
					}

					// Check if QR anchor already exists, if not add one
					const existingQRanchor = canvas.getObjects().find((obj) => obj.isQRanchor);
					if (!existingQRanchor) {
						setTimeout(() => addQRanchor(), 100);
					}

					canvas.requestRenderAll();
				});
			} else {
				// Add QR anchor for new canvas after a short delay
				setTimeout(() => addQRanchor(), 100);
			}
		} else {
			// First time creating canvas - add QR anchor after a short delay
			setTimeout(() => addQRanchor(), 100);
		}
	}

	// Auto-save to local storage on canvas changes (create mode only)
	const handleCanvasChange = () => {
		if (!isEditing) {
			saveCanvasToLocalStorage();
		}
	};

	// Keep QR anchor always on top when objects are added
	const handleObjectAdded = () => {
		const qrAnchor = canvas.getObjects().find((obj) => obj.isQRanchor);
		if (qrAnchor) {
			canvas.bringObjectToFront(qrAnchor);
		}
		handleCanvasChange();
	};

	// Add event listeners for canvas changes
	canvas.on('object:added', handleObjectAdded);
	canvas.on('object:removed', handleCanvasChange);
	canvas.on('object:modified', handleCanvasChange);
	canvas.on('path:created', handleCanvasChange);

	canvas.on('selection:created', () => {
		const activeObject = canvas.getActiveObject();
		setSelectedElement(activeObject || null);
	});

	canvas.on('selection:updated', () => {
		const activeObject = canvas.getActiveObject();
		setSelectedElement(activeObject || null);
	});

	canvas.on('selection:cleared', () => {
		setSelectedElement(null);
	});
};
