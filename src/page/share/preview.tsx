import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import * as fabric from 'fabric';
import { Axios } from '@/util/axiosInstance';
import {
	GetParticipantResponse,
	Participant,
	GetCertificateResponse,
	Certificate,
	GetAnchorResponse,
} from '@/types/response';

const ensureEmailColumn = (cols: string[]): string[] => {
	if (!cols.length) return ['email'];
	const filtered = cols.filter(
		(col): col is string => typeof col === 'string' && col.trim().length > 0
	);
	const normalized = filtered.map((col) => col.trim().toLowerCase());
	let targetIndex = normalized.findIndex((col) => col === 'email');
	if (targetIndex === -1) {
		targetIndex = normalized.findIndex((col) => col.includes('email'));
	}
	const reordered = [...filtered];
	if (targetIndex === -1) {
		reordered.push('email');
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
	const [participants, setParticipants] = useState<Participant[]>([]);
	const [columns, setColumns] = useState<string[]>([]);
	const [certificate, setCertificate] = useState<Certificate | null>(null);
	const [loading, setLoading] = useState(true);
	const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
	const canvasRef = useRef<fabric.Canvas | null>(null);

	// Fetch certificate and participants data from API
	useEffect(() => {
		const fetchData = async () => {
			if (!certId) return;

			try {
				setLoading(true);

				// Fetch certificate data
				const certResponse = await Axios.get<GetCertificateResponse>(
					`/certificate/${certId}`
				);
				if (certResponse.status === 200) {
					setCertificate(certResponse.data.data);
				} else {
					console.error('Failed to fetch certificate');
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
								.map((col) => (typeof col === 'string' ? col.trim() : ''))
								.filter((col) => col.length > 0);
							anchorColumns = ensureEmailColumn(sanitized);
						}
					} else {
						console.error('Failed to fetch anchor columns');
					}
				} catch (anchorError) {
					console.error('Error fetching anchor columns:', anchorError);
				}

				if (!anchorColumns.length) {
					anchorColumns = ensureEmailColumn([]);
				}

				// Fetch participants data
				const participantResponse = await Axios.get<GetParticipantResponse>(
					`/participant/${certId}`
				);
				if (participantResponse.status === 200) {
					const participantsData = participantResponse.data.data;
					const serverColumns = Array.from(
						new Set(
							participantsData.flatMap((participant) =>
								participant?.data ? Object.keys(participant.data) : []
							)
						)
					);

					const anchorOnlyEmail =
						anchorColumns.length > 0 &&
						anchorColumns.every((col) => col.toLowerCase().includes('email'));

					let resolvedColumns = anchorColumns.length ? [...anchorColumns] : [];

					if (!anchorOnlyEmail) {
						const serverNormalized = serverColumns
							.map((col) => (typeof col === 'string' ? col.trim() : ''))
							.filter((col) => col.length > 0);

						if (!resolvedColumns.length && serverNormalized.length) {
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
						resolvedColumns = ['email'];
					}

					const orderedColumns = ensureEmailColumn(resolvedColumns);
					setColumns(orderedColumns);

					const normalizedParticipants = participantsData.map((participant) => {
						const normalizedData: Participant['data'] = {};
						orderedColumns.forEach((col) => {
							normalizedData[col] = participant.data?.[col] ?? '';
						});
						return { ...participant, data: normalizedData };
					});

					setParticipants(normalizedParticipants);
					if (normalizedParticipants.length > 0) {
						setSelectedParticipant(normalizedParticipants[0]);
					}
				} else {
					console.error('Failed to fetch participants');
				}
			} catch (error) {
				console.error('Error fetching data:', error);
			} finally {
				setLoading(false);
			}
		};

		void fetchData();
	}, [certId]);

	// Function to update certificate with participant data
	const updateCertificateWithParticipantData = (participant: Participant) => {
		if (!canvasRef.current) {
			return;
		}

		const canvas = canvasRef.current;
		const objects = canvas.getObjects();

		// Process all objects to ensure they are visible and handle anchors
		objects.forEach((obj) => {
			// Ensure object is visible and properly configured
			obj.set({
				visible: true,
				opacity: 1,
			});

			// Handle grouped anchors (text anchors)
			if (obj.isAnchor && obj.id && obj.type === 'group') {
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
					.find((subObj) => subObj instanceof fabric.Textbox) as fabric.Textbox;
				if (textObject) {
					// Extract column name from group id by removing "PLACEHOLDER-" prefix
					const columnName = obj.id.replace('PLACEHOLDER-', '');
					const fieldValue = participant.data[columnName];
					if (fieldValue) {
						textObject.set('text', fieldValue);
					}
				}
			}
			// Handle individual textbox anchors
			else if (obj.isAnchor && obj.id && obj.type === 'textbox') {
				const textbox = obj as fabric.Textbox;
				// Extract column name from id by removing "PLACEHOLDER-" prefix
				const columnName = obj.id.replace('PLACEHOLDER-', '');
				const fieldValue = participant.data[columnName];
				if (fieldValue) {
					textbox.set('text', fieldValue);
				}
			}
			// Handle non-anchor text objects - ensure they remain visible
			else if (obj.type === 'textbox' || obj.type === 'text') {
				// For non-anchor text objects, just ensure they are visible
				obj.set({
					visible: true,
					opacity: 1,
				});
			}
		});

		canvas.renderAll();
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

		const containerElement = document.getElementById('certificate-preview');
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
			canvas.getObjects().forEach((obj) => {
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
			});

			canvas.renderAll();

			// Re-apply participant data if selected
			if (selectedParticipant) {
				setTimeout(() => {
					updateCertificateWithParticipantData(selectedParticipant);
				}, 100);
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
			const canvasElement = document.getElementById('preview-canvas') as HTMLCanvasElement;
			const containerElement = document.getElementById('certificate-preview');

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
			canvasElement.style.maxWidth = '100%';
			canvasElement.style.maxHeight = '100%';
			canvasElement.style.width = 'auto';
			canvasElement.style.height = 'auto';

			canvasRef.current = canvas;

			// Load and render the certificate design
			try {
				canvas
					.loadFromJSON(designData)
					.then(() => {
						// Scale down the entire canvas content to fit preview
						const objects = canvas.getObjects();
						// Calculate scale to fit the design in the preview canvas
						const scaleX = canvasWidth / originalWidth;
						const scaleY = canvasHeight / originalHeight;
						const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

						// Apply scale and disable interactions for all objects
						objects.forEach((obj) => {
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
						});

						canvas.renderAll();

						// Apply selected participant data if available
						setTimeout(() => {
							if (selectedParticipant) {
								updateCertificateWithParticipantData(selectedParticipant);
							}
						}, 100);
					})
					.catch((error) => {
						console.error('Error loading certificate design:', error);
					});
			} catch (error) {
				console.error('Error parsing certificate design:', error);
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
		const containerElement = document.getElementById('certificate-preview');
		if (!containerElement) return;

		const resizeObserver = new ResizeObserver(() => {
			resizeCanvas();
		});

		resizeObserver.observe(containerElement);

		return () => {
			resizeObserver.disconnect();
		};
	}, [resizeCanvas]);

	// Update certificate with selected participant data when participant changes
	useEffect(() => {
		if (selectedParticipant && canvasRef.current) {
			// Small delay to ensure canvas is fully rendered
			const timer = setTimeout(() => {
				updateCertificateWithParticipantData(selectedParticipant);
			}, 200);

			return () => clearTimeout(timer);
		}
	}, [selectedParticipant]);

	// Function to handle sending data to next page via navigation state
	const handleSend = () => {
		void navigate('/share/preview/send', { state: { participants } });
	};
	const handleEdit = () => {
		// Pass edit mode and certificate ID to design page
		void navigate(`/design/${certId}`);
	};

	return (
		<div className='select-none cursor-default'>
			<div className='font-noto bg-secondary_background rounded-[15px] flex  flex-row items-center w-full h-[72px] px-[20px]'>
				{/* back button */}
				<button
					className='text-noto text-[14px] bg-white text-primary_text rounded-[7px] w-[120px] h-[39px] flex justify-center items-center  underline '
					onClick={() => void navigate(-1)}
				>
					<svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
						<path d='M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z' />
					</svg>
					Edit
				</button>
				{/* div text  */}
				<div className='absolute left-1/2 transform  -translate-x-1/2'>
					<p className='font-semibold text-[25px] w-fit '>Preview</p>
				</div>
				{/*div button*/}
				<div className='ml-auto'>
					<button
						className='text-noto text-[14px] bg-primary_button text-secondary_text rounded-[7px] w-[90px] h-[39px] flex justify-center items-center '
						onClick={handleSend}
					>
						Next step
					</button>
				</div>
			</div>
			<div className='font-noto bg-secondary_background min-h-[777px] rounded-[15px] flex justify-start w-full h-full px-[40px] mt-[25px] py-[48px] '>
				{/* <div className='flex flex-col xl:flex-row w-full h-full'> */}
				<div className='flex flex-col w-full h-full'>
					{/* <div className='flex flex-col w-full xl:w-1/2 2xl:w-3/5 min-w-[700px] flex-shrink-0 items-start'> */}
					<div className='flex flex-col w-full min-w-[750px] flex-shrink-0 items-start'>
						<div
							// className='border-4 border-black p-2 w-full'
							className='border-4p-2 w-full'
							// style={{ minHeight: '400px', height: '60vh', maxHeight: '700px' }}
							style={{ minHeight: '400px', height: '60vh' }}
						>
							{loading ? (
								<div className='w-full h-full flex items-center justify-center bg-gray-100'>
									<p className='text-gray-600'>Loading certificate...</p>
								</div>
							) : certificate ? (
								<div
									id='certificate-preview'
									className='w-full h-full bg-white relative flex items-center justify-center'
								>
									<canvas
										id='preview-canvas'
										style={{
											display: 'block',
											margin: '0 auto',
											border: '2px solid #00000010',
										}}
									/>
								</div>
							) : (
								<div className='w-full h-full flex items-center justify-center bg-gray-100'>
									<p className='text-gray-600'>No certificate found</p>
								</div>
							)}
						</div>

						{/* Edit Design Button */}
						<div className='mt-5 flex flex-row justify-between items-center w-full'>
							<button
								className='bg-primary_button text-white px-5 h-[40px] rounded-[7px] text-sm font-medium '
								onClick={handleEdit}
							>
								Edit Design
							</button>
							{/* Navigation arrows */}
							<div className='flex justify-center gap-2'>
								<button className='w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-400'>
									<svg
										width='16'
										height='16'
										viewBox='0 0 24 24'
										fill='currentColor'
									>
										<path d='M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z' />
									</svg>
								</button>
								<button className='w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-400'>
									<svg
										width='16'
										height='16'
										viewBox='0 0 24 24'
										fill='currentColor'
									>
										<path d='M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z' />
									</svg>
								</button>
							</div>
						</div>
					</div>

					{/* Participants Table */}
					{/* <div className='w-full xl:w-1/2 2xl:w-2/5 pl-0 xl:pl-[20px] mt-8 xl:mt-0 flex-shrink-0'> */}
					<div className='w-full pl-0 xl:pl-[20px] mt-8 xl:mt-0 flex-shrink-0'>
						<div
							className='overflow-auto max-h-[600px] scrollbar-visible'
							style={{ scrollbarWidth: 'auto' }}
						>
							<table className='min-w-full border border-gray-200 text-center text-sm table-auto'>
								<thead>
									<tr className='bg-gray-100'>
										{columns.length > 0 ? (
											columns.map((col, index) => (
												<th
													key={col}
													className={`font-normal px-6 py-2 ${
														index < columns.length - 1
															? 'border-r border-gray-200'
															: ''
													}`}
												>
													{col}
												</th>
											))
										) : (
											<th className='font-normal px-6 py-2'>No columns</th>
										)}
									</tr>
								</thead>
								<tbody>
									{loading ? (
										<tr>
											<td
												colSpan={columns.length > 0 ? columns.length : 1}
												className='px-6 py-8 text-gray-500'
											>
												Loading participants...
											</td>
										</tr>
									) : participants.length > 0 ? (
										participants.map((recipient) => (
											<tr
												key={recipient.id}
												className={`border border-gray-200 cursor-pointer hover:bg-gray-50 ${
													selectedParticipant?.id === recipient.id
														? 'bg-blue-50 border-blue-200'
														: ''
												}`}
												onClick={() => handleParticipantClick(recipient)}
											>
												{columns.length > 0
													? columns.map((col, index) => (
															<td
																key={col}
																className={`px-6 py-2 break-words ${
																	index < columns.length - 1
																		? 'border-r border-gray-200'
																		: ''
																}`}
															>
																{recipient.data[col] || ''}
															</td>
													  ))
													: null}
											</tr>
										))
									) : (
										<tr>
											<td
												colSpan={columns.length > 0 ? columns.length : 1}
												className='px-6 py-8 text-gray-500'
											>
												No participants found
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export { PreviewPage };
