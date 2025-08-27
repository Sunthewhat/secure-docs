import React from "react"
import { CertType } from "@/types/response"

interface DeleteModalProps {
  open: boolean
  cert: CertType | null
  onClose: () => void
  onConfirm: (certId: string) => void
}

const DeleteModal: React.FC<DeleteModalProps> = ({ open, cert, onClose, onConfirm }) => {
  if (!open || !cert) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[400px] rounded-2xl bg-white p-8 shadow-lg">
        <p className="text-lg font-medium mb-6 text-center">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-red-600">{cert.name}</span>?
        </p>

        <div className="flex gap-3">
          <button
            className="flex-1 rounded-md bg-gray-200 py-2 text-gray-800"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex-1 rounded-md bg-red-600 py-2 text-white"
            onClick={() => onConfirm(cert.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteModal
