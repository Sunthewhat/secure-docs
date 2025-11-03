import React from "react";

interface ConfirmModalProps {
	open: boolean;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	onClose: () => void;
	onConfirm: () => void;
	variant?: "danger" | "warning" | "info";
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
	open,
	title,
	message,
	confirmText = "Confirm",
	cancelText = "Cancel",
	onClose,
	onConfirm,
	variant = "danger",
}) => {
	if (!open) return null;

	const variantStyles = {
		danger: {
			title: "text-red-600",
			button: "bg-red-600 hover:bg-red-700",
		},
		warning: {
			title: "text-yellow-600",
			button: "bg-yellow-600 hover:bg-yellow-700",
		},
		info: {
			title: "text-blue-600",
			button: "bg-blue-600 hover:bg-blue-700",
		},
	};

	const styles = variantStyles[variant];

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
			<div className="w-full max-w-[420px] rounded-[28px] border border-white/25 bg-white/95 p-8 text-primary_text shadow-2xl sm:p-10">
				<div className="space-y-4 text-center">
					<h2 className={`text-2xl font-semibold ${styles.title}`}>
						{title}
					</h2>
					<p className="text-sm text-gray-600">{message}</p>
				</div>
				<div className="mt-8 flex flex-col gap-3 sm:flex-row">
					<button
						className="flex-1 rounded-full border border-white/40 bg-white/90 px-4 py-3 text-sm font-semibold text-primary_button transition hover:scale-[1.01]"
						onClick={onClose}
					>
						{cancelText}
					</button>
					<button
						className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01] ${styles.button}`}
						onClick={onConfirm}
					>
						{confirmText}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ConfirmModal;
