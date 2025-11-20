import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type ChangeEvent,
	type PointerEvent as ReactPointerEvent,
} from "react";
import { Axios } from "@/util/axiosInstance";
import { useParams } from "react-router-dom";
import * as fabric from "fabric";
// Ensure Fabric custom properties are known (helps when loading saved designs)
if ((fabric as any).FabricObject) {
  (fabric as any).FabricObject.customProperties =
    (fabric as any).FabricObject.customProperties || [];
  const customProps = ["name", "id", "dbField", "isAnchor", "isQRanchor", "undeleteable"];
  for (const prop of customProps) {
    if (!(fabric as any).FabricObject.customProperties.includes(prop)) {
      (fabric as any).FabricObject.customProperties.push(prop);
    }
  }
}
import { type Certificate, type GetCertificateResponse } from "@/types/response";

const OUTPUT_WIDTH = 800;
const OUTPUT_HEIGHT = 450;
const WORKING_WIDTH = 640;
const WORKING_HEIGHT = 360;
const DISPLAY_WIDTH = 320;
const STROKE_WIDTH_OPTIONS = [4, 8, 12] as const;
type StrokeWidth = (typeof STROKE_WIDTH_OPTIONS)[number];

const SignaturePage = () => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const contextRef = useRef<CanvasRenderingContext2D | null>(null);
	// Fabric canvas for certificate preview
	const certificateCanvasRef = useRef<fabric.Canvas | null>(null);
	const signatureImageRef = useRef<fabric.Image | null>(null);
	const signatureOverlayRef = useRef<HTMLImageElement | null>(null);
	const devicePixelRatioRef = useRef<number>(Math.min(window.devicePixelRatio || 1, 2));
	const isPenActiveRef = useRef<boolean>(false); // Track if Apple Pencil is being used
	const [isDrawing, setIsDrawing] = useState(false);
	const [signatureColor, setSignatureColor] = useState<"black" | "white" | "blue">(
		"black"
	);
	const [strokeWidth, setStrokeWidth] = useState<StrokeWidth>(STROKE_WIDTH_OPTIONS[0]);
	const [hasManualChanges, setHasManualChanges] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const savedSignatureRef = useRef<string | null>(null);
	const signatureOriginRef = useRef<"draw" | "upload">("draw");
	const [signatureId, setSignatureId] = useState<string | null>(null);
	const [signerId, setSignerId] = useState<string | null>(null);
	const [isSigned, setIsSigned] = useState(false);
	const [signerName, setSignerName] = useState<string>("");
	const [certificate, setCertificate] = useState<Certificate | null>(null);
	const [loadingCertificate, setLoadingCertificate] = useState<boolean>(false);
	const lastPreviewUpdateRef = useRef<number>(0);
	const PREVIEW_THROTTLE_MS = 33; // ~30 FPS real-time preview

	const { certificateId } = useParams();

	useEffect(() => {
		const fetchSignerData = async () => {
			if (!certificateId) return;

			try {
				const response = await Axios.get(`/signature/signer/${certificateId}`);
				if (response.data.success) {
					const { signature, signer } = response.data.data;
					setSignatureId(signature.id);
					setSignerId(signer.id);
					setIsSigned(signature.is_signed);
					setSignerName(signer.display_name);
				}
			} catch (error) {
				console.error("Failed to fetch signer data", error);
				setUploadError("Failed to load signature data. Please refresh the page.");
			}
		};

		void fetchSignerData();
	}, [certificateId]);

	const initializeCertificateCanvas = useCallback(() => {
		if (!certificate?.design) return;

		if (certificateCanvasRef.current) {
			certificateCanvasRef.current.dispose();
			certificateCanvasRef.current = null;
		}

		const canvasElement = document.getElementById(
			"signature-preview-canvas"
		) as HTMLCanvasElement | null;
		const containerElement = document.getElementById(
			"signature-certificate-preview"
		) as HTMLDivElement | null;

		if (!canvasElement || !containerElement) return;

		const containerRect = containerElement.getBoundingClientRect();
		const containerWidth = containerRect.width;
		const originalWidth = 850;
		const originalHeight = 601;
		const designAspectRatio = originalWidth / originalHeight;

		const canvasWidth = containerWidth;
		const canvasHeight = Math.max(1, canvasWidth / designAspectRatio);

		const canvas = new fabric.Canvas(canvasElement, {
			width: canvasWidth,
			height: canvasHeight,
			selection: false,
		});
		canvasElement.style.maxWidth = "100%";
		canvasElement.style.maxHeight = "100%";
		canvasElement.style.width = "auto";
		canvasElement.style.height = "auto";
		certificateCanvasRef.current = canvas;

		try {
			const designData = JSON.parse(certificate.design);
			canvas
				.loadFromJSON(designData)
				.then(() => {
					const scaleX = canvasWidth / originalWidth;
					const scaleY = canvasHeight / originalHeight;
					const scale = Math.min(scaleX, scaleY, 1);

					const objects = canvas.getObjects();
					objects.forEach((obj) => {
						obj.canvas = canvas;
						obj.dirty = true;
						obj.set({
							left: (obj.left || 0) * scale,
							top: (obj.top || 0) * scale,
							scaleX: (obj.scaleX || 1) * scale,
							scaleY: (obj.scaleY || 1) * scale,
							selectable: false,
							evented: false,
							visible: true,
							opacity: 1,
						});

						obj.setCoords();
					});

					canvas.calcOffset();
					canvas.requestRenderAll();
					canvas.renderAll();

					requestAnimationFrame(() => {
						if (certificateCanvasRef.current) {
							certificateCanvasRef.current.calcOffset();
							certificateCanvasRef.current.renderAll();

							requestAnimationFrame(() => {
								certificateCanvasRef.current?.renderAll();
							});
						}
					});

					if (savedSignatureRef.current) {
						setTimeout(() => {
							void applySignatureToPreview(savedSignatureRef.current!);
						}, 200);
					}
				})
				.catch((e) => {
					console.error("Error loading certificate design for signature preview:", e);
				});
		} catch (e) {
			console.error("Error parsing certificate design for signature preview:", e);
		}
					}, [certificate]);

	useEffect(() => {
		initializeCertificateCanvas();
		return () => {
			if (certificateCanvasRef.current) {
				certificateCanvasRef.current.dispose();
				certificateCanvasRef.current = null;
			}
		};
	}, [initializeCertificateCanvas]);

	// Resize observer similar to PreviewPage to keep canvas responsive
	useEffect(() => {
		const containerElement = document.getElementById("signature-certificate-preview");
		if (!containerElement || !certificateCanvasRef.current || !certificate?.design) return;

		const resizeCanvas = () => {
			if (!certificateCanvasRef.current || !certificate?.design) return;
			const canvas = certificateCanvasRef.current;
			const containerRect = containerElement.getBoundingClientRect();
			const containerWidth = containerRect.width;
			if (containerWidth <= 0) return;

			const originalWidth = 850;
			const originalHeight = 601;
			const designAspectRatio = originalWidth / originalHeight;

			const newWidth = containerWidth;
			const newHeight = Math.max(1, newWidth / designAspectRatio);

			const scaleX = newWidth / originalWidth;
			const scaleY = newHeight / originalHeight;
			const scale = Math.min(scaleX, scaleY, 1);

			canvas.setDimensions({ width: newWidth, height: newHeight });

			try {
				const designData = JSON.parse(certificate.design);
				canvas.loadFromJSON(designData).then(() => {
					canvas.getObjects().forEach((obj) => {
						obj.canvas = canvas;
						obj.dirty = true;
						obj.set({
							left: (obj.left || 0) * scale,
							top: (obj.top || 0) * scale,
							scaleX: (obj.scaleX || 1) * scale,
							scaleY: (obj.scaleY || 1) * scale,
							selectable: false,
							evented: false,
							visible: true,
							opacity: 1,
						});
						obj.setCoords();
					});

					canvas.calcOffset();
					canvas.requestRenderAll();
					canvas.renderAll();

					requestAnimationFrame(() => {
						canvas.renderAll();
					});

					if (savedSignatureRef.current) {
						setTimeout(() => {
							void applySignatureToPreview(savedSignatureRef.current!);
						}, 200);
					}

				});
			} catch {
				// ignore
			}
		};

		let resizeTimeout: NodeJS.Timeout;
		const observer = new ResizeObserver(() => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(resizeCanvas, 150);
		});
		observer.observe(containerElement);

		return () => {
			clearTimeout(resizeTimeout);
			observer.disconnect();
		};
		}, [certificate]);

// Ensure overlay is applied once signerId becomes available

async function applySignatureToPreview(dataUrl: string) {
  if (!certificate) return;
  const container = document.getElementById("signature-certificate-preview");
  const overlay = signatureOverlayRef.current;
  if (!container || !overlay) return;

  overlay.style.position = "absolute";
  overlay.style.pointerEvents = "none";

  // Prefer reading live bounds from the Fabric canvas for perfect alignment
  const canvas = certificateCanvasRef.current;
  let sigBounds: { left: number; top: number; width: number; height: number } | null = null;

  if (canvas) {
    const objs = canvas.getObjects();
    let targetObj: fabric.Object | null = null;

    // Priority 1: exact SIGNATURE-<signerId>
    if (signerId) {
      targetObj = (objs.find((o) => (o as any).id === `SIGNATURE-${signerId}`) as fabric.Object) || null;
    }
    // Priority 2: any SIGNATURE- group/object
    if (!targetObj) {
      targetObj = (objs.find((o) => typeof (o as any).id === 'string' && (o as any).id.startsWith('SIGNATURE-')) as fabric.Object) || null;
    }
    // Priority 3: heuristic 16:9 rect (non-anchor)
    if (!targetObj) {
      const approx = (a: number, b: number, tol = 0.25) => Math.abs(a - b) <= tol;
      targetObj = (objs.find((o) => {
        if ((o as any).isAnchor) return false;
        if (o.type === 'group') {
          const g = o as fabric.Group;
          const kids = g.getObjects?.() ?? [];
          const rect = kids.find((k) => k.type === 'rect') as fabric.Rect | undefined;
          if (!rect) return false;
          const w = (rect.width || 0) * ((rect.scaleX as number) || 1);
          const h = (rect.height || 0) * ((rect.scaleY as number) || 1);
          if (w <= 0 || h <= 0) return false;
          return approx(w / h, 16 / 9, 0.3);
        }
        return false;
      }) as fabric.Object) || null;
    }

    if (targetObj) {
      // If the target is a group, prefer the inner rect bounds
      let rectBounds: { left: number; top: number; width: number; height: number } | null = null;
      if (targetObj.type === 'group') {
        const g = targetObj as fabric.Group;
        const rect = (g.getObjects?.() ?? []).find((k) => k.type === 'rect') as fabric.Object | undefined;
        if (rect && rect.getBoundingRect) {
          const br = rect.getBoundingRect();
          rectBounds = { left: br.left, top: br.top, width: br.width, height: br.height };
        }
      }
      const br = rectBounds ?? targetObj.getBoundingRect();
      sigBounds = { left: br.left, top: br.top, width: br.width, height: br.height };
    }
  }

  // If canvas probing failed, fall back to JSON-based computation
  if (!sigBounds) {
    try {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const design = JSON.parse(certificate.design);
      const objects: any[] = Array.isArray(design.objects) ? design.objects : [];
      const candidates = objects.filter((obj) => typeof obj?.id === 'string' && obj.id.startsWith('SIGNATURE-'));
      let target: any | null = null;
      if (candidates.length > 0) {
        target = signerId ? (candidates.find((o: any) => o.id === `SIGNATURE-${signerId}`) || candidates[0]) : candidates[0];
      } else {
        target = objects.find((obj: any) => {
          if (obj.type !== 'group') return false;
          if (obj.id && typeof obj.id === 'string' && obj.id.startsWith('PLACEHOLDER-')) return false;
          if (obj.isAnchor) return false;
          const kids: any[] = Array.isArray(obj.objects) ? obj.objects : [];
          const rect = kids.find((k) => k.type === 'rect');
          if (!rect) return false;
          const w = (rect.width || 0) * (rect.scaleX || 1);
          const h = (rect.height || 0) * (rect.scaleY || 1);
          if (w <= 0 || h <= 0) return false;
          const ar = w / h;
          return Math.abs(ar - 16 / 9) <= 0.25;
        }) || null;
      }

      if (target) {
        const originalWidth = 850;
        const originalHeight = 601;
        const scaleX = containerWidth / originalWidth;
        const scaleY = containerHeight / originalHeight;
        const left = (target.left || 0) * scaleX;
        const top = (target.top || 0) * scaleY;
        const width = (target.width || 0) * (target.scaleX || 1) * scaleX;
        const height = (target.height || 0) * (target.scaleY || 1) * scaleY;
        sigBounds = { left, top, width, height };
      }
    } catch {
      // ignore parsing errors
    }
  }

  const CANVAS_AR = OUTPUT_HEIGHT / OUTPUT_WIDTH; // 450/800 = 0.5625
  if (sigBounds) {
    const fitScale = Math.min(sigBounds.width / OUTPUT_WIDTH, sigBounds.height / OUTPUT_HEIGHT);
    const sigWidth = OUTPUT_WIDTH * fitScale;
    const sigHeight = sigWidth * CANVAS_AR;
    const left = sigBounds.left + (sigBounds.width - sigWidth) / 2;
    const top = sigBounds.top + (sigBounds.height - sigHeight) / 2;
    // Export higher-resolution data for crisp preview (clamped to source size)
    const dpr = devicePixelRatioRef.current || 1;
    const targetW = Math.max(1, Math.floor(sigWidth * dpr));
    const targetH = Math.max(1, Math.floor(sigHeight * dpr));
    const src = canvasRef.current;
    let hd: string | null = null;
    if (src) {
      const srcW = src.width;
      const srcH = src.height;
      const scale = Math.min(1, srcW / targetW, srcH / targetH);
      const outW = Math.max(1, Math.floor(targetW * scale));
      const outH = Math.max(1, Math.floor(targetH * scale));
      const ex = document.createElement('canvas');
      ex.width = outW;
      ex.height = outH;
      const ctx = ex.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, outW, outH);
        ctx.drawImage(src, 0, 0, outW, outH);
        hd = ex.toDataURL('image/png');
      }
    }
    overlay.src = hd ?? dataUrl;
    overlay.style.left = `${left}px`;
    overlay.style.top = `${top}px`;
    overlay.style.width = `${sigWidth}px`;
    overlay.style.height = `${sigHeight}px`;
    overlay.style.display = "block";
    toggleSignaturePlaceholders(false);
    return;
  }

  // Fallback bottom-center in container
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  const sigWidth = containerWidth * 0.35;
  const sigHeight = sigWidth * CANVAS_AR;
  const left = (containerWidth - sigWidth) / 2;
  const top = containerHeight - sigHeight - 24;
  const dpr = devicePixelRatioRef.current || 1;
  const targetW = Math.max(1, Math.floor(sigWidth * dpr));
  const targetH = Math.max(1, Math.floor(sigHeight * dpr));
  let hd: string | null = null;
  {
    const src = canvasRef.current;
    if (src) {
      const srcW = src.width;
      const srcH = src.height;
      const scale = Math.min(1, srcW / targetW, srcH / targetH);
      const outW = Math.max(1, Math.floor(targetW * scale));
      const outH = Math.max(1, Math.floor(targetH * scale));
      const ex = document.createElement('canvas');
      ex.width = outW;
      ex.height = outH;
      const ctx = ex.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, outW, outH);
        ctx.drawImage(src, 0, 0, outW, outH);
        hd = ex.toDataURL('image/png');
      }
    }
  }
  overlay.src = hd ?? dataUrl;
  overlay.style.left = `${left}px`;
  overlay.style.top = `${top}px`;
  overlay.style.width = `${sigWidth}px`;
  overlay.style.height = `${sigHeight}px`;
  overlay.style.display = "block";
  toggleSignaturePlaceholders(false);
}

// Toggle visibility of signature placeholder(s) on the Fabric canvas
function toggleSignaturePlaceholders(visible: boolean) {
  const canvas = certificateCanvasRef.current;
  if (!canvas) return;
  const objs = canvas.getObjects();
  // candidates: id starts with SIGNATURE- or heuristic group with ~16:9 rect
  const approx = (a: number, b: number, tol = 0.25) => Math.abs(a - b) <= tol;
  const groups = objs.filter((obj) => {
    const id = (obj as any).id as string | undefined;
    if (typeof id === 'string' && id.startsWith('SIGNATURE-')) return true;
    if (obj.type !== 'group') return false;
    const group = obj as unknown as fabric.Group;
    const children = group.getObjects?.() ?? [];
    const rect = children.find((c) => c.type === 'rect') as fabric.Rect | undefined;
    if (!rect) return false;
    if ((obj as any).isAnchor) return false;
    const w = (rect.width || 0) * ((rect.scaleX as number) || 1);
    const h = (rect.height || 0) * ((rect.scaleY as number) || 1);
    if (w <= 0 || h <= 0) return false;
    return approx(w / h, 16 / 9, 0.3);
  });

  groups.forEach((g) => {
    g.set({ opacity: visible ? 1 : 0 });
  });
  canvas.requestRenderAll();
}

	// Ensure overlay is applied once signerId becomes available
	useEffect(() => {
		if (signerId && savedSignatureRef.current) {
			void applySignatureToPreview(savedSignatureRef.current);
		}
	}, [signerId]);

	// Fetch certificate design for preview
	useEffect(() => {
		const fetchCertificate = async () => {
			if (!certificateId) return;
			try {
				setLoadingCertificate(true);
				const resp = await Axios.get<GetCertificateResponse>(
					`/certificate/${certificateId}`
				);
				if (resp.status === 200) {
					setCertificate(resp.data.data);
				}
			} catch (error) {
				console.error("Failed to fetch certificate", error);
			} finally {
				setLoadingCertificate(false);
			}
		};

		void fetchCertificate();
	}, [certificateId]);

	const handleCloseTab = () => {
		window.close();
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		devicePixelRatioRef.current = dpr;
		canvas.width = Math.floor(WORKING_WIDTH * dpr);
		canvas.height = Math.floor(WORKING_HEIGHT * dpr);
		// Make the drawing canvas responsive: match container width and keep aspect ratio
		canvas.style.width = "100%";
		canvas.style.height = "auto";
		canvas.style.touchAction = "none";

		const context = canvas.getContext("2d");
		if (!context) return;

		// scale for crisp rendering
		context.setTransform(dpr, 0, 0, dpr, 0, 0);

		context.lineWidth = STROKE_WIDTH_OPTIONS[0];
		context.lineCap = "round";
		contextRef.current = context;
	}, []);

	useEffect(() => {
		const context = contextRef.current;
		if (!context) return;
		const colorHex = signatureColor === "white" ? "#ffffff" : signatureColor === "blue" ? "#2563eb" : "#000000";
		context.strokeStyle = colorHex;
	}, [signatureColor]);

	useEffect(() => {
		const context = contextRef.current;
		if (!context) return;
		context.lineWidth = strokeWidth;
	}, [strokeWidth]);

	const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
		const sanitized = hex.replace('#', '');
		const bigint = parseInt(sanitized.length === 3 ? sanitized.split('').map((c) => c + c).join('') : sanitized, 16);
		return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
	};

	const recolorWorkingCanvasTo = (hex: string) => {
		const ctx = contextRef.current;
		const cnv = canvasRef.current;
		if (!ctx || !cnv) return;
		const img = ctx.getImageData(0, 0, cnv.width, cnv.height);
		const data = img.data;
		const { r, g, b } = hexToRgb(hex);
		for (let i = 0; i < data.length; i += 4) {
			const alpha = data[i + 3];
			if (alpha !== 0) {
				data[i] = r;
				data[i + 1] = g;
				data[i + 2] = b;
			}
		}
		ctx.putImageData(img, 0, 0);
		const latest = exportCurrentCanvas();
		if (latest) {
			savedSignatureRef.current = latest;
			void applySignatureToPreview(latest);
		}
	};

	const resetCanvas = useCallback(() => {
		const context = contextRef.current;
		if (!context) return;
		// context.fillStyle = "#ffffff";
		// context.fillRect(0, 0, WORKING_WIDTH, WORKING_HEIGHT);
		context.clearRect(0, 0, WORKING_WIDTH, WORKING_HEIGHT);
		// Keep current selected color after clearing
		const colorHex = signatureColor === 'white' ? '#ffffff' : signatureColor === 'blue' ? '#2563eb' : '#000000';
		context.strokeStyle = colorHex;
		setHasManualChanges(false);
	}, [signatureColor]);

	const exportCurrentCanvas = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return null;
		const exportCanvas = document.createElement("canvas");
		exportCanvas.width = OUTPUT_WIDTH;
		exportCanvas.height = OUTPUT_HEIGHT;
		const exportContext = exportCanvas.getContext("2d");
		if (!exportContext) return null;
		// exportContext.fillStyle = "#ffffff";
		// exportContext.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
		exportContext.drawImage(canvas, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
		return exportCanvas.toDataURL("image/png");
	}, []);

	const getCanvasCoordinates = (event: ReactPointerEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return { x: 0, y: 0 };
		const rect = canvas.getBoundingClientRect();
		const scaleX = WORKING_WIDTH / rect.width;
		const scaleY = WORKING_HEIGHT / rect.height;
		return {
			x: (event.clientX - rect.left) * scaleX,
			y: (event.clientY - rect.top) * scaleY,
		};
	};

	const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
		event.preventDefault();
		const context = contextRef.current;
		if (!context) return;

		// Palm rejection: When Apple Pencil is detected, ignore touch input
		if (event.pointerType === "pen") {
			isPenActiveRef.current = true;
		}

		// Only accept input if:
		// 1. Using pen (Apple Pencil)
		// 2. Using mouse
		// 3. Using touch BUT pen hasn't been used yet (for non-iPad devices)
		if (event.pointerType === "pen" ||
		    event.pointerType === "mouse" ||
		    (event.pointerType === "touch" && !isPenActiveRef.current)) {
			const { x, y } = getCanvasCoordinates(event);
			context.beginPath();
			context.moveTo(x, y);
			setIsDrawing(true);
			setHasManualChanges(true);
			signatureOriginRef.current = "draw";
		}
	};

	const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
		if (!isDrawing) return;
		event.preventDefault();

		// Palm rejection: ignore touch events if pen is active
		if (event.pointerType === "touch" && isPenActiveRef.current) {
			return;
		}

		const context = contextRef.current;
		if (!context) return;

		const { x, y } = getCanvasCoordinates(event);
		context.lineTo(x, y);
		context.stroke();

		// Throttled live preview update
		const now = Date.now();
		if (now - lastPreviewUpdateRef.current > PREVIEW_THROTTLE_MS) {
			const dataUrl = exportCurrentCanvas();
			if (dataUrl) {
				savedSignatureRef.current = dataUrl;
				void applySignatureToPreview(dataUrl);
				lastPreviewUpdateRef.current = now;
			}
		}
	};

	const stopDrawing = () => {
		if (!isDrawing) return;
		contextRef.current?.closePath();
		setIsDrawing(false);
		const dataUrl = exportCurrentCanvas();
		if (dataUrl) {
			savedSignatureRef.current = dataUrl;
			void applySignatureToPreview(dataUrl);
		}
	};

	const exportForDownload = () => {
		const canvas = canvasRef.current;
		if (!canvas) return null;
		const exportCanvas = document.createElement("canvas");
		exportCanvas.width = WORKING_WIDTH;
		exportCanvas.height = WORKING_HEIGHT;
		const ctx = exportCanvas.getContext("2d");
		if (!ctx) return null;
		ctx.clearRect(0, 0, WORKING_WIDTH, WORKING_HEIGHT);
		ctx.drawImage(canvas, 0, 0, WORKING_WIDTH, WORKING_HEIGHT);
		return exportCanvas.toDataURL("image/png");
	};

	const dataUrlToFile = async (dataUrl: string, filename: string) => {
		const response = await fetch(dataUrl);
		const blob = await response.blob();
		const ext = blob.type.split("/").pop() || "png";
		return new File([blob], `${filename}.${ext}`, { type: blob.type });
	};

	const finalizeSignature = async () => {
		const dataUrl = exportCurrentCanvas();
		if (!dataUrl) {
			setUploadError("Unable to capture signature. Please try again.");
			return;
		}
		savedSignatureRef.current = dataUrl;
		setUploadError(null);
		setHasManualChanges(false);
		setIsConfirmOpen(false);
		const payload = {
			certificateId,
			signerId,
			origin: signatureOriginRef.current,
			confirmedAt: new Date().toISOString(),
		};

		if (!signatureId) {
			console.info("Signature confirmed (no signatureId provided)", payload);
			return;
		}

		try {
			const signatureFile = await dataUrlToFile(dataUrl, `signature-${signatureId}`);
			const formData = new FormData();
			formData.append("signature_image", signatureFile);

			await Axios.put(`/signature/sign/${signatureId}`, formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			console.info("Signature uploaded", {
				...payload,
				signatureId,
			});

			// Mark as signed to show success page
			setIsSigned(true);
		} catch (error) {
			console.error("Failed to upload signature", error);
			setUploadError("Failed to upload signature. Please try again.");
		}
	};

	const downloadCurrentSignature = () => {
		const dataUrl = exportForDownload();
		if (!dataUrl) {
			setUploadError("Unable to download signature. Please try again.");
			return;
		}
		const link = document.createElement("a");
		link.href = dataUrl;
		link.download = "signature.png";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		setUploadError(null);
	};

	const handleConfirmSignature = () => {
		setIsConfirmOpen(true);
	};

	const handleSelectColor = (c: "black" | "white" | "blue") => {
		setSignatureColor(c);
		const hex = c === 'white' ? '#ffffff' : c === 'blue' ? '#2563eb' : '#000000';
		recolorWorkingCanvasTo(hex);
	};

	const handleSelectStrokeWidth = (width: StrokeWidth) => {
		setStrokeWidth(width);
		const context = contextRef.current;
		if (context) {
			context.lineWidth = width;
		}
	};

  const handleClearCanvas = () => {
    resetCanvas();
    savedSignatureRef.current = null;
    setUploadError(null);
    // Reset pen mode to allow touch input again
    isPenActiveRef.current = false;
    if (certificateCanvasRef.current && signatureImageRef.current) {
      certificateCanvasRef.current.remove(signatureImageRef.current);
      signatureImageRef.current = null;
      certificateCanvasRef.current.requestRenderAll();
    }
    if (signatureOverlayRef.current) {
      signatureOverlayRef.current.style.display = "none";
      signatureOverlayRef.current.src = "";
    }
    // Restore placeholder visibility
    toggleSignaturePlaceholders(true);
  };

	const drawImageToWorkingCanvas = (image: HTMLImageElement) => {
		const context = contextRef.current;
		if (!context) return false;

		// Create temporary canvas for background removal
		const tempCanvas = document.createElement("canvas");
		tempCanvas.width = image.width;
		tempCanvas.height = image.height;
		const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
		if (!tempCtx) return false;

		// Draw image to temp canvas
		tempCtx.drawImage(image, 0, 0);

		// Get image data and process it
		const imageData = tempCtx.getImageData(0, 0, image.width, image.height);
		const data = imageData.data;

		// Remove white background and recolor to selected color
		const threshold = 200;
		const selectedHex = signatureColor === 'white' ? '#ffffff' : signatureColor === 'blue' ? '#2563eb' : '#000000';
		const { r: tr, g: tg, b: tb } = hexToRgb(selectedHex);
		for (let i = 0; i < data.length; i += 4) {
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];
			const brightness = (r + g + b) / 3;

			if (brightness > threshold) {
				// Make white/light pixels transparent
				data[i + 3] = 0;
			} else if (brightness > threshold - 50) {
				// Smooth edges
				const alpha = 255 - Math.floor(((brightness - (threshold - 50)) / 50) * 255);
				data[i + 3] = alpha;
			}

			// Recolor any remaining visible pixel to the selected color
			if (data[i + 3] > 0) {
				data[i] = tr;
				data[i + 1] = tg;
				data[i + 2] = tb;
			}
		}

		// Put processed data back
		tempCtx.putImageData(imageData, 0, 0);

		// Clear working canvas to keep transparent background
		context.clearRect(0, 0, WORKING_WIDTH, WORKING_HEIGHT);

		// Scale and center the processed image
		const scale = Math.min(WORKING_WIDTH / image.width, WORKING_HEIGHT / image.height);
		const drawWidth = image.width * scale;
		const drawHeight = image.height * scale;
		const offsetX = (WORKING_WIDTH - drawWidth) / 2;
		const offsetY = (WORKING_HEIGHT - drawHeight) / 2;

		context.drawImage(tempCanvas, offsetX, offsetY, drawWidth, drawHeight);
		return true;
	};

	const handleUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = "";

		if (!file) return;
		if (!file.type.startsWith("image/")) {
			setUploadError("Please upload an image file (PNG, JPG, etc.).");
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			const image = new Image();
			image.onload = () => {
				const drawn = drawImageToWorkingCanvas(image);
				if (!drawn) {
					setUploadError("Unable to process the uploaded file.");
					return;
				}

				const dataUrl = exportCurrentCanvas();
				if (!dataUrl) {
					setUploadError("Unable to export the uploaded signature.");
					return;
				}

				signatureOriginRef.current = "upload";
				savedSignatureRef.current = dataUrl;
				setUploadError(null);
				setHasManualChanges(true);
				console.info("Signature uploaded", dataUrl);
				void applySignatureToPreview(dataUrl);
			};
			image.src = reader.result as string;
		};
		reader.onerror = () => {
			setUploadError("Failed to read the selected file.");
		};
		reader.readAsDataURL(file);
	};

	if (isSigned) {
		return (
			<div className="select-none cursor-default flex flex-col gap-12 text-white">
				<header className="flex flex-col gap-4">
					<span className="text-sm uppercase tracking-[0.35em] text-white/60">
						Signature
					</span>
					<div className="space-y-2">
						<h1 className="text-4xl font-semibold">Signature already provided</h1>
						<p className="max-w-2xl text-base text-white/70">
							{signerName ? `${signerName} has` : "You have"} already signed this
							certificate. No further action is required.
						</p>
					</div>
				</header>

				<section className="rounded-[32px] border border-white/25 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
					<div className="flex flex-col items-center gap-6 text-center">
						<div className="rounded-full bg-green-500/20 p-6">
							<svg
								className="h-16 w-16 text-green-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<div className="space-y-2">
							<h2 className="text-2xl font-semibold text-white">
								Certificate Signed
							</h2>
							<p className="text-white/70">
								This certificate has been successfully signed and processed.
							</p>
						</div>
						<button
							className="mt-4 rounded-full bg-white px-8 py-3 text-sm font-semibold text-primary_text shadow-lg transition hover:scale-[1.02]"
							onClick={handleCloseTab}
						>
							Close this page
						</button>
					</div>
				</section>
			</div>
		);
	}

	return (
		<div className="select-none cursor-default flex flex-col gap-12 text-white">
			<header className="flex flex-col gap-4">
				<span className="text-sm uppercase tracking-[0.35em] text-white/60">Signature</span>
				<div className="space-y-2">
					<h1 className="text-4xl font-semibold">Provide your signature</h1>
					<p className="max-w-2xl text-base text-white/70">
						Draw directly on the canvas or upload a prepared image. We'll size and
						format it correctly for certificates automatically.
					</p>
				</div>
			</header>

			<section className="rounded-[32px] border border-white/25 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
				<div className="flex flex-col gap-6">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold text-white">Certificate preview</h2>
						<span className="text-sm text-white/70">Signature will appear in its designated area</span>
					</div>
					<div className="mt-2 flex justify-center">
						{loadingCertificate ? (
							<div
								className="flex w-full max-w-[850px] items-center justify-center rounded-2xl border border-dashed border-white/30 bg-white/10 text-white/70"
								style={{ aspectRatio: "850/601", minHeight: "240px" }}
							>
								Loading certificate...
							</div>
						) : certificate ? (
						<div
							id="signature-certificate-preview"
							className="relative flex w-full max-w-[850px] items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white"
							style={{ aspectRatio: "850/601" }}
						>
							<canvas
								id="signature-preview-canvas"
								style={{ display: "block", margin: "0 auto" }}
							/>
							<img
								ref={signatureOverlayRef}
								alt="Signature overlay"
								style={{ position: "absolute", display: "none", pointerEvents: "none" }}
							/>
						</div>
						) : (
							<div
								className="flex w-full max-w-[850px] items-center justify-center rounded-2xl border border-dashed border-white/30 bg-white/10 text-white/70"
								style={{ aspectRatio: "850/601", minHeight: "240px" }}
							>
								No certificate found
							</div>
						)}
					</div>
				</div>
			</section>

			<section className="rounded-[32px] border border-white/25 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
				<div className="flex flex-col gap-10">
					<div className="space-y-8">
						<div className="rounded-3xl border border-white/20 bg-white/95 p-6 text-primary_text shadow-xl">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold text-primary_text">
									Draw your signature
								</h2>
							</div>
							<div className="mt-6 grid w-full gap-6 md:grid-cols-[minmax(0,auto)_1px_minmax(220px,1fr)] md:items-start">
								<div className="flex w-full flex-col items-start gap-4">
									<canvas
										ref={canvasRef}
										className="rounded-xl border border-gray-300 bg-white shadow-sm"
										width={WORKING_WIDTH}
										height={WORKING_HEIGHT}
										style={{
											width: "100%",
											maxWidth: `${DISPLAY_WIDTH}px`,
											height: "auto",
											backgroundColor: signatureColor === "white" ? "#000000" : "#ffffff",
										}}
										onPointerDown={handlePointerDown}
										onPointerMove={handlePointerMove}
										onPointerUp={stopDrawing}
										onPointerLeave={stopDrawing}
									/>

									<div className="flex w-full flex-col gap-3">
										<div className="flex flex-wrap items-center gap-3">
											<div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 p-1">
												{(["black", "white", "blue"] as const).map((c) => {
													const isActive = signatureColor === c;
													return (
														<button
															key={c}
															onClick={() => handleSelectColor(c)}
															className={`h-7 w-7 rounded-full border-2 ring-2 transition ${
																isActive
																	? "ring-slate-200 ring-offset-2 ring-offset-white/30"
																	: "ring-transparent"
															}`}
															style={{
																backgroundColor: c === "white" ? "#ffffff" : c === "blue" ? "#2563eb" : "#000000",
																borderColor: isActive
																	? "rgba(148,163,184,1)"
																	: "rgba(148,163,184,0.75)",
															}}
															aria-label={`Set color ${c}`}
														/>
													);
												})}
												<span className="px-2 text-xs text-gray-600">Color</span>
											</div>
											<div className="flex flex-wrap items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1">
												{STROKE_WIDTH_OPTIONS.map((width) => (
													<button
														key={width}
														onClick={() => handleSelectStrokeWidth(width)}
														className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition border-2 ${
															strokeWidth === width
																? "border-slate-200 bg-white text-primary_text shadow"
																: "border-slate-400 bg-white/15 text-primary_text/90 hover:bg-white/25"
														}`}
														aria-label={`Set thickness to ${width}px`}
													>
														<span
															className="block rounded-full transition-all"
															style={{
																width: "36px",
																height: `${width}px`,
																backgroundColor:
																	strokeWidth === width
																		? "#0f172a"
																		: "rgba(15,23,42,0.5)",
															}}
															aria-hidden="true"
														/>
														{width}px
													</button>
												))}
												<span className="px-2 text-xs text-gray-600">Thickness</span>
											</div>
										</div>
										<div className="flex flex-wrap items-center gap-3">
											<button
												className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
														hasManualChanges
															? "bg-primary_button text-white hover:scale-[1.01]"
															: "bg-white/40 text-gray-400 cursor-not-allowed"
													}`}
												onClick={handleConfirmSignature}
												disabled={!hasManualChanges}
											>
												Confirm
											</button>
											<button
												className="rounded-full border border-primary_button/30 bg-white px-5 py-2 text-sm font-semibold text-primary_button transition hover:scale-[1.01]"
												onClick={handleClearCanvas}
											>
												Clear
											</button>
										</div>
									</div>
								</div>
								
								<div className="hidden h-full w-px self-stretch rounded-full bg-white/30 md:block" />

								<div className="flex min-w-[220px] flex-col gap-4 rounded-2xl border border-white/15 bg-white/80 p-4 text-primary_text shadow-inner">
									<div>
										<h3 className="text-base font-semibold text-primary_text">
											Prefer to upload instead?
										</h3>
										<p className="mt-1 text-sm text-gray-600">
											Accepted formats: PNG, JPG, JPEG. We’ll adjust the image
											to match the drawn signature area so it aligns perfectly
											when saved.
										</p>
									</div>
									<div className="flex flex-wrap items-center gap-3">
										<label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-primary_button px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01]">
											Upload signature
											<input
												type="file"
												accept="image/*"
												className="hidden"
												onChange={handleUploadChange}
											/>
										</label>
									</div>
									{uploadError && (
										<p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
											{uploadError}
										</p>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{isConfirmOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-10">
					<div className="relative w-full max-w-[520px] overflow-hidden rounded-[32px] bg-white text-primary_text shadow-2xl">
						<div
							className="absolute inset-0 rounded-[32px] border border-white/20"
							aria-hidden="true"
						/>
						<div className="relative p-8 sm:p-10">
							<div className="flex flex-col gap-6">
								<div className="flex flex-col gap-3 text-left">
									<h2 className="text-3xl font-semibold text-primary_text">
										Confirm signature
									</h2>
									<p className="text-sm leading-6 text-gray-600">
										This will save the signature exactly as you see it now. To
										adjust it later, you’ll need to create or upload a new one.
									</p>
								</div>

								<div className="flex flex-col gap-3 rounded-2xl border border-primary_button/15 bg-primary_button/5 px-4 py-4 text-sm text-primary_button">
									<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
										<span className="text-left">
											Download a copy for your records before confirming.
										</span>
										<button
											className="rounded-full border border-primary_button/20 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary_button transition hover:scale-[1.02]"
											onClick={downloadCurrentSignature}
										>
											Download
										</button>
									</div>
								</div>

								<div className="flex flex-col gap-3 sm:flex-row">
									<button
										className="flex-1 rounded-full border border-primary_button/30 bg-white px-5 py-3 text-sm font-semibold text-primary_button transition hover:scale-[1.01]"
										onClick={() => setIsConfirmOpen(false)}
									>
										Keep editing
									</button>
									<button
										className="flex-1 rounded-full bg-primary_button px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02]"
										onClick={finalizeSignature}
									>
										Confirm
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default SignaturePage;
