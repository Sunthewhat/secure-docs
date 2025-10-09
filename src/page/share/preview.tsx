import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import * as fabric from "fabric";
import { Axios } from "@/util/axiosInstance";
import {
	GetParticipantResponse,
	Participant,
	GetCertificateResponse,
	Certificate,
	GetAnchorResponse,
} from "@/types/response";

type SharePreviewParticipant = {
	id?: string;
	data: Record<string, string>;
	isDistributed?: boolean;
	isDownloaded?: boolean;
	emailStatus?: "pending" | "success" | "failed";
};

type SharePreviewState = {
	fromShare?: boolean;
	columns?: string[];
	participants?: SharePreviewParticipant[];
};

const ensureEmailColumn = (cols: string[]): string[] => {
	if (!cols.length) return ["email"];
	const filtered = cols.filter(
		(col): col is string => typeof col === "string" && col.trim().length > 0
	);
	const normalized = filtered.map((col) => col.trim().toLowerCase());
	let targetIndex = normalized.findIndex((col) => col === "email");
	if (targetIndex === -1) {
		targetIndex = normalized.findIndex((col) => col.includes("email"));
	}
	const reordered = [...filtered];
	if (targetIndex === -1) {
		reordered.push("email");
		return reordered;
	}
	if (targetIndex === reordered.length - 1) {
		return reordered;
	}
	const [emailCol] = reordered.splice(targetIndex, 1);
	reordered.push(emailCol);
	return reordered;
};

const PreviewPage = () => {
	const navigate = useNavigate();
	const { certId } = useParams<{ certId: string }>();
	const location = useLocation();
	const shareState = location.state as SharePreviewState | undefined;
	const [participants, setParticipants] = useState<Participant[]>([]);
	const [columns, setColumns] = useState<string[]>([]);
	const [certificate, setCertificate] = useState<Certificate | null>(null);
	const [loading, setLoading] = useState(true);
	const [selectedParticipant, setSelectedParticipant] =
		useState<Participant | null>(null);
	const canvasRef = useRef<fabric.Canvas | null>(null);
	const [initializedFromShare, setInitializedFromShare] = useState(false);

	useEffect(() => {
		if (initializedFromShare) return;

		const shareParticipants = shareState?.participants ?? [];
		if (!shareParticipants.length) return;

		const sanitizedColumns = (shareState?.columns ?? [])
			.map((col) => (typeof col === 'string' ? col.trim() : ''))
			.filter((col) => col.length > 0);

		const derivedColumns = sanitizedColumns.length
			? sanitizedColumns
			: Array.from(
				new Set(
					shareParticipants.flatMap((participant) =>
						participant?.data ? Object.keys(participant.data) : []
					)
				)
			);

		const uniqueColumns = Array.from(new Set(derivedColumns));
		const orderedColumns = ensureEmailColumn(uniqueColumns);
		setColumns(orderedColumns);

		const timestamp = Date.now();
		const normalizedParticipants = shareParticipants.map((participant, index) => {
			const normalizedData: Participant['data'] = {};
			orderedColumns.forEach((col) => {
				normalizedData[col] = participant.data?.[col] ?? '';
			});
			const normalizedEmailStatus: Participant['email_status'] =
				participant.emailStatus === 'success' || participant.emailStatus === 'failed'
					? participant.emailStatus
					: 'pending';

			return {
				id: participant.id ?? `local-${timestamp}-${index}`,
				certificate_id: certId ?? '',
				is_revoked: false,
				is_distributed: Boolean(participant.isDistributed),
				is_downloaded: Boolean(participant.isDownloaded),
				email_status: normalizedEmailStatus,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				certificate_url: '',
				data: normalizedData,
			};
		});

		setParticipants(normalizedParticipants);
		setSelectedParticipant(normalizedParticipants[0] ?? null);
		setInitializedFromShare(true);
	}, [shareState, initializedFromShare, certId]);

	// Fetch certificate and participants data from API
	useEffect(() => {
		const fetchData = async () => {
			if (!certId) return;
			const shareParticipantsProvided = Boolean(shareState?.participants?.length);

			try {
				setLoading(true);

				// Fetch certificate data
				const certResponse = await Axios.get<GetCertificateResponse>(
					`/certificate/${certId}`
				);
				if (certResponse.status === 200) {
					setCertificate(certResponse.data.data);
				} else {
					console.error("Failed to fetch certificate");
				}

				if (shareParticipantsProvided) {
					return;
				}

				// Fetch anchor columns for consistent ordering
				let anchorColumns: string[] = [];
				try {
					const anchorResponse = await Axios.get<GetAnchorResponse>(
						`/certificate/anchor/${certId}`
					);
					if (anchorResponse.status === 200) {
						const anchors = anchorResponse.data.data;
						if (Array.isArray(anchors)) {
							const sanitized = anchors
								.map((col) =>
									typeof col === "string" ? col.trim() : ""
								)
								.filter((col) => col.length > 0);
							anchorColumns = ensureEmailColumn(sanitized);
						}
					} else {
						console.error("Failed to fetch anchor columns");
					}
				} catch (anchorError) {
					console.error(
						"Error fetching anchor columns:",
						anchorError
					);
				}

				if (!anchorColumns.length) {
					anchorColumns = ensureEmailColumn([]);
				}

				// Fetch participants data
				const participantResponse =
					await Axios.get<GetParticipantResponse>(
						`/participant/${certId}`
					);
				if (participantResponse.status === 200) {
					const participantsData = participantResponse.data.data;
					const serverColumns = Array.from(
						new Set(
							participantsData.flatMap((participant) =>
								participant?.data
									? Object.keys(participant.data)
									: []
							)
						)
					);

					const anchorOnlyEmail =
						anchorColumns.length > 0 &&
						anchorColumns.every((col) =>
							col.toLowerCase().includes("email")
						);

					let resolvedColumns = anchorColumns.length
						? [...anchorColumns]
						: [];

					if (!anchorOnlyEmail) {
						const serverNormalized = serverColumns
							.map((col) =>
								typeof col === "string" ? col.trim() : ""
							)
							.filter((col) => col.length > 0);

						if (
							!resolvedColumns.length &&
							serverNormalized.length
						) {
							resolvedColumns = [...serverNormalized];
						} else {
							serverNormalized.forEach((col) => {
								if (!resolvedColumns.includes(col)) {
									resolvedColumns.push(col);
								}
							});
						}
					}

					if (!resolvedColumns.length) {
						resolvedColumns = ["email"];
					}

					const orderedColumns = ensureEmailColumn(resolvedColumns);
					setColumns(orderedColumns);

					const normalizedParticipants = participantsData.map(
						(participant) => {
							const normalizedData: Participant["data"] = {};
							orderedColumns.forEach((col) => {
								normalizedData[col] =
									participant.data?.[col] ?? "";
							});
							const normalizedEmailStatus: Participant["email_status"] =
								participant.email_status === "success" ||
								participant.email_status === "failed"
									? participant.email_status
									: "pending";
							return {
								...participant,
								is_downloaded: Boolean(participant.is_downloaded),
								email_status: normalizedEmailStatus,
								data: normalizedData,
							};
						}
					);

					setParticipants(normalizedParticipants);
					setSelectedParticipant(normalizedParticipants[0] ?? null);
				} else {
					console.error("Failed to fetch participants");
				}
			} catch (error) {
				console.error("Error fetching data:", error);
			} finally {
				setLoading(false);
			}
		};

		void fetchData();
	}, [certId, shareState]);

	// Function to update certificate with participant data
	const updateCertificateWithParticipantData = (participant: Participant) => {
		if (!canvasRef.current) {
			return;
		}

		const canvas = canvasRef.current;

		// Force canvas to recalculate dimensions and clear cache
		canvas.calcOffset();
		canvas.clearContext(canvas.getContext());

		const objects = canvas.getObjects();

		// Process all objects to ensure they are visible and handle anchors
		objects.forEach((obj) => {
			// Force object to be dirty and require re-render
			obj.dirty = true;
			obj.canvas = canvas;

			// Ensure object is visible and properly configured
			obj.set({
				visible: true,
				opacity: 1,
			});

			// Handle grouped anchors (text anchors)
			if (obj.isAnchor && obj.id && obj.type === "group") {
				const group = obj as fabric.Group;
				// Remove Rect objects from the group and keep only textbox
				const filteredObjects = group
					.getObjects()
					.filter((subObj) => !(subObj instanceof fabric.Rect));
				group.removeAll();
				filteredObjects.forEach((subObj) => group.add(subObj));

				// Find the textbox within the group
				const textObject = group
					.getObjects()
					.find(
						(subObj) => subObj instanceof fabric.Textbox
					) as fabric.Textbox;
				if (textObject) {
					// Extract column name from group id by removing "PLACEHOLDER-" prefix
					const columnName = obj.id.replace("PLACEHOLDER-", "");
					const fieldValue = participant.data[columnName];
					if (fieldValue) {
						textObject.set("text", fieldValue);
						textObject.dirty = true;
					}
				}
				group.dirty = true;
			}
			// Handle individual textbox anchors
			else if (obj.isAnchor && obj.id && obj.type === "textbox") {
				const textbox = obj as fabric.Textbox;
				// Extract column name from id by removing "PLACEHOLDER-" prefix
				const columnName = obj.id.replace("PLACEHOLDER-", "");
				const fieldValue = participant.data[columnName];
				if (fieldValue) {
					textbox.set("text", fieldValue);
					textbox.dirty = true;
				}
			}
			// Handle non-anchor text objects - ensure they remain visible
			else if (obj.type === "textbox" || obj.type === "text") {
				// For non-anchor text objects, just ensure they are visible
				obj.set({
					visible: true,
					opacity: 1,
				});
				obj.dirty = true;
			}
		});

		// Force complete re-render with multiple approaches
		canvas.requestRenderAll();
		canvas.renderAll();

		// Use requestAnimationFrame for smoother rendering
		requestAnimationFrame(() => {
			if (canvasRef.current) {
				canvasRef.current.calcOffset();
				canvasRef.current.renderAll();
			}
		});

		// Force a final render after elements have settled
		setTimeout(() => {
			if (canvasRef.current) {
				canvasRef.current.renderAll();
			}
		}, 100);
	};

	// Handle participant row click
	const handleParticipantClick = (participant: Participant) => {
		if (selectedParticipant?.id === participant.id) {
			// If clicking on the same participant, refresh the certificate
			updateCertificateWithParticipantData(participant);
		} else {
			// Select new participant
			setSelectedParticipant(participant);
		}
	};

	// Function to resize canvas to fit container
	const resizeCanvas = useCallback(() => {
		if (!canvasRef.current || !certificate?.design) return;

		const containerElement = document.getElementById("certificate-preview");
		if (!containerElement) return;

		const containerRect = containerElement.getBoundingClientRect();
		const containerWidth = containerRect.width;
		const containerHeight = containerRect.height;

		if (containerWidth <= 0 || containerHeight <= 0) return;

		const canvas = canvasRef.current;

		// Store original design dimensions
		const designData = JSON.parse(certificate.design);
		const originalWidth = 850; // Fixed certificate width
		const originalHeight = 601; // Fixed certificate height
		const designAspectRatio = originalWidth / originalHeight;

		// Calculate canvas size to fit container while maintaining aspect ratio
		let newWidth = containerWidth;
		let newHeight = newWidth / designAspectRatio;

		// If height exceeds container, scale by height instead
		if (newHeight > containerHeight) {
			newHeight = containerHeight;
			newWidth = newHeight * designAspectRatio;
		}

		// Calculate scale to fit the design in the current container
		const scaleX = newWidth / originalWidth;
		const scaleY = newHeight / originalHeight;
		const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

		// Resize canvas
		canvas.setDimensions({ width: newWidth, height: newHeight });

		// Reload and scale the certificate design
		canvas.loadFromJSON(designData).then(() => {
			// Force canvas recalculation after loading
			canvas.calcOffset();

			canvas.getObjects().forEach((obj) => {
				// Force canvas reference and dirty state for all objects
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

				// Force coordinate calculation
				obj.setCoords();

					if (!obj.isAnchor) {
						obj.dirty = true;
					}
			});

			// Force complete canvas refresh with multiple renders
			canvas.calcOffset();
			canvas.requestRenderAll();
			canvas.renderAll();

			// Multiple render passes to ensure visibility
			requestAnimationFrame(() => {
				if (canvasRef.current) {
					canvasRef.current.calcOffset();
					canvasRef.current.renderAll();

					requestAnimationFrame(() => {
						if (canvasRef.current) {
							canvasRef.current.renderAll();
						}
					});
				}
			});

			// Re-apply participant data if selected
			if (selectedParticipant) {
				setTimeout(() => {
					updateCertificateWithParticipantData(selectedParticipant);
				}, 200);
			}
		});
	}, [certificate, selectedParticipant]);

	// Initialize canvas and render certificate design
	useEffect(() => {
		if (!certificate?.design) {
			return;
		}

		// Cleanup existing canvas first
		if (canvasRef.current) {
			canvasRef.current.dispose();
			canvasRef.current = null;
		}

		// Use setTimeout to ensure DOM is ready
		const initCanvas = () => {
			const canvasElement = document.getElementById(
				"preview-canvas"
			) as HTMLCanvasElement;
			const containerElement = document.getElementById(
				"certificate-preview"
			);

			if (!canvasElement || !containerElement) {
				setTimeout(initCanvas, 100);
				return;
			}

			// Check if canvas is already initialized
			if (canvasRef.current) {
				return;
			}

			// Get container dimensions with some padding
			const containerRect = containerElement.getBoundingClientRect();
			const containerWidth = containerRect.width;
			const containerHeight = containerRect.height;

			// Parse design data to get original dimensions
			const designData = JSON.parse(certificate.design);
			const originalWidth = 850; // Fixed certificate width
			const originalHeight = 601; // Fixed certificate height
			const designAspectRatio = originalWidth / originalHeight;

			// Calculate canvas size to fit container while maintaining aspect ratio
			let canvasWidth = containerWidth;
			let canvasHeight = canvasWidth / designAspectRatio;

			// If height exceeds container, scale by height instead
			if (canvasHeight > containerHeight) {
				canvasHeight = containerHeight;
				canvasWidth = canvasHeight * designAspectRatio;
			}

			// Initialize Fabric canvas
			const canvas = new fabric.Canvas(canvasElement, {
				width: canvasWidth,
				height: canvasHeight,
				selection: false, // Disable selection in preview mode
			});

			// Set canvas element CSS to fit container
			canvasElement.style.maxWidth = "100%";
			canvasElement.style.maxHeight = "100%";
			canvasElement.style.width = "auto";
			canvasElement.style.height = "auto";

			canvasRef.current = canvas;

			// Load and render the certificate design
			try {
				canvas
					.loadFromJSON(designData)
					.then(() => {
						// Force canvas recalculation immediately after loading
						canvas.calcOffset();

						// Scale down the entire canvas content to fit preview
						const objects = canvas.getObjects();
						// Calculate scale to fit the design in the preview canvas
						const scaleX = canvasWidth / originalWidth;
						const scaleY = canvasHeight / originalHeight;
						const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

						// Apply scale and disable interactions for all objects
						objects.forEach((obj) => {
							// Force canvas reference for all objects
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

							// Force coordinate calculation
							obj.setCoords();

								if (!obj.isAnchor) {
									obj.dirty = true;
								}
						});

						// Force complete canvas refresh
						canvas.calcOffset();
						canvas.requestRenderAll();
						canvas.renderAll();

						// Force multiple renders with different timing
						requestAnimationFrame(() => {
							if (canvasRef.current) {
								canvasRef.current.calcOffset();
								canvasRef.current.renderAll();

								// Force one more render on next frame
								requestAnimationFrame(() => {
									if (canvasRef.current) {
										canvasRef.current.renderAll();
									}
								});
							}
						});

						// Force a delayed render to catch any late objects
						setTimeout(() => {
							if (canvasRef.current) {
								canvasRef.current.renderAll();
							}
						}, 250);

						// Apply selected participant data if available
						setTimeout(() => {
							if (selectedParticipant) {
								updateCertificateWithParticipantData(
									selectedParticipant
								);
							}
						}, 200);
					})
					.catch((error) => {
						console.error(
							"Error loading certificate design:",
							error
						);
					});
			} catch (error) {
				console.error("Error parsing certificate design:", error);
			}
		};

		// Start initialization
		setTimeout(initCanvas, 100);

		// Cleanup function
		return () => {
			if (canvasRef.current) {
				canvasRef.current.dispose();
				canvasRef.current = null;
			}
		};
	}, [certificate, selectedParticipant]);

	// Add resize observer to handle responsive canvas sizing
	useEffect(() => {
		const containerElement = document.getElementById("certificate-preview");
		if (!containerElement) return;

		let resizeTimeout: NodeJS.Timeout;

		const resizeObserver = new ResizeObserver(() => {
			// Debounce resize to prevent excessive re-renders during DevTools toggle
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => {
				resizeCanvas();
			}, 150);
		});

		resizeObserver.observe(containerElement);

		return () => {
			resizeObserver.disconnect();
			clearTimeout(resizeTimeout);
		};
	}, [resizeCanvas]);

	// Update certificate with selected participant data when participant changes
	useEffect(() => {
		if (selectedParticipant && canvasRef.current) {
			// Use requestAnimationFrame for better rendering timing
			const frame = requestAnimationFrame(() => {
				updateCertificateWithParticipantData(selectedParticipant);
			});

			return () => cancelAnimationFrame(frame);
		}
	}, [selectedParticipant]);

	// Function to handle sending data to next page via navigation state
	const handleSend = () => {
		void navigate("/share/preview/send", {
			state: {
				participants,
				certId,
				columns,
			},
		});
	};
	const handleEdit = () => {
		// Pass edit mode and certificate ID to design page
		void navigate(`/design/${certId}`);
	};

	return (
		<div className="select-none cursor-default flex flex-col gap-12 text-white">
			<header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
				<div className="flex flex-col gap-4">
					<div className="flex flex-wrap items-center gap-4">
						<button
							onClick={() => void navigate(-1)}
							className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
								<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
							</svg>
							Back
						</button>
						<span className="text-sm uppercase tracking-[0.35em] text-white/60">
							Collection
						</span>
					</div>
					<div className="space-y-2">
						<h1 className="text-4xl font-semibold">Preview certificate</h1>
						<p className="max-w-2xl text-base text-white/70">
							Confirm the layout with real participant data before distributing your certificates.
						</p>
					</div>
				</div>
				<button
					onClick={handleSend}
					className="inline-flex items-center justify-center rounded-full bg-primary_button px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
				>
					Next step
				</button>
			</header>

			<section className="rounded-[32px] border border-white/25 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:p-10">
				<div className="flex flex-col gap-8 xl:flex-row">
					<div className="flex-1 space-y-6">
						<div className="rounded-3xl border border-white/20 bg-white/95 p-6 text-primary_text shadow-xl">
							<div className="flex flex-wrap items-center justify-between gap-4">
								<div>
									<h2 className="text-lg font-semibold text-primary_text">Certificate preview</h2>
									<p className="text-sm text-gray-500">This canvas reflects the selected participant.</p>
								</div>
								<button
									onClick={handleEdit}
									className="inline-flex items-center justify-center rounded-full bg-primary_button px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01]"
								>
									Edit design
								</button>
							</div>

						<div className="mt-6 flex justify-center">
							{loading ? (
								<div
									className="flex items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/80 text-gray-500"
									style={{ width: "850px", height: "600px" }}
								>
									Loading certificate...
								</div>
							) : certificate ? (
								<div
									id="certificate-preview"
									className="relative flex items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white"
									style={{ width: "850px", height: "600px" }}
								>
									<canvas
										id="preview-canvas"
										style={{
											display: "block",
											margin: "0 auto",
											border: "2px solid #00000010",
										}}
									/>
								</div>
							) : (
								<div
									className="flex items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/80 text-gray-500"
									style={{ width: "850px", height: "600px" }}
								>
									No certificate found
								</div>
							)}
						</div>

							<div className="mt-6 border-t border-gray-100 pt-4 text-xs uppercase tracking-[0.25em] text-gray-400">Preview only</div>
						</div>
					</div>

					<div className="xl:w-[420px]">
						<div className="rounded-3xl border border-white/20 bg-white/95 text-primary_text shadow-xl">
							<div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
								<h2 className="text-lg font-semibold text-primary_text">Participants</h2>
								<span className="text-sm text-gray-500">{participants.length} total</span>
							</div>
							<div className="max-h-[520px] overflow-auto">
								<table className="min-w-full">
									<thead className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
										<tr>
											{columns.length > 0 ? (
												columns.map((col) => (
													<th
														key={col}
														className="sticky top-0 z-10 bg-white px-5 py-3 shadow-sm"
													>
														{col}
													</th>
												))
											) : (
												<th className="sticky top-0 z-10 bg-white px-5 py-3 shadow-sm">
													No columns
												</th>
											)}
									</tr>
									</thead>
									<tbody className="divide-y divide-gray-100 text-sm text-gray-700">
										{loading ? (
											<tr>
												<td
													colSpan={Math.max(columns.length, 1)}
													className="px-6 py-8 text-center text-gray-500"
												>
													Loading participants...
												</td>
											</tr>
										) : participants.length > 0 ? (
											participants.map((recipient, index) => (
												<tr
													key={recipient.id ?? `participant-${index}`}
													className={`cursor-pointer transition ${
														selectedParticipant?.id === recipient.id
															? 'bg-primary_button/10'
															: 'hover:bg-primary_button/5'
													}`}
													onClick={() => handleParticipantClick(recipient)}
												>
													{columns.length > 0 ? (
														columns.map((col) => (
															<td key={col} className="px-5 py-3 text-left">
																{recipient.data?.[col] ?? ''}
															</td>
														))
													) : null}
												</tr>
											))
										) : (
											<tr>
												<td
													colSpan={Math.max(columns.length, 1)}
													className="px-6 py-8 text-center text-gray-500"
													>No participants found
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
};

export { PreviewPage };
