import { FC, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { getParticipantData } from '@/api/participant/validation';
import { ValidateParticipantData } from '@/types/response';
import { IoDocumentTextOutline } from 'react-icons/io5';

const CertificateValidationResultPage: FC = () => {
	const participantId = useParams()['participantId'] ?? '';

	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [loadingError, setLoadingError] = useState<string>('');
	const [participantData, setParticipantData] = useState<ValidateParticipantData | null>(null);

	const fetchData = async () => {
		const response = await getParticipantData(participantId);

		if (response.success) {
			setParticipantData(response.data);
		} else {
			setLoadingError(response.msg);
		}
		setIsLoading(false);
	};

	const handleRefresh = () => {
		setIsLoading(true);
		setLoadingError('');
		fetchData();
	};

	useEffect(() => {
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	if (isLoading) {
		return (
			<div className='select-none cursor-default'>
				<div className='font-noto bg-secondary_background rounded-[15px] flex flex-row items-center w-full h-[72px] mt-[24px] px-[20px]'>
					<div className='absolute left-1/2 transform -translate-x-1/2'>
						<p className='font-semibold text-[32px] w-fit'>Certificate Validation</p>
					</div>
				</div>
				<div className='font-noto bg-secondary_background min-h-[777px] rounded-[15px] flex justify-center items-center w-full h-full px-[40px] mt-[25px] pb-[48px] pt-[0px]'>
					<p className='text-gray-600'>Loading certificate...</p>
				</div>
			</div>
		);
	}

	if (!isLoading && loadingError !== '') {
		return (
			<div className='select-none cursor-default'>
				<div className='font-noto bg-secondary_background rounded-[15px] flex flex-row items-center w-full h-[72px] px-[20px] '>
					<div className='absolute left-1/2 transform -translate-x-1/2'>
						<p className='font-semibold text-[32px] w-fit'>Certificate Validation</p>
					</div>
				</div>
				<div className='font-noto bg-secondary_background min-h-[777px] rounded-[15px] flex flex-col justify-center items-center w-full h-full px-[40px] mt-[25px] py-[48px]'>
					<h1 className='text-2xl font-bold text-red-600 mb-4'>Failed to load</h1>
					<h2 className='text-lg text-gray-700 mb-6'>{loadingError}</h2>
					<button
						className='bg-primary_button text-white px-6 py-3 rounded-[7px] text-sm font-medium hover:bg-opacity-90'
						onClick={handleRefresh}
					>
						Refresh
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className='select-none cursor-default'>
			<div className='bg-black px-6 h-20 flex flex-row justify-between'>
				<div className='flex flex-row items-center gap-2'>
					<IoDocumentTextOutline size={30} className='text-white' />
					<h1 className='text-2xl font-bold text-white font-adlam cursor-pointer text-[25px]'>
						EasyCert
					</h1>
				</div>
			</div>
			<div className='font-noto bg-secondary_background rounded-[15px] flex flex-row items-center w-full h-[72px] px-[20px] mt-[24px]'>
				<div className='absolute left-1/2 transform -translate-x-1/2'>
					<p className='font-semibold text-[32px] w-fit'>Certificate Validation</p>
				</div>
			</div>
			<div className='font-noto bg-secondary_background min-h-[777px] rounded-[15px] flex justify-center items-center w-full h-full px-[40px] pb-[48px]'>
				{participantData ? (
					<div className='flex flex-col items-center w-full max-w-4xl'>
						{/* Certificate Display */}
						<div className='border-4 border-black aspect-[297/212] w-full max-w-[700px] mb-8'>
							<iframe
								src={`${participantData.participant.certificate_url}#toolbar=0&navpanes=0&scrollbar=0`}
								className='w-full h-full'
								title='Certificate PDF'
								style={{
									border: 'none',
								}}
							/>
						</div>

						{/* Participant Information */}
						<div className='bg-white rounded-[15px] p-6 w-full max-w-[600px] shadow-lg'>
							<h3 className='text-xl font-bold mb-4 text-center'>
								Participant Information
							</h3>
							<div className='grid grid-cols-1 gap-4'>
								{Object.entries(participantData.participant.data).map(
									([key, value]) => (
										<div
											key={key}
											className='flex justify-between items-center border-b border-gray-200 pb-2'
										>
											<span className='font-medium text-gray-700 capitalize'>
												{key}:
											</span>
											<span className='text-gray-900'>{value}</span>
										</div>
									)
								)}
							</div>
							<div className='mt-4 flex justify-between items-center'>
								<span className='font-medium text-gray-700'>Status :</span>
								<span
									className={
										participantData.participant.is_revoked
											? 'text-red-400'
											: 'text-green-400'
									}
								>
									{participantData.participant.is_revoked
										? 'This certificate has been revoked'
										: 'This certificate is valid'}
								</span>
							</div>
						</div>
					</div>
				) : (
					<div className='text-gray-600'>No certificate data found</div>
				)}
			</div>
		</div>
	);
};

export { CertificateValidationResultPage };
