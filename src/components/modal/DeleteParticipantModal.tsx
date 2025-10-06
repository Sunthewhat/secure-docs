import { FC } from "react";

type DeleteParticipantModalProps = {
  open: boolean;
  participantName?: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

const DeleteParticipantModal: FC<DeleteParticipantModalProps> = ({
  open,
  participantName,
  onClose,
  onConfirm,
  loading = false,
}) => {
  if (!open) return null;

  const targetLabel = participantName?.trim()
    ? `"${participantName}"`
    : "this participant";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-[420px] rounded-[28px] border border-white/25 bg-white/95 p-8 text-primary_text shadow-2xl sm:p-10">
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-semibold text-red-600">Delete participant</h2>
          <p className="text-sm text-gray-600">Are you sure you want to delete {targetLabel}? This action cannot be undone.</p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            className="flex-1 rounded-full border border-white/40 bg-white/90 px-4 py-3 text-sm font-semibold text-primary_button transition hover:scale-[1.01]"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="flex-1 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01] disabled:opacity-70"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export { DeleteParticipantModal };
