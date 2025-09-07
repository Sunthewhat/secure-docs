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
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-[512px] rounded-2xl bg-white p-8 shadow-lg">
				<p className="text-lg font-medium mb-6">
					Would you like to share{" "}
					<span className="font-semibold">{cert.name}</span>?
					<br />
					<span className="italic text-red-600">
						Warning: Please ensure all details are filled and
						correct such as signature and name anchor before
						proceeding.
					</span>
				</p>

				<div className="flex gap-3">
					<button
						className="flex-1 rounded-md bg-gray-200 py-2 text-gray-800"
						onClick={onClose}>
						Cancel
					</button>
					<button
						className="flex-1 rounded-md bg-primary_button py-2 text-white"
						onClick={() => onConfirm(cert.id)}>
						Share
					</button>
				</div>
			</div>
		</div>
	);
};

export default DesignWarning;
