interface DesignHeaderProps {
	certificateName: string;
	setCertificateName: (name: string) => void;
	onSave: () => void;
	onShare: () => void;
	lastSaved?: string | null;
}

const DesignHeader = ({
	certificateName,
	setCertificateName,
	onSave,
	onShare,
	lastSaved,
}: DesignHeaderProps) => {
	const formatLastSaved = (dateString?: string | null) => {
		if (!dateString) return null;
		try {
			const date = new Date(dateString);
			return date.toLocaleString();
		} catch {
			return null;
		}
	};
	return (
		<div className="font-noto bg-secondary_background rounded-[15px] flex  flex-row items-center w-full h-[72px] px-[20px]">
			{/* div text  */}
			<div className=" pl-[10px]">
				<p className="font-semibold text-[25px] w-fit ">
					Certificate canvas
				</p>
			</div>
			{/*div button*/}
			<div className="flex flex-row items-center ml-auto gap-3">
				{/* form here */}
				{lastSaved && (
					<p className="text-gray-600 text-[12px] mt-1">
						Last saved: {formatLastSaved(lastSaved)}
					</p>
				)}
				<input
					type="text"
					value={certificateName}
					onChange={(e) => setCertificateName(e.target.value)}
					placeholder="Enter certificate name"
					className="font-noto text-[14px] px-3 py-2 border border-gray-300 rounded-[7px] w-[200px] h-[39px] focus:outline-none focus:border-blue-500"
				/>
				<button
					className="text-noto text-[14px] bg-black text-secondary_text rounded-[7px] w-[92px] h-[39px] flex justify-center items-center "
					onClick={onSave}>
					Save
				</button>
				<button
					className="text-noto text-[14px] bg-primary_button text-secondary_text rounded-[7px] w-[92px] h-[39px] flex justify-center items-center "
					onClick={onShare}>
					Share
				</button>
			</div>
		</div>
	);
};

export default DesignHeader;
