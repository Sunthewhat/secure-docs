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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[400px] rounded-2xl bg-white p-8 shadow-lg">
        <p className="text-lg text-red-600 font-medium mb-2 text-center">
          Warning
          {/* {" "} */}
          {/* <span className="font-semibold text-red-600">{cert.name}</span>? */}
        </p>
        <p className="text-lg font-medium mb-6 text-center">

          You will not able to add column after this click 
          {/* {" "} */}
          {/* <span className="font-semibold text-red-600">{cert.name}</span>? */}
        </p>

        <div className="flex gap-3">
          <button
            className="flex-1 rounded-md bg-gray-200 py-2 text-gray-800"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex-1 rounded-md bg-primary_button py-2 text-white"
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
