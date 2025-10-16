import { FC, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { getParticipantData } from '@/api/participant/validation';
import { ValidateParticipantData } from '@/types/response';
import { HiBadgeCheck, HiXCircle } from 'react-icons/hi';

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

	const statusConfig = participantData
		? participantData.participant.is_revoked
			? {
				label: 'Certificate Revoked',
				message:
					'This certificate can no longer be trusted. If you believe this is a mistake, please contact the issuer for clarification.',
				container: 'bg-red-50 border border-red-200 text-red-700',
				badge: 'bg-red-100 text-red-700',
				textColor: 'text-red-600',
				Icon: HiXCircle,
				badgeLabel: 'Revoked',
			}
			: {
				label: 'Certificate Valid',
				message:
					'This certificate has been issued and remains in good standing. You can confidently rely on its authenticity.',
				container: 'bg-green-50 border border-green-200 text-green-700',
				badge: 'bg-green-100 text-green-700',
				textColor: 'text-green-600',
				Icon: HiBadgeCheck,
				badgeLabel: 'Validated',
			}
		: null;

	if (isLoading) {
		return (
			<div className='select-none cursor-default flex flex-col gap-12 text-white'>
				<header className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
					<div className='flex flex-col gap-4'>
						<span className='text-sm uppercase tracking-[0.35em] text-white/60'>Validation</span>
						<div className='space-y-2'>
							<h1 className='text-3xl font-semibold sm:text-4xl'>Certificate validation</h1>
							<p className='max-w-2xl text-base text-white/70'>We are fetching certificate details and status.</p>
						</div>
					</div>
				</header>

				<section className='rounded-[32px] border border-white/25 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:p-10'>
					<p className='text-white/80'>Loading certificate…</p>
				</section>
			</div>
		);
	}

	if (!isLoading && loadingError !== '') {
		return (
			<div className='select-none cursor-default flex flex-col gap-12 text-white'>
				<header className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
					<div className='flex flex-col gap-4'>
						<span className='text-sm uppercase tracking-[0.35em] text-white/60'>Validation</span>
						<div className='space-y-2'>
							<h1 className='text-3xl font-semibold sm:text-4xl'>Certificate validation</h1>
							<p className='max-w-2xl text-base text-white/70'>Try refreshing to load the certificate again.</p>
						</div>
					</div>
				</header>

				<section className='rounded-[32px] border border-white/25 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:p-10'>
					<div className='flex flex-col items-center gap-4'>
						<div className='w-full max-w-[560px] rounded-2xl border border-red-300/40 bg-red-500/10 px-5 py-4 text-red-200'>
							<p className='text-sm font-semibold'>Failed to load</p>
							<p className='text-sm opacity-90'>{loadingError}</p>
						</div>
						<button
							className='inline-flex w-full items-center justify-center rounded-full bg-white/90 px-8 py-3 text-sm font-semibold text-primary_text shadow-lg transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:w-auto'
							onClick={handleRefresh}
						>
							Refresh
						</button>
					</div>
				</section>
			</div>
		);
	}

	return (
		<div className='select-none cursor-default flex flex-col gap-12 text-white'>
			<header className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
				<div className='flex flex-col gap-4'>
					<span className='text-sm uppercase tracking-[0.35em] text-white/60'>Validation</span>
					<div className='space-y-2'>
						<h1 className='text-3xl font-semibold sm:text-4xl'>Certificate validation</h1>
						<p className='max-w-2xl text-base text-white/70'>View certificate status and participant details.</p>
					</div>
				</div>
			</header>

			<section className='rounded-[32px] border border-white/25 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:p-10'>
				{participantData ? (
					<div className='mx-auto flex w-full max-w-5xl flex-col items-center gap-8'>
						{statusConfig && (
							<div
								role='status'
								className={`w-full max-w-[680px] rounded-2xl border px-5 py-4 shadow-xl backdrop-blur-md ${
									participantData.participant.is_revoked
										? 'border-red-300/40 bg-red-500/10 text-red-200'
										: 'border-green-300/40 bg-green-500/10 text-green-200'
								}`}
							>
								<div className='flex items-start gap-3'>
									<statusConfig.Icon size={28} className='mt-0.5' />
									<div className='flex-1'>
										<span className='inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]'>
											{statusConfig.badgeLabel}
										</span>
										<h2 className='mt-2 text-2xl font-bold text-white'>{statusConfig.label}</h2>
										<p className='mt-1 text-sm opacity-90'>{statusConfig.message}</p>
									</div>
								</div>
							</div>
						)}

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
						<div className='w-full max-w-[680px] rounded-3xl border border-white/20 bg-white/95 p-6 text-primary_text shadow-xl'>
							<h3 className='mb-4 text-center text-xl font-bold'>Participant information</h3>
							<div className='grid grid-cols-1 gap-4'>
								{Object.entries(participantData.participant.data).map(([key, value]) => (
									<div key={key} className='flex items-center justify-between border-b border-gray-200 pb-2'>
										<span className='capitalize text-gray-700'>{key}:</span>
										<span className='text-gray-900'>{String(value)}</span>
									</div>
								))}
							</div>
							<div className='mt-4 flex items-center justify-between'>
								<span className='font-medium text-gray-700'>Status</span>
								<span className={participantData.participant.is_revoked ? 'text-red-500' : 'text-green-600'}>
									{participantData.participant.is_revoked ? 'This certificate has been revoked' : 'This certificate is valid'}
								</span>
							</div>
						</div>
					</div>
				) : (
					<p className='text-white/80'>No certificate data found.</p>
				)}
			</section>
		</div>
	);
};

export { CertificateValidationResultPage };
