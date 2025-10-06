import { useNavigate } from "react-router-dom";
import searchIcon from "../../asset/searchIcon.svg";
import { AllCertTypeResponse, CertType, DeleteCertResponse } from "@/types/response";
import { Axios } from "@/util/axiosInstance";
import { FC, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ShareModal from "@/components/modal/ShareModal";
import DeleteModal from "@/components/modal/DeleteModal";
import AiOutlineEllipsis from "../../asset/AiOutlineEllipsis.svg";
import { EmptyState } from "@/components/EmptyState";
import { createDesign } from "@/api/design/create";
import AddIcon from "@/asset/AddIcon.svg";
import HistoryIcon from "@/asset/HistoryIcon.svg";
import ShareIcon from "@/asset/ShareIcon.svg";
import { RiEdit2Line, RiDeleteBin6Line } from "react-icons/ri";

const formatDateTime = (value?: string) => {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "-";
	return `${date.toLocaleDateString("en-GB")}, ${date.toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
	})}`;
};

const HomePage: FC = () => {
	const navigate = useNavigate();
	const [certificateItem, setCertificateItem] = useState<CertType[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
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
			console.error("Failed to create design:", error);
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
		const response = await Axios.get<AllCertTypeResponse>("/certificate");
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
		if (isSearchOpen && searchQuery === "") {
			const timer = setTimeout(() => {
				setIsSearchOpen(false);
			}, 5000);

			return () => clearTimeout(timer);
		}
	}, [isSearchOpen, searchQuery]);

	const filteredCertificates = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) return certificateItem;
		return certificateItem.filter((cert) => {
			const name = cert.name?.toLowerCase() ?? "";
			const id = cert.id?.toLowerCase() ?? "";
			return name.includes(query) || id.includes(query);
		});
	}, [certificateItem, searchQuery]);

	const isSearching = searchQuery.trim().length > 0;
	const emptyTitle = isSearching ? "No designs found." : "No collections yet.";
	const emptyDescription = isSearching
		? "Try a different keyword or clear the search to view all collections."
		: "Create a new design to start building your collection.";

	return (
		<div className="select-none cursor-default flex flex-col gap-12 text-white">
			<header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
				<div className="flex flex-col gap-4">
					<span className="text-sm uppercase tracking-[0.35em] text-white/60">Collection</span>
					<div className="space-y-2">
						<h1 className="text-4xl font-semibold">Collection</h1>
						<p className="max-w-2xl text-base text-white/70">Browse, create, and maintain your certificate templates from one place.</p>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-4">
					<div className="flex items-center gap-2">
						<input
							className={`h-10 rounded-full border transition-all duration-300 ease-in-out focus:outline-none bg-white/10 border-white/20 text-sm text-white placeholder:text-white/60 ${
								isSearchOpen
									? 'w-64 px-4 opacity-100'
									: 'w-0 px-0 opacity-0 pointer-events-none border-transparent'
							}`}
							type="text"
							id="search"
							placeholder="Search designs..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
						<button
							className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
							onClick={() => setIsSearchOpen(!isSearchOpen)}
							aria-label={isSearchOpen ? 'Close search' : 'Open search'}
						>
							<img className="h-4 w-4" src={searchIcon} alt="searchIcon" />
						</button>
					</div>
					<button
						className="inline-flex items-center gap-3 rounded-full bg-primary_button px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01]"
						onClick={handleCreateDesign}
					>
						<img src={AddIcon} alt="Create design" className="h-5 w-5" />
						<span>Create design</span>
					</button>
				</div>
			</header>

			<section className="rounded-[32px] border border-white/25 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
				<div className="grid w-full gap-10 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
						<div className="col-span-full">
							<EmptyState title={emptyTitle} description={emptyDescription} />
						</div>
					)}
				</div>
			</section>

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
			if (e.key === "Escape") setOpen(false);
		};
		document.addEventListener("mousedown", onDocClick);
		document.addEventListener("keydown", onEsc);
		return () => {
			document.removeEventListener("mousedown", onDocClick);
			document.removeEventListener("keydown", onEsc);
		};
	}, [open]);

	return (
		<div className="bg-[#d9d9d933] rounded-[30px] w-full aspect-square flex flex-col px-5 py-5 items-center border-1 border-white/70">
			{/* image wrapper with top-right kebab menu */}
			<div className="relative w-full rounded-[10px] overflow-hidden bg-white">
				<img
					src={
						cert.thumbnail_url != ""
							? cert.thumbnail_url
							: "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png?20210521171500"
					}
					alt={`${cert.name} preview`}
					className="w-full aspect-[850/601] object-cover"
					onClick={onEdit}
					role="button"
					aria-label={`Open ${cert.name} editor`}
				/>

				{/* kebab */}
				<button
					ref={btnRef}
					className="absolute top-2 right-2 rounded-full bg-[#bcbcbc9f] hover:bg-gray-400 text-white p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
					aria-haspopup="menu"
					aria-expanded={open}
					aria-label={`Open actions for ${cert.name}`}
					onClick={(e) => {
						e.stopPropagation();
						setOpen((v) => !v);
					}}
				>
					<img src={AiOutlineEllipsis} alt="" aria-hidden="true" className="w-5 h-5" />
				</button>

				{/* dropdown menu */}
				{open && (
					<div
						ref={menuRef}
						role="menu"
						aria-label="Card actions"
						className="absolute top-12 right-2 z-20 min-w-[190px] rounded-2xl bg-black/70 p-2 text-white shadow-2xl backdrop-blur-xl"
						onClick={(e) => e.stopPropagation()}
					>
						<MenuItem
							label="Edit design"
							icon={<RiEdit2Line className="h-5 w-5" />}
							onSelect={() => {
								setOpen(false);
								onEdit();
							}}
						/>
						<MenuItem
							label="Delete design"
							icon={<RiDeleteBin6Line className="h-5 w-5" />}
							variant="danger"
							onSelect={() => {
								setOpen(false);
								onDelete();
							}}
						/>
					</div>
				)}
			</div>

			<div className="mt-5 flex flex-col w-full">
				<span className="font-semibold text-2xl text-white">{cert.name || "Untitled"}</span>
				<span className="text-xs text-gray-300 mt-1">
					Last modified: {formatDateTime(cert.updated_at || cert.created_at)}
				</span>
			</div>

			{/* History + Share buttons */}
			<div className="mt-[15px] flex flex-row gap-[10px] w-full">
				<button
					className="bg-secondary_button flex justify-center gap-2 text-white text-xl font-semibold py-3 rounded-full w-full"
					style={{ boxShadow: "0 4px 4px 0 rgba(0, 0, 0, 0.25)" }}
					onClick={onHistory}
				>
					<img src={HistoryIcon} className="h-6 w-6" />
					History
				</button>
				<button
					className="bg-primary_button flex justify-center gap-2 text-white text-xl font-semibold py-3 rounded-full w-full"
					style={{ boxShadow: "0 4px 4px 0 rgba(0, 0, 0, 0.25)" }}
					onClick={onShare}
				>
					<img src={ShareIcon} className="h-6 w-6" />
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
	icon,
}: {
	label: string;
	onSelect: () => void;
	variant?: "default" | "danger";
	icon?: ReactNode;
}) {
	const itemRef = useRef<HTMLButtonElement | null>(null);

	useEffect(() => {
		itemRef.current?.focus();
	}, []);

	const base =
		"w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition focus:outline-none bg-white/5";
	const normalHover = " bg-white/5 text-white hover:bg-white/15";
	const danger = " text-red-300 hover:bg-red-500/20";

	return (
		<button
			ref={itemRef}
			role="menuitem"
			className={base + (variant === "danger" ? danger : normalHover)}
			onClick={onSelect}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onSelect();
				}
			}}
		>
		{icon && (
			<span
				className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ${
					variant === "danger" ? "text-red-300" : "text-white"
				}`}
			>
				{icon}
			</span>
		)}
			<span>{label}</span>
		</button>
	);
}

export { HomePage };
