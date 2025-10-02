import { useNavigate, useOutletContext } from 'react-router-dom';
import searchIcon from '../../asset/searchIcon.svg';
import { AllCertTypeResponse, CertType, DeleteCertResponse } from '@/types/response';
import { Axios } from '@/util/axiosInstance';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ShareModal from '@/components/modal/ShareModal';
import DeleteModal from '@/components/modal/DeleteModal';
import AiOutlineEllipsis from '../../asset/AiOutlineEllipsis.svg';
import { EmptyState } from '@/components/EmptyState';
import { createDesign } from '@/api/design/create';
import AddIcon from '@/asset/AddIcon.svg';
import HistoryIcon from '@/asset/HistoryIcon.svg';
import ShareIcon from '@/asset/ShareIcon.svg';

const formatDateTime = (value?: string) => {
	if (!value) return '-';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '-';
	return `${date.toLocaleDateString('en-GB')}, ${date.toLocaleTimeString('en-GB', {
		hour: '2-digit',
		minute: '2-digit',
	})}`;
};

const HomePage: FC = () => {
	const navigate = useNavigate();
	const { setPageTopBarProps } = useOutletContext<{
		setPageTopBarProps: (props: any) => void;
	}>();
	const [certificateItem, setCertificateItem] = useState<CertType[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);
	const [selectingShareCert, setSelectingShareCert] = useState<CertType | null>(null);

	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [selectingDeleteCert, setSelectingDeleteCert] = useState<CertType | null>(null);

	const handleCreateDesign = useCallback(async () => {
		try {
			const response = await createDesign();
			if (response.status === 200) {
				const newCertId = response.data.data.id;
				navigate(`/design/${newCertId}`);
			}
		} catch (error) {
			console.error('Failed to create design:', error);
		}
	}, [navigate]);

	const handleSelectDeleteCert = (cert: CertType) => {
		setSelectingDeleteCert(cert);
		setIsDeleteModalOpen(true);
	};

	const handleDelete = async (id: string) => {
		setIsDeleteModalOpen(false);
		const response = await Axios.delete<DeleteCertResponse>(`/certificate/${id}`);
		if (response.status !== 200) {
			// alert(response.data.msg);
			return;
		}
		fetchCerts();
	};

	const handleSelectShareCert = (cert: CertType) => {
		setSelectingShareCert(cert);
		setIsShareModalOpen(true);
	};

	const handleShare = (certId: string) => {
		setIsShareModalOpen(false);
		navigate(`/share/${certId}`);
	};

	const handleEdit = (certId: string) => {
		navigate(`/design/${certId}`);
	};

	const fetchCerts = async () => {
		const response = await Axios.get<AllCertTypeResponse>('/certificate');
		if (response.status !== 200) {
			// alert(response.data.data as unknown as string);
			return;
		}
		setCertificateItem(response.data.data);
	};

	useEffect(() => {
		fetchCerts();
	}, []);

	useEffect(() => {
		if (isSearchOpen && searchQuery === '') {
			const timer = setTimeout(() => {
				setIsSearchOpen(false);
			}, 5000);

			return () => clearTimeout(timer);
		}
	}, [isSearchOpen, searchQuery]);

	useEffect(() => {
		setPageTopBarProps({
			content: (
				<>
					<div className='flex flex-row gap-8'>
						<div className='flex relative overflow-hidden'>
							<input
								className={`text-noto text-white accent-white -mr-10 text-[14px] border-2 border-white rounded-full px-[20px] py-[15px] h-10 transition-all duration-300 ease-in-out focus:outline-none ${
									isSearchOpen
										? 'w-64 opacity-100'
										: 'w-0 opacity-0 pointer-events-none'
								}`}
								type='text'
								id='search'
								placeholder='Search designs...'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
							<button
								className='border-2 border-white bg-[#b9b9b921] rounded-full h-10 w-10'
								onClick={() => setIsSearchOpen(!isSearchOpen)}
							>
								<img
									className='h-4 w-4 mx-auto'
									src={searchIcon}
									alt='searchIcon'
								/>
							</button>
						</div>
						<button
							className='text-noto text-base bg-[#b9b9b921] border-2 text-secondary_text rounded-full w-48 h-10 flex justify-center items-center'
							onClick={handleCreateDesign}
						>
							<img src={AddIcon} alt='Create Design' className='h-5 w-5 mr-3'></img>
							Create design
						</button>
					</div>
				</>
			),
		});
		return () => setPageTopBarProps(null);
	}, [setPageTopBarProps, searchQuery, handleCreateDesign, isSearchOpen]);

	const filteredCertificates = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) return certificateItem;
		return certificateItem.filter((cert) => {
			const name = cert.name?.toLowerCase() ?? '';
			const id = cert.id?.toLowerCase() ?? '';
			return name.includes(query) || id.includes(query);
		});
	}, [certificateItem, searchQuery]);

	const isSearching = searchQuery.trim().length > 0;
	const emptyTitle = isSearching ? 'No designs found.' : 'No collections yet.';
	const emptyDescription = isSearching
		? 'Try a different keyword or clear the search to view all collections.'
		: 'Create a new design to start building your collection.';

	return (
		<div className='flex flex-col gap-20'>
			<div className='text-4xl font-semibold text-white'>
				<h1>Collection</h1>
			</div>
			{/* grid */}
			<div className='font-noto rounded-[15px] flex flex-col items-center w-full min-h-[770px]'>
				<div className='grid grid-cols-3 xl:grid-cols-4 gap-10 w-full h-full'>
					{filteredCertificates.length > 0 ? (
						filteredCertificates.map((cert) => (
							<Card
								key={cert.id}
								cert={cert}
								onEdit={() => handleEdit(cert.id)}
								onDelete={() => handleSelectDeleteCert(cert)}
								onShare={() => handleSelectShareCert(cert)}
								onHistory={() => navigate(`/history/${cert.id}`)}
							/>
						))
					) : (
						<div className='col-span-3'>
							<EmptyState title={emptyTitle} description={emptyDescription} />
						</div>
					)}
				</div>
			</div>

			<DeleteModal
				open={isDeleteModalOpen}
				cert={selectingDeleteCert}
				onClose={() => setIsDeleteModalOpen(false)}
				onConfirm={handleDelete}
			/>

			<ShareModal
				open={isShareModalOpen}
				cert={selectingShareCert}
				onClose={() => setIsShareModalOpen(false)}
				onConfirm={handleShare}
			/>
		</div>
	);
};

function Card({
	cert,
	onEdit,
	onDelete,
	onShare,
	onHistory,
}: {
	cert: CertType;
	onEdit: () => void;
	onDelete: () => void;
	onShare: () => void;
	onHistory?: () => void;
}) {
	const [open, setOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement | null>(null);
	const btnRef = useRef<HTMLButtonElement | null>(null);

	useEffect(() => {
		const onDocClick = (e: MouseEvent) => {
			if (!open) return;
			const target = e.target as Node;
			if (
				menuRef.current &&
				!menuRef.current.contains(target) &&
				btnRef.current &&
				!btnRef.current.contains(target)
			) {
				setOpen(false);
			}
		};
		const onEsc = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false);
		};
		document.addEventListener('mousedown', onDocClick);
		document.addEventListener('keydown', onEsc);
		return () => {
			document.removeEventListener('mousedown', onDocClick);
			document.removeEventListener('keydown', onEsc);
		};
	}, [open]);

	return (
		<div className='bg-[#d9d9d933] rounded-[30px] w-full aspect-square flex flex-col px-5 py-5 items-center border-1 border-white/70'>
			{/* image wrapper with top-right kebab menu */}
			<div className='relative w-full rounded-[10px] overflow-hidden'>
				<img
					src={
						cert.thumbnail_url != ''
							? cert.thumbnail_url
							: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png?20210521171500'
					}
					alt={`${cert.name} preview`}
					className='w-full aspect-[850/601] object-cover'
					onClick={onEdit}
					role='button'
					aria-label={`Open ${cert.name} editor`}
				/>

				{/* kebab */}
				<button
					ref={btnRef}
					className='absolute top-2 right-2 rounded-full bg-gray-300 hover:bg-gray-400 text-white p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white'
					aria-haspopup='menu'
					aria-expanded={open}
					aria-label={`Open actions for ${cert.name}`}
					onClick={(e) => {
						e.stopPropagation();
						setOpen((v) => !v);
					}}
				>
					<img src={AiOutlineEllipsis} alt='' aria-hidden='true' className='w-5 h-5' />
				</button>

				{/* dropdown menu */}
				{open && (
					<div
						ref={menuRef}
						role='menu'
						aria-label='Card actions'
						className='absolute top-12 right-2 z-10 min-w-[160px] rounded-md bg-white shadow-lg ring-1 ring-black/5  dark:text-white'
						onClick={(e) => e.stopPropagation()}
					>
						<MenuItem
							label='Edit'
							onSelect={() => {
								setOpen(false);
								onEdit();
							}}
						/>
						<MenuItem
							label='Delete'
							variant='danger'
							onSelect={() => {
								setOpen(false);
								onDelete(); // opens your DeleteModal
							}}
						/>
					</div>
				)}
			</div>

			<div className='mt-5 flex flex-col w-full'>
				<span className='font-semibold text-2xl text-white'>{cert.name || 'Untitled'}</span>
				<span className='text-xs text-gray-300 mt-1'>
					Last modified: {formatDateTime(cert.updated_at || cert.created_at)}
				</span>
			</div>

			{/* History + Share buttons */}
			<div className='mt-[15px] flex flex-row gap-[10px] w-full'>
				<button
					className='bg-secondary_button flex justify-center gap-2 text-white text-xl font-semibold py-3 rounded-full w-full'
					style={{ boxShadow: '0 4px 4px 0 rgba(0, 0, 0, 0.25)' }}
					onClick={onHistory}
				>
					<img src={HistoryIcon} className='h-6 w-6' />
					History
				</button>
				<button
					className='bg-primary_button flex justify-center gap-2 text-white text-xl font-semibold py-3 rounded-full w-full'
					style={{ boxShadow: '0 4px 4px 0 rgba(0, 0, 0, 0.25)' }}
					onClick={onShare}
				>
					<img src={ShareIcon} className='h-6 w-6' />
					Share
				</button>
			</div>
		</div>
	);
}

function MenuItem({
	label,
	onSelect,
	variant,
}: {
	label: string;
	onSelect: () => void;
	variant?: 'default' | 'danger';
}) {
	const itemRef = useRef<HTMLButtonElement | null>(null);

	useEffect(() => {
		itemRef.current?.focus();
	}, []);

	const base =
		'w-full flex items-center gap-2 px-3 py-2 text-left text-sm focus:outline-none bg-white rounded-md';
	const normalHover = ' hover:bg-black/5 hover:bg-gray-200 text-black';
	const danger = ' text-red-600 dark:text-red-400 hover:bg-red-100';

	return (
		<button
			ref={itemRef}
			role='menuitem'
			className={base + (variant === 'danger' ? danger : normalHover)}
			onClick={onSelect}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onSelect();
				}
			}}
		>
			<span>{label}</span>
		</button>
	);
}

export { HomePage };
