import { FC } from "react";

type ColumnMappingModalProps = {
  open: boolean;
  anchors: string[];
  headers: string[];
  mapping: Record<string, string>;
  filename?: string;
  sampleRow?: string[];
  onChange: (anchor: string, header: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  confirmLoading?: boolean;
};

const ColumnMappingModal: FC<ColumnMappingModalProps> = ({
  open,
  anchors,
  headers,
  mapping,
  filename,
  sampleRow,
  onChange,
  onClose,
  onConfirm,
  confirmLoading = false,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[520px] max-w-[92vw] rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-4">
          <p className="text-lg font-semibold">Map CSV Columns</p>
          {filename ? (
            <p className="text-sm text-gray-600">{filename}</p>
          ) : null}
        </div>

        <div className="max-h-[340px] space-y-4 overflow-y-auto pr-1">
          {anchors.map((anchor) => (
            <div key={anchor} className="space-y-2">
              <p className="text-sm font-medium text-gray-700">{anchor}</p>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={mapping[anchor] ?? ""}
                onChange={(event) => onChange(anchor, event.target.value)}
              >
                <option value="">Select column</option>
                {headers.map((header, index) => {
                  const preview = sampleRow?.[index];
                  const suffix = preview ? ` - e.g. ${preview}` : "";
                  return (
                    <option key={`${header || "column"}-${index}`} value={header}>
                      {header || `Column ${index + 1}`}
                      {suffix}
                    </option>
                  );
                })}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          <button
            className="flex-1 rounded-md bg-gray-200 py-2 text-gray-800"
            onClick={onClose}
            disabled={confirmLoading}
          >
            Cancel
          </button>
          <button
            className="flex-1 rounded-md bg-primary_button py-2 text-white"
            onClick={onConfirm}
            disabled={confirmLoading}
          >
            {confirmLoading ? "Importing..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export { ColumnMappingModal };
