import { CertType } from "@/types/response";
import React from "react";

interface ShareModalProps {
	open: boolean;
	cert: CertType | null;
	onClose: () => void;
	onConfirm: (certId: string) => void;
}

const DesignWarning: React.FC<ShareModalProps> = ({
	open,
	cert,
	onClose,
	onConfirm,
}) => {
	if (!open) return null; // don't render if modal is closed
	if (!cert) return null; // don't render if no cert is selected

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
			<div className="w-full max-w-[520px] rounded-[28px] border border-white/25 bg-white/95 p-8 text-primary_text shadow-2xl sm:p-10">
				<div className="space-y-4">
					<h2 className="text-2xl font-semibold text-primary_button">
						Share warning
					</h2>
					<p className="text-sm text-gray-600">
						You are about to share{" "}
						<span className="font-semibold">{cert.name}</span>.
						Please ensure anchors, signatures, and participant
						details are correct before proceeding.
					</p>
					<p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
						Warning: Once click on share we will send the email to
						request a signature from the signer that you have added.
					</p>
				</div>
				<div className="mt-8 flex flex-col gap-3 sm:flex-row">
					<button
						className="flex-1 rounded-full border border-white/40 bg-white/90 px-4 py-3 text-sm font-semibold text-primary_button transition hover:scale-[1.01]"
						onClick={onClose}>
						Cancel
					</button>
					<button
						className="flex-1 rounded-full bg-primary_button px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01]"
						onClick={() => onConfirm(cert.id)}>
						Share
					</button>
				</div>
			</div>
		</div>
	);
};

export default DesignWarning;
