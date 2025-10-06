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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-[560px] rounded-[28px] border border-white/25 bg-white/95 p-8 text-primary_text shadow-2xl sm:p-10">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Map CSV columns</h2>
          {filename ? (
            <p className="text-sm text-gray-600">{filename}</p>
          ) : null}
          <p className="text-sm text-gray-500">Match each anchor with the appropriate column from your CSV before importing recipients.</p>
        </div>

        <div className="mt-6 max-h-[360px] space-y-4 overflow-y-auto pr-1">
          {anchors.map((anchor) => (
            <div key={anchor} className="rounded-2xl border border-white/40 bg-white/80 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{anchor}</p>
              <select
                className="mt-2 w-full rounded-full border border-primary_button/20 bg-white px-4 py-2 text-sm text-primary_text focus:border-primary_button focus:outline-none"
                value={mapping[anchor] ?? ""}
                onChange={(event) => onChange(anchor, event.target.value)}
              >
                <option value="">Select column</option>
                {headers.map((header, index) => {
                  const preview = sampleRow?.[index];
                  const suffix = preview ? ` - e.g. ${preview}` : "";
                  const label = header && header.length ? header : `Column ${index + 1}`;
                  return (
                    <option key={`${header || 'column'}-${index}`} value={header}>
                      {`${label}${suffix}`}
                    </option>
                  );
                })}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            className="flex-1 rounded-full border border-white/40 bg-white/90 px-4 py-3 text-sm font-semibold text-primary_button transition hover:scale-[1.01]"
            onClick={onClose}
            disabled={confirmLoading}
          >
            Cancel
          </button>
          <button
            className="flex-1 rounded-full bg-primary_button px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01]"
            onClick={onConfirm}
            disabled={confirmLoading}
          >
            {confirmLoading ? 'Importing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export { ColumnMappingModal };
