import React from "react"
import { CertType } from "@/types/response"

interface WarningModalProps {
  open: boolean
  cert: CertType | null
  onClose: () => void
  onConfirm: (certId: string) => void
}

const WarningModal: React.FC<WarningModalProps> = ({ open, cert, onClose, onConfirm }) => {
  if (!open || !cert) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-[420px] rounded-[28px] border border-white/25 bg-white/95 p-8 text-primary_text shadow-2xl sm:p-10">
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-semibold text-red-600">Warning</h2>
          <p className="text-sm text-gray-600">You will not be able to add columns after this step. Make sure your anchor list is complete before continuing.</p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            className="flex-1 rounded-full border border-white/40 bg-white/90 px-4 py-3 text-sm font-semibold text-primary_button transition hover:scale-[1.01]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex-1 rounded-full bg-primary_button px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01]"
            onClick={() => onConfirm(cert.id)}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

export default WarningModal
