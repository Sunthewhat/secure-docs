import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useLocation } from "react-router-dom";
import type { Participant } from "@/types/response";
import { Axios } from "@/util/axiosInstance";

type RenderResponse = {
  success: boolean;
  msg: string;
  data: {
    message: string;
    results: Array<{
      filePath: string;
      participantId: string;
      status: "success" | "failed";
    }>;
    zipFilePath?: string;
  };
};

interface LocationState {
  participants?: Participant[];
  certId?: string;
}

const SaveSendPage = () => {
  const location = useLocation() as { state: LocationState | null };
  const navigate = useNavigate();

  const participants: Participant[] = location.state?.participants ?? [];
  const certId = location.state?.certId ?? participants[0]?.certificate_id;

  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // union of dynamic columns (match preview behavior)
  const columns = useMemo(() => {
    const set = new Set<string>();
    for (const p of participants)
      Object.keys(p.data ?? {}).forEach((k) => set.add(k));
    return Array.from(set);
  }, [participants]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const participantIds = useMemo(
    () =>
      participants.map((p) => p.id).filter((id): id is string => Boolean(id)), // keep only valid ids
    [participants]
  );

  const handleDownload = async () => {
    if (!certId) {
      setError("Missing certificate id.");
      return;
    }
    setError(null);
    setDownloading(true);
    try {
      // If backend needs a subset, send { participantIds: participants.map(p => p.id) }
      const res = await Axios.post<RenderResponse>(
        `/certificate/render/${certId}`,
        { participantIds }
      );
      if (!res.data?.success) throw new Error(res.data?.msg || "Render failed");

      const { zipFilePath, results } = res.data.data;
      const targetUrl = zipFilePath || results?.[0]?.filePath;
      if (!targetUrl) throw new Error("No file URL returned from renderer.");

      // Try blob download first; fallback to opening URL if CORS blocks it
      try {
        const r = await fetch(targetUrl, { credentials: "include" });
        if (!r.ok) throw new Error("Blob fetch failed");
        const blob = await r.blob();
        const filename = (
          targetUrl.split("/").pop() || "certificates.zip"
        ).split("?")[0];
        downloadBlob(blob, filename);
      } catch {
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      }
    } catch (e: any) {
      setError(e?.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="select-none cursor-default">
      <div className="font-noto bg-secondary_background rounded-[15px] flex flex-row items-center w-full h-[72px] px-[20px]">
        <button
          className="text-noto text-[14px] bg-white text-primary_text rounded-[7px] w-[120px] h-[39px] flex justify-center items-center underline"
          onClick={() => void navigate(-1)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Preview
        </button>

        <div className="absolute left-1/2 transform -translate-x-1/2">
          <p className="font-semibold text-[32px] w-fit">Download</p>
        </div>

        <div className="ml-auto">
          <button
            onClick={handleDownload}
            disabled={downloading || participants.length === 0}
            className={`text-noto text-[14px] bg-primary_button text-secondary_text rounded-[7px] w-[120px] h-[39px] flex justify-center items-center ${
              downloading || participants.length === 0
                ? "opacity-60 cursor-not-allowed"
                : ""
            }`}
          >
            {downloading ? "Rendering…" : "Download"}
          </button>
        </div>
      </div>

      <div className="font-noto bg-secondary_background min-h-[777px] rounded-[15px] flex justify-start w-full h-full px-[40px] mt-[25px] py-[48px]">
        <div className="flex flex-col w-full h-full px-[20px]">
          {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}

          <div className="overflow-y-scroll max-h-[600px]">
            <table className="w-full border border-gray-200 text-center text-sm table-auto">
              <thead>
                <tr className="bg-gray-100">
                  {columns.length > 0 ? (
                    columns.map((col, idx) => (
                      <th
                        key={col}
                        className={`font-normal px-6 py-2 ${
                          idx < columns.length - 1
                            ? "border-r border-gray-200"
                            : ""
                        }`}
                      >
                        {col}
                      </th>
                    ))
                  ) : (
                    <th className="font-normal px-6 py-2">No columns</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {participants.length > 0 ? (
                  participants.map((p) => (
                    <tr key={p.id} className="border border-gray-200">
                      {columns.map((col, idx) => (
                        <td
                          key={col}
                          className={`px-6 py-2 break-words ${
                            idx < columns.length - 1
                              ? "border-r border-gray-200"
                              : ""
                          }`}
                        >
                          {p.data?.[col] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={Math.max(columns.length, 1)}
                      className="px-6 py-8 text-gray-500"
                    >
                      No participants found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export { SaveSendPage };
