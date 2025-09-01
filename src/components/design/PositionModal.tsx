import React from "react";

interface PositionModalProps {
	visible: boolean;
	onClose: () => void;
	onBringForward: () => void;
	onSendBackward: () => void;
	onBringToFront: () => void;
	onSendToBack: () => void;
	buttonRef: React.RefObject<HTMLButtonElement | null>;
}

const PositionModal: React.FC<PositionModalProps> = ({
	visible,
	onClose,
	onBringForward,
	onSendBackward,
	onBringToFront,
	onSendToBack,
	buttonRef,
}) => {
	if (!visible) return null;

	// Calculate position relative to button
	const buttonElement = buttonRef.current;
	if (!buttonElement) return null;

	const buttonRect = buttonElement.getBoundingClientRect();

	return (
		<>
			{/* Invisible overlay to close dropdown when clicking outside */}
			<div className="fixed inset-0 z-40" onClick={onClose} />

			{/* Dropdown positioned below button */}
			<div
				className="fixed bg-white shadow-lg border border-gray-200 rounded-lg py-2 z-50 w-56"
				style={{
					left: buttonRect.left,
					top: buttonRect.bottom + 4,
				}}>
				<button
					className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 hover:text-gray-800 active:bg-gray-100 transition-all duration-150"
					onClick={() => {
						onBringToFront();
						onClose();
					}}>
					<div className="font-medium text-gray-900 text-sm">
						Bring to Front
					</div>
					<div className="text-xs text-gray-500">
						Move to top layer
					</div>
				</button>

				<button
					className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 hover:text-gray-800 active:bg-gray-100 transition-all duration-150"
					onClick={() => {
						onBringForward();
						onClose();
					}}>
					<div className="font-medium text-gray-900 text-sm">
						Bring Forward
					</div>
					<div className="text-xs text-gray-500">
						Move up one layer
					</div>
				</button>

				<button
					className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 hover:text-gray-800 active:bg-gray-100 transition-all duration-150"
					onClick={() => {
						onSendBackward();
						onClose();
					}}>
					<div className="font-medium text-gray-900 text-sm">
						Send Backward
					</div>
					<div className="text-xs text-gray-500">
						Move down one layer
					</div>
				</button>

				<button
					className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 hover:text-gray-800 active:bg-gray-100 transition-all duration-150"
					onClick={() => {
						onSendToBack();
						onClose();
					}}>
					<div className="font-medium text-gray-900 text-sm">
						Send to Back
					</div>
					<div className="text-xs text-gray-500">
						Move to bottom layer
					</div>
				</button>
			</div>
		</>
	);
};

export default PositionModal;
