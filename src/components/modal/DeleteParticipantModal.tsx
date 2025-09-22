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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[400px] rounded-2xl bg-white p-8 shadow-lg">
        <p className="mb-6 text-center text-lg font-medium">
          Are you sure you want to delete {targetLabel}?
        </p>

        <div className="flex gap-3">
          <button
            className="flex-1 rounded-md bg-gray-200 py-2 text-gray-800"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="flex-1 rounded-md bg-red-600 py-2 text-white disabled:opacity-70"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export { DeleteParticipantModal };
