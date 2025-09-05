// src/pages/SharePage.tsx
import { useNavigate, useParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { RiEdit2Line, RiDeleteBinLine, RiAddLine, RiCheckLine, RiCloseLine } from 'react-icons/ri';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Axios } from '@/util/axiosInstance';
import {
	AddParticipantResponse,
	CertType,
	EditParticipantResponse,
	GetParticipantResponse,
} from '@/types/response';
import { useToast } from '@/components/toast/ToastContext';
import WarningModal from '@/components/modal/WarningModal';

type Recipient = { [key: string]: string };

type ParticipantRow = {
	id?: string; // present if row exists on server
	data: Recipient; // editable fields
};

const SharePage = () => {
	const certId = useParams().certId as string;
	const navigate = useNavigate();
	const toast = useToast();
	const location = useLocation();
	const prevRef = useRef(location);

	const [columns, setColumns] = useState<string[]>(['name']);
	const [recipients, setRecipients] = useState<ParticipantRow[]>([]);
	const [editIndex, setEditIndex] = useState<number | null>(null);
	const [editForm, setEditForm] = useState<Recipient>({});
	const inputRef = useRef<HTMLInputElement | null>(null);

	// column rename state
	const [editColIndex, setEditColIndex] = useState<number | null>(null);
	const [colEditValue, setColEditValue] = useState<string>('');

	// ⚠️ New: modal + lock state (persisted per certificate)
	const [isWarningOpen, setIsWarningOpen] = useState(false);
	const [columnsLocked, setColumnsLocked] = useState(false);
	const COL_LOCK_KEY = useMemo(() => `columns-locked:${certId}`, [certId]);

	useEffect(() => {
		// store the previous path on every navigation
		const prevPath = prevRef.current.pathname + prevRef.current.search + prevRef.current.hash;
		sessionStorage.setItem('prevPath', prevPath);
		prevRef.current = location;
	}, [location]);

	const handleBack = () => {
		if (window.history.state?.idx > 0) {
			navigate(-1);
			return;
		}
		const prev = sessionStorage.getItem('prevPath');
		if (prev) navigate(prev);
		else navigate('/'); // final fallback
	};

	// Minimal cert object for WarningModal (it only uses cert.id)
	const certForModal = useMemo(() => ({ id: certId } as CertType), [certId]);

	// Load persisted lock state
	useEffect(() => {
		const saved = localStorage.getItem(COL_LOCK_KEY);
		if (saved === 'true') setColumnsLocked(true);
	}, [COL_LOCK_KEY]);

	// ===== API helpers =====

	const fetchParticipants = async () => {
		const response = await Axios.get<GetParticipantResponse>(`/participant/${certId}`);
		if (response.status !== 200) {
			toast.error(response.data.msg);
			return;
		}

		const serverRows = response.data.data ?? [];

		// Collect all unique columns found in server data
		const uniqueCols = Array.from(
			new Set(serverRows.flatMap((p) => Object.keys(p.data ?? {})))
		);

		// Normalize into local rows
		const mapped: ParticipantRow[] = serverRows.map((p) => {
			const normalized: Recipient = {};
			uniqueCols.forEach((col) => {
				const val = p.data[col];
				normalized[col] = val !== undefined && val !== null ? String(val) : '';
			});
			return { id: p.id, data: normalized };
		});

		setColumns(uniqueCols.length ? uniqueCols : ['name']);
		setRecipients(mapped);
	};

	const editParticipantByParticipantId = async (participantId: string, data: Recipient) => {
		const response = await Axios.put<EditParticipantResponse>(
			`/participant/edit/${participantId}`,
			{ data } // matches API: { data: { ... } }
		);
		if (response.status !== 200) {
			toast.error(response.data.msg);
			return;
		}
	};

	const createParticipant = async (certId: string, data: Recipient) => {
		// API expects array under "participants"
		const response = await Axios.post<AddParticipantResponse>(`/participant/add/${certId}`, {
			participants: [data],
		});
		if (response.status !== 200) {
			toast.error(response.data.msg);
			return;
		}
		// After creation, refresh so the new row gets its server id
		await fetchParticipants();
	};

	// ===== Next flow with modal =====

	const handleNext = () => {
		if (recipients.length === 0) {
			toast.error('Please add at least one recipient before continuing.');
			return;
		}
		if (!hasAtLeastOneFilledRow()) {
			toast.error('Please fill at least one field for a recipient.');
			return;
		}

		// If not locked yet, show warning modal; otherwise navigate
		if (!columnsLocked) {
			setIsWarningOpen(true);
			return;
		}
		navigate(`/preview/${certId}`);
	};

	// Modal handlers
	const handleWarningClose = () => setIsWarningOpen(false);

	const handleWarningConfirm = (confirmedCertId: string) => {
		// lock columns and persist it, then navigate
		setColumnsLocked(true);
		localStorage.setItem(COL_LOCK_KEY, 'true');
		setIsWarningOpen(false);
		navigate(`/preview/${confirmedCertId}`);
	};

	// ===== Effects =====

	useEffect(() => {
		fetchParticipants();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (editIndex !== null && inputRef.current) {
			inputRef.current.focus();
		}
	}, [editIndex]);

	// ===== Row edit handlers =====

	const handleEdit = (index: number) => {
		setEditIndex(index);
		setEditForm({ ...recipients[index].data });
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>, col: string) => {
		setEditForm((prev) => ({ ...prev, [col]: e.target.value }));
	};

	const handleSave = async (index: number) => {
		const row = recipients[index];

		// If user tried to save an entirely empty row, show error and keep editing.
		if (Object.values(editForm).every((v) => (v ?? '').trim() === '')) {
			toast.error('This row is empty. Please fill at least one field.');
			return;
		}

		// Optimistic local update
		const updated = [...recipients];
		updated[index] = { ...row, data: { ...editForm } };
		setRecipients(updated);
		setEditIndex(null);

		try {
			if (row.id) {
				await editParticipantByParticipantId(row.id, editForm);
			} else {
				await createParticipant(certId, editForm);
			}
		} catch {
			fetchParticipants();
		}
	};

	const handleCancel = () => {
		if (
			editIndex !== null &&
			Object.values(recipients[editIndex].data).every((v) => v === '')
		) {
			setRecipients(recipients.filter((_, i) => i !== editIndex));
		}
		setEditIndex(null);
	};

	const handleDelete = (index: number) => {
		// Local delete only. Wire a DELETE endpoint here if/when you have one.
		setRecipients(recipients.filter((_, i) => i !== index));
	};

	// ===== Add row/column & rename column =====

	const handleAddRow = () => {
		const newData: Recipient = {};
		columns.forEach((col) => (newData[col] = ''));
		const newRecipients = [...recipients, { id: undefined, data: newData }];
		setRecipients(newRecipients);
		setEditIndex(newRecipients.length - 1);
		setEditForm(newData);
	};

	const handleAddColumn = () => {
		if (columnsLocked) {
			toast.error('Columns are locked and can’t be modified anymore.');
			return;
		}
		const newCol = `Column ${columns.length + 1}`;
		setColumns((c) => [...c, newCol]);
		setRecipients((rows) => rows.map((r) => ({ ...r, data: { ...r.data, [newCol]: '' } })));
	};

	const handleStartEditColumn = (index: number, currentName: string) => {
		setEditColIndex(index);
		setColEditValue(currentName);
	};

	const handleSaveColumn = (index: number) => {
		if (columnsLocked) {
			toast.error('Columns are locked and can’t be renamed.');
			setEditColIndex(null);
			setColEditValue('');
			return;
		}
		if (colEditValue.trim() === '') return;
		const oldCol = columns[index];
		const newCol = colEditValue.trim();

		setColumns((cols) => cols.map((c, i) => (i === index ? newCol : c)));

		// rename keys inside each row.data
		setRecipients((rows) =>
			rows.map((r) => {
				const { [oldCol]: oldValue, ...rest } = r.data;
				return { ...r, data: { ...rest, [newCol]: oldValue ?? '' } };
			})
		);

		setEditColIndex(null);
		setColEditValue('');
	};

	const handleCancelColumn = () => {
		setEditColIndex(null);
		setColEditValue('');
	};

	// is the whole row empty? (all fields blank or whitespace)
	const isRowEmpty = (row: ParticipantRow) =>
		Object.values(row.data).every((v) => (v ?? '').trim() === '');

	// does the table contain at least one non-empty row?
	const hasAtLeastOneFilledRow = () => recipients.some((r) => !isRowEmpty(r));

	return (
		<div className='flex flex-col'>
			{/* Header */}
			<div className='font-noto bg-secondary_background rounded-[15px] flex flex-row items-center w-full h-[72px] px-[20px]'>
				<button
					className='text-noto text-[14px] bg-white text-primary_text rounded-[7px] w-[120px] h-[39px] flex justify-center items-center  underline '
					onClick={handleBack}
				>
					<svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
						<path d='M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z' />
					</svg>
					Back
				</button>
				<div className='absolute left-1/2 transform -translate-x-1/2'>
					<p className='font-semibold text-[32px] w-fit'>Add Recipients</p>
				</div>
				<div className='ml-auto'>
					<button
						className='text-noto text-[14px] bg-primary_button text-secondary_text rounded-[7px] w-[92px] h-[39px] flex justify-center items-center'
						onClick={handleNext}
					>
						Next
					</button>
				</div>
			</div>

			{/* Table + side actions */}
			<div className='font-noto bg-secondary_background min-h-[777px] rounded-[15px] flex flex-col items-center w-full h-full px-[50px] mt-[25px] py-[48px]'>
				<div className='w-full flex gap-4'>
					{/* Table */}
					<div className='w-full overflow-x-auto'>
						<table className='w-full text-left border-collapse border border-gray-300'>
							<thead className='bg-[#f3f3f3]'>
								<tr>
									{columns.map((col, i) => (
										<th
											key={i}
											className='p-3 text-center min-w-[200px] text-[14px] font-semibold text-gray-700 border border-gray-300'
										>
											{editColIndex === i ? (
												<div className='flex items-center justify-center gap-2'>
													<input
														type='text'
														value={colEditValue}
														onChange={(e) =>
															setColEditValue(e.target.value)
														}
														className='border rounded px-2 py-1 w-full'
														disabled={columnsLocked}
													/>
													<button
														onClick={() => handleSaveColumn(i)}
														className='text-green-600 hover:text-green-800 disabled:opacity-50'
														disabled={columnsLocked}
													>
														<RiCheckLine size={18} />
													</button>
													<button
														onClick={handleCancelColumn}
														className='text-gray-600 hover:text-gray-800'
													>
														<RiCloseLine size={18} />
													</button>
												</div>
											) : (
												<div className='flex items-center justify-center gap-2'>
													<span>{col}</span>
													<button
														onClick={() =>
															handleStartEditColumn(i, col)
														}
														className='text-gray-600 hover:text-blue-600 disabled:opacity-50'
														disabled={columnsLocked}
														title={
															columnsLocked
																? 'Columns are locked'
																: 'Rename column'
														}
													>
														<RiEdit2Line size={16} />
													</button>
												</div>
											)}
										</th>
									))}
									<th className='p-3 text-center text-[14px] font-semibold text-gray-700 border border-gray-300 w-[120px]'>
										Actions
									</th>
								</tr>
							</thead>

							<tbody>
								{recipients.length === 0 ? (
									<tr>
										<td
											colSpan={columns.length + 1}
											className='text-center text-gray-500 p-4 border border-gray-300'
										>
											No recipients yet. Click <b>+ Add Recipient</b> to
											start.
										</td>
									</tr>
								) : (
									recipients.map((row, index) => (
										<tr key={row.id ?? `new-${index}`}>
											{columns.map((col, i) => (
												<td
													key={i}
													className='p-3 text-sm text-gray-800 border border-gray-300'
												>
													{editIndex === index ? (
														<input
															ref={i === 0 ? inputRef : null}
															type='text'
															value={editForm[col] || ''}
															onChange={(e) => handleChange(e, col)}
															className='border rounded px-2 py-1 w-full'
															placeholder={`Enter ${col}`}
														/>
													) : (
														row.data[col] || ''
													)}
												</td>
											))}

											<td className='p-3 border border-gray-300 w-[120px]'>
												<div className='flex gap-4 justify-center'>
													{editIndex === index ? (
														<>
															<button
																onClick={() => handleSave(index)}
																className='text-green-600 hover:text-green-800'
															>
																Save
															</button>
															<button
																onClick={handleCancel}
																className='text-gray-600 hover:text-gray-800'
															>
																Cancel
															</button>
														</>
													) : (
														<>
															<button
																className='text-black hover:text-blue-600'
																onClick={() => handleEdit(index)}
																title={
																	row.id
																		? 'Edit (PUT)'
																		: 'Edit (POST on Save)'
																}
															>
																<RiEdit2Line size={20} />
															</button>
															<button
																className='text-black hover:text-red-600'
																onClick={() => handleDelete(index)}
															>
																<RiDeleteBinLine size={20} />
															</button>
														</>
													)}
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>

					{/* Right box: add column */}
					<div className='flex flex-col gap-2'>
						{!columnsLocked && ( // ✅ hide after confirm
							<button
								onClick={handleAddColumn}
								className='text-noto text-[14px] bg-blue-500 hover:bg-blue-600 text-white rounded-[7px] w-[142px] h-[39px] flex justify-center items-center mt-2'
							>
								<RiAddLine size={18} className='mr-2' /> Add Column
							</button>
						)}
					</div>
				</div>

				{/* Add Recipient */}
				<div className='flex gap-4 mt-6'>
					<button
						onClick={handleAddRow}
						className='text-noto text-[14px] bg-green-500 hover:bg-green-600 text-white rounded-[7px] w-[142px] h-[39px] flex justify-center items-center'
					>
						+ Add Recipient
					</button>
				</div>
			</div>

			{/* ⚠️ Warning Modal */}
			<WarningModal
				open={isWarningOpen}
				cert={certForModal}
				onClose={handleWarningClose}
				onConfirm={handleWarningConfirm}
			/>
		</div>
	);
};

export { SharePage };
