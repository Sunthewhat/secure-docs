import { FC, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

const CertificateValidationScanPage: FC = () => {
	const navigate = useNavigate();
	const videoRef = useRef<HTMLVideoElement>(null);
	const [isScanning, setIsScanning] = useState(false);
	const [error, setError] = useState<string>('');
	const [scanResult, setScanResult] = useState<string>('');
	const readerRef = useRef<BrowserMultiFormatReader | null>(null);

	useEffect(() => {
		// Initialize the QR code reader
		readerRef.current = new BrowserMultiFormatReader();

		return () => {
			// Cleanup
			if (readerRef.current) {
				readerRef.current.reset();
			}
		};
	}, []);

	const extractParticipantIdFromUrl = (url: string): string | null => {
		try {
			// Parse the URL and extract participant ID from path like /validate/result/:participantId
			const urlObj = new URL(url);
			const pathSegments = urlObj.pathname.split('/');

			// Find the index of 'result' and get the next segment as participant ID
			const resultIndex = pathSegments.findIndex((segment) => segment === 'result');
			if (resultIndex !== -1 && pathSegments[resultIndex + 1]) {
				return pathSegments[resultIndex + 1];
			}

			return null;
		} catch {
			return null;
		}
	};

	const startScanning = async () => {
		if (!readerRef.current || !videoRef.current) return;

		try {
			setIsScanning(true);
			setError('');
			setScanResult('');

			// Get available video input devices
			const videoInputDevices = await navigator.mediaDevices.enumerateDevices();
			const cameras = videoInputDevices.filter((device) => device.kind === 'videoinput');

			if (cameras.length === 0) {
				throw new Error('No camera found');
			}

			// Use the first available camera (usually back camera on mobile)
			const selectedDeviceId = cameras[0].deviceId;

			// Start scanning
			await readerRef.current
				.decodeOnceFromVideoDevice(selectedDeviceId, videoRef.current)
				.then((result) => {
					const qrCodeText = result.getText();
					setScanResult(qrCodeText);

					// Extract participant ID from the scanned URL
					const participantId = extractParticipantIdFromUrl(qrCodeText);

					if (participantId) {
						// Navigate to the result page with the extracted participant ID
						navigate(`/validate/result/${participantId}`);
					} else {
						setError('Invalid QR code format. Expected a validation URL.');
					}
				})
				.catch((err) => {
					if (err instanceof NotFoundException) {
						setError('No QR code found. Please try again.');
					} else {
						setError(`Scanning error: ${err.message}`);
					}
				});
		} catch (err) {
			setError(`Camera error: ${err instanceof Error ? err.message : 'Unknown error'}`);
		} finally {
			setIsScanning(false);
		}
	};

	const stopScanning = () => {
		if (readerRef.current) {
			readerRef.current.reset();
		}
		setIsScanning(false);
	};

	return (
		<div className='select-none cursor-default'>
			<div className='font-noto bg-secondary_background rounded-[15px] flex flex-row items-center w-full h-[72px] px-[20px]'>
				<div className='absolute left-1/2 transform -translate-x-1/2'>
					<p className='font-semibold text-[32px] w-fit'>Scan QR Code</p>
				</div>
			</div>
			<div className='font-noto bg-secondary_background min-h-[777px] rounded-[15px] flex flex-col items-center w-full h-full px-[40px] mt-[25px] py-[48px]'>
				<div className='flex flex-col items-center w-full max-w-2xl'>
					{/* Camera Preview */}
					<div className='relative w-full max-w-[400px] aspect-square mb-8 bg-black rounded-[15px] overflow-hidden'>
						<video
							ref={videoRef}
							className='w-full h-full object-cover'
							autoPlay
							muted
							playsInline
						/>
						{!isScanning && (
							<div className='absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50'>
								<p className='text-white text-lg'>
									Camera preview will appear here
								</p>
							</div>
						)}
						{/* Scanning overlay */}
						{isScanning && (
							<div className='absolute inset-0 border-4 border-blue-500 animate-pulse'>
								<div className='absolute top-4 left-4 right-4 text-center'>
									<p className='text-white bg-black bg-opacity-50 px-2 py-1 rounded'>
										Scanning for QR code...
									</p>
								</div>
							</div>
						)}
					</div>

					{/* Control Buttons */}
					<div className='flex gap-4 mb-6'>
						<button
							onClick={startScanning}
							disabled={isScanning}
							className={`px-8 py-3 rounded-[7px] text-white font-medium ${
								isScanning
									? 'bg-gray-400 cursor-not-allowed'
									: 'bg-primary_button hover:bg-opacity-90'
							}`}
						>
							{isScanning ? 'Scanning...' : 'Start Scan'}
						</button>
						<button
							onClick={stopScanning}
							disabled={!isScanning}
							className={`px-8 py-3 rounded-[7px] text-white font-medium ${
								!isScanning
									? 'bg-gray-400 cursor-not-allowed'
									: 'bg-red-500 hover:bg-red-600'
							}`}
						>
							Stop Scan
						</button>
					</div>

					{/* Error Message */}
					{error && (
						<div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-[7px] w-full max-w-[400px] mb-4'>
							<p className='text-sm'>{error}</p>
						</div>
					)}

					{/* Scan Result */}
					{scanResult && (
						<div className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-[7px] w-full max-w-[400px] mb-4'>
							<p className='text-sm font-medium'>Scanned URL:</p>
							<p className='text-sm break-all'>{scanResult}</p>
						</div>
					)}

					{/* Instructions */}
					<div className='bg-white rounded-[15px] p-6 w-full max-w-[400px] shadow-lg'>
						<h3 className='text-lg font-bold mb-3 text-center'>Instructions</h3>
						<ul className='text-sm text-gray-700 space-y-2'>
							<li>• Allow camera access when prompted</li>
							<li>• Point your camera at the QR code</li>
							<li>• Keep the QR code within the viewfinder</li>
							<li>• The scanner will automatically detect and redirect</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
};

export { CertificateValidationScanPage };
