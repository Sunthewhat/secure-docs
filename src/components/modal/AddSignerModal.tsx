import { FC, useState } from "react";

type AddSignerModalProps = {
	open: boolean;
	onClose: () => void;
	onConfirm: (name: string, email: string) => void;
	loading?: boolean;
};

const AddSignerModal: FC<AddSignerModalProps> = ({
	open,
	onClose,
	onConfirm,
	loading = false,
}) => {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");

	if (!open) return null;

	const handleSubmit = () => {
		if (name.trim() && email.trim()) {
			onConfirm(name.trim(), email.trim());
			setName("");
			setEmail("");
		}
	};

	const handleClose = () => {
		setName("");
		setEmail("");
		onClose();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
			<div className="w-full max-w-[480px] rounded-[28px] border border-white/25 bg-white/95 p-8 text-primary_text shadow-2xl sm:p-10">
				<div className="space-y-6">
					<div className="space-y-2">
						<h2 className="text-2xl font-semibold">Add Signer</h2>
						<p className="text-sm text-gray-600">
							Enter the signer's information to add them to the
							document.
						</p>
					</div>

					<div className="space-y-4">
						<div>
							<label
								htmlFor="signer-name"
								className="block text-sm font-medium text-gray-700 mb-2">
								Name
							</label>
							<input
								id="signer-name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary_button focus:outline-none focus:ring-2 focus:ring-primary_button/20 transition"
								placeholder="Enter signer's name"
								disabled={loading}
							/>
						</div>

						<div>
							<label
								htmlFor="signer-email"
								className="block text-sm font-medium text-gray-700 mb-2">
								Email
							</label>
							<input
								id="signer-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary_button focus:outline-none focus:ring-2 focus:ring-primary_button/20 transition"
								placeholder="Enter signer's email"
								disabled={loading}
							/>
						</div>
					</div>
				</div>

				<div className="mt-8 flex flex-col gap-3 sm:flex-row">
					<button
						className="flex-1 rounded-full border border-white/40 bg-white/90 px-4 py-3 text-sm font-semibold text-primary_button transition hover:scale-[1.01]"
						onClick={handleClose}
						disabled={loading}>
						Cancel
					</button>
					<button
						className="flex-1 rounded-full bg-primary_button px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={handleSubmit}
						disabled={!name.trim() || !email.trim() || loading}>
						{loading ? "Adding..." : "Add Signer"}
					</button>
				</div>
			</div>
		</div>
	);
};

export { AddSignerModal };
