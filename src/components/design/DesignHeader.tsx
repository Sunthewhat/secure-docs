import { useState } from "react";
import SaveIcon from "@/asset/SaveIcon.svg";
import SaveSuccessIcon from "@/asset/SaveSuccessIcon.svg";
import ShareIcon from "@/asset/ShareIcon.svg";

interface DesignHeaderProps {
	certificateName: string;
	setCertificateName: (name: string) => void;
	onSave: () => Promise<boolean>;
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
	const [isSaveSuccess, setIsSaveSuccess] = useState(false);

	const formatLastSaved = (dateString?: string | null) => {
		if (!dateString) return null;
		try {
			const date = new Date(dateString);
			return date.toLocaleString();
		} catch {
			return null;
		}
	};

	const handleSave = async () => {
		const result = await onSave();
		if (result) {
			setIsSaveSuccess(true);
			setTimeout(() => {
				setIsSaveSuccess(false);
			}, 5000);
		}
	};

	return (
		<div className="flex w-full flex-wrap items-center justify-end gap-3">
			{/* form here */}
			{lastSaved && (
				<p className="text-gray-200 text-sm mt-1">
					Last saved: {formatLastSaved(lastSaved)}
				</p>
			)}
			<input
				type="text"
				value={certificateName}
				onChange={(e) => setCertificateName(e.target.value)}
				placeholder="Enter certificate name"
				className="font-noto text-base text-white accent-white px-3 border border-white rounded-full w-[200px] h-10 focus:outline-none"
			/>
			<button
				className={`text-noto text-base text-secondary_text rounded-full w-32 h-10 flex justify-center items-center gap-2 transition-colors duration-300 ${
					isSaveSuccess ? "bg-green-500" : "bg-secondary_button"
				}`}
				onClick={handleSave}
			>
				<img
					src={isSaveSuccess ? SaveSuccessIcon : SaveIcon}
					className="h-5 w-5"
					alt="Save"
				/>
				Save
			</button>
			<button
				className="text-noto text-base bg-primary_button text-secondary_text rounded-full w-32 h-10 flex justify-center items-center gap-2"
				onClick={onShare}
			>
				<img src={ShareIcon} className="h-5 w-5" alt="Share" />
				Share
			</button>
		</div>
	);
};

export default DesignHeader;
