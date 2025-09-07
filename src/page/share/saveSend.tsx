import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLocation } from 'react-router-dom';
import type { GetCertificateResponse, Participant } from '@/types/response';
import { Axios } from '@/util/axiosInstance';

type RenderResponse = {
	success: boolean;
	msg: string;
	data: {
		message: string;
		results: Array<{
			filePath: string;
			participantId: string;
			status: 'success' | 'failed';
		}>;
		zipFilePath?: string;
	};
};

interface LocationState {
	participants?: Participant[];
	certId?: string;
}

const SaveSendPage = () => {
	const location = useLocation() as { state: LocationState | null };
	const navigate = useNavigate();

	// UI states
	const [rendering, setRendering] = useState(false);
	const [downloading, setDownloading] = useState(false);
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [participants, setParticipants] = useState<Participant[]>([]);
	const [certId, setCertId] = useState<string>('');

	useEffect(() => {
		setParticipants(location.state?.participants ?? []);
		setCertId(location.state?.certId ?? participants[0]?.certificate_id);
	}, [location.state?.certId, location.state?.participants, participants]);

	// store render payload after "Generate"
	const [renderData, setRenderData] = useState<RenderResponse['data'] | null>(null);

	// union of dynamic columns
	const columns = useMemo(() => {
		const set = new Set<string>();
		for (const p of participants) Object.keys(p.data ?? {}).forEach((k) => set.add(k));
		return Array.from(set);
	}, [participants]);

	// detect the "email" column (case-insensitive)
	const emailColumn = useMemo(
		() => columns.find((c) => c.toLowerCase().includes('email')) || null,
		[columns]
	);

	const participantIds = useMemo(
		() => participants.map((p) => p.id).filter((id): id is string => Boolean(id)),
		[participants]
	);

	// 1) GENERATE (render only)
	const handleGenerate = async () => {
		if (!certId) {
			setError('Missing certificate id.');
			return;
		}
		setError(null);
		setNotice(null);
		setRendering(true);
		try {
			const res = await Axios.post<RenderResponse>(`/certificate/render/${certId}`, {
				participantIds,
			});
			if (!res.data?.success) throw new Error(res.data?.msg || 'Render failed');
			setRenderData(res.data.data);
		} catch (e) {
			setError((e as Error).message || 'Render failed');
			setRenderData(null);
		} finally {
			setRendering(false);
		}
	};

	// 2) DOWNLOAD (first mark as distributed, then download)
	const handleDownload = async () => {
		if (!renderData) return;
		if (participantIds.length === 0) {
			setError('No participant IDs found.');
			return;
		}

		setError(null);
		setNotice(null);
		setDownloading(true);
		try {
			// A) mark as distributed
			try {
				const dist = await Axios.put(`/participant/distribute`, {
					participantIds,
				});
				if (!dist.data?.success) {
					setNotice(dist.data?.msg || 'Distribution status could not be updated.');
				} else {
					const d = dist.data?.data;
					if (d?.failed_count > 0) {
						setNotice(
							`Marked as distributed: ${d?.success_count ?? 0}/${
								d?.total_participants ?? participantIds.length
							}.`
						);
					} else {
						setNotice('Participants marked as distributed.');
					}
				}
			} catch {
				setNotice('Could not update distribution status, continuing to download…');
			}

			// B) download rendered file(s)
			const { zipFilePath, results } = renderData;
			const targetUrl = zipFilePath || results?.[0]?.filePath;
			if (!targetUrl) throw new Error('No file URL returned from renderer.');

			try {
				const certData = await Axios.get<GetCertificateResponse>(`/certificate/${certId}`);
				const zipfileUrl = certData.data.data.archive_url;
				window.open(zipfileUrl, '_blank', 'noopener,noreferrer');
			} catch {
				// CORS fallback
				window.open(targetUrl, '_blank', 'noopener,noreferrer');
			}
		} catch (e) {
			setError((e as Error).message || 'Download failed');
		} finally {
			setDownloading(false);
		}
	};

	// 3) SEND EMAILS (GET /certificate/mail/:certId?email=<columnName>)
	const handleSend = async () => {
		if (!certId) {
			setError('Missing certificate id.');
			return;
		}
		if (!emailColumn) {
			setError('Email column not found. Please ensure a column named "email" exists.');
			return;
		}

		setError(null);
		setNotice(null);
		setSending(true);
		try {
			const res = await Axios.get(`/certificate/mail/${certId}`, {
				params: { email: emailColumn }, // the column name to use
			});

			if (!res.data?.success) {
				throw new Error(res.data?.msg || 'Mail distribution failed');
			}

			// Show brief stats if present
			const d = res.data?.data;
			if (typeof d?.success_count === 'number' && typeof d?.failed_count === 'number') {
				setNotice(
					`Mail distribution completed: ${d.success_count} sent, ${d.failed_count} failed.`
				);
			} else {
				setNotice('Mail distribution completed.');
			}
		} catch (e) {
			setError((e as Error).message || 'Send failed');
		} finally {
			setSending(false);
		}
	};

	return (
		<div className='select-none cursor-default'>
			{/* Header */}
			<div className='font-noto bg-secondary_background rounded-[15px] flex flex-row items-center w-full h-[72px] px-[20px] relative'>
				<button
					className='text-noto text-[14px] bg-white text-primary_text rounded-[7px] w-[120px] h-[39px] flex justify-center items-center underline'
					onClick={() => void navigate(-1)}
				>
					<svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
						<path d='M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z' />
					</svg>
					Preview
				</button>

				<div className='absolute left-1/2 -translate-x-1/2'>
					<p className='font-semibold text-[32px] w-fit'>Distribute Certificate</p>
				</div>
			</div>

			{/* Content */}
			<div className='font-noto bg-secondary_background min-h-[777px] rounded-[15px] flex justify-start w-full h-full px-[40px] mt-[25px] py-[48px]'>
				<div className='flex flex-col w-full h-full px-[20px]'>
					{error && <div className='mb-3 text-red-600 text-sm'>{error}</div>}
					{notice && !error && (
						<div className='mb-3 text-green-700 text-sm'>{notice}</div>
					)}

					<div className='overflow-y-scroll max-h-[600px]'>
						<table className='w-full border border-gray-200 text-center text-sm table-auto'>
							<thead>
								<tr className='bg-gray-100'>
									{columns.length > 0 ? (
										columns.map((col, idx) => (
											<th
												key={col}
												className={`font-normal px-6 py-2 ${
													idx < columns.length - 1
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
								{participants.length > 0 ? (
									participants.map((p) => (
										<tr key={p.id} className='border border-gray-200'>
											{columns.map((col, idx) => (
												<td
													key={col}
													className={`px-6 py-2 break-words ${
														idx < columns.length - 1
															? 'border-r border-gray-200'
															: ''
													}`}
												>
													{p.data?.[col] ?? ''}
												</td>
											))}
										</tr>
									))
								) : (
									<tr>
										<td
											colSpan={Math.max(columns.length, 1)}
											className='px-6 py-8 text-gray-500'
										>
											No participants found
										</td>
									</tr>
								)}
							</tbody>
						</table>

						{/* ACTIONS AREA — centered */}
						<div className='w-full flex justify-center mt-6'>
							{!renderData ? (
								<button
									onClick={handleGenerate}
									disabled={rendering || participants.length === 0}
									className={`text-noto text-[14px] bg-primary_button text-secondary_text rounded-[7px] w-[160px] h-[42px] flex justify-center items-center ${
										rendering || participants.length === 0
											? 'opacity-60 cursor-not-allowed'
											: ''
									}`}
								>
									{rendering ? 'Rendering…' : 'Generate'}
								</button>
							) : (
								<div className='flex gap-3'>
									<button
										onClick={handleDownload}
										disabled={downloading}
										className={`text-noto text-[14px] bg-primary_button text-secondary_text rounded-[7px] w-[160px] h-[42px] flex justify-center items-center ${
											downloading ? 'opacity-60 cursor-not-allowed' : ''
										}`}
									>
										{downloading ? 'Preparing…' : 'Download'}
									</button>

									<button
										onClick={handleSend}
										disabled={sending}
										className={`text-noto text-[14px] bg-white text-primary_text rounded-[7px] border border-gray-300 w-[220px] h-[42px] flex justify-center items-center ${
											sending ? 'opacity-60 cursor-not-allowed' : ''
										}`}
									>
										{sending ? 'Sending…' : 'Send to participant email'}
									</button>
								</div>
							)}
						</div>
						{/* END ACTIONS AREA */}
					</div>
				</div>
			</div>
		</div>
	);
};

export { SaveSendPage };
