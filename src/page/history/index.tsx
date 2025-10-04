import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Axios } from "@/util/axiosInstance";
import { EmptyState } from "@/components/EmptyState";
import { GetCertificateResponse, GetAnchorResponse } from "@/types/response";

// ---- API types ----
type ApiParticipant = {
  id: string;
  certificate_id: string;
  is_revoked: boolean | "true" | "false" | 0 | 1;
  is_distributed?: boolean | "true" | "false" | 0 | 1;
  certificate_url?: string | null;
  created_at: string;
  updated_at: string;
  data: Record<string, string>;
};

type ApiResponse = {
  success: boolean;
  msg: string;
  data: ApiParticipant[];
};

type RecipientRow = {
  id: string;
  data: Record<string, string>;
  issueDate: string;
  certificateUrl?: string;
  status: "Valid" | "Revoked";
};

const ensureEmailColumn = (cols: string[]): string[] => {
  if (!cols.length) return ["email"];
  const filtered = cols
    .map((col) => (typeof col === "string" ? col.trim() : ""))
    .filter((col) => col.length > 0);
  if (!filtered.length) return ["email"];
  const normalized = filtered.map((col) => col.toLowerCase());
  let emailIndex = normalized.findIndex((col) => col === "email");
  if (emailIndex === -1) {
    emailIndex = normalized.findIndex((col) => col.includes("email"));
  }
  const reordered = [...filtered];
  if (emailIndex === -1) {
    reordered.push("email");
    return reordered;
  }
  if (emailIndex === reordered.length - 1) {
    return reordered;
  }
  const [emailCol] = reordered.splice(emailIndex, 1);
  reordered.push(emailCol);
  return reordered;
};

const toBool = (v: any) => v === true || v === "true" || v === 1 || v === "1";

function formatDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const datePart = d.toLocaleDateString("en-GB");
  const timePart = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${datePart} - ${timePart}`;
}

const HistoryPage = () => {
  const { certId } = useParams<{ certId: string }>();
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<RecipientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [revoking, setRevoking] = useState(false); // bulk revoke
  const [certificateName, setCertificateName] = useState<string>("");

  // fetch certificate metadata for header display
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!certId) return;
      try {
        const res = await Axios.get<GetCertificateResponse>(
          `/certificate/${certId}`
        );
        if (!ignore) setCertificateName(res.data?.data?.name ?? "");
      } catch {
        if (!ignore) setCertificateName("");
      }
    })();
    return () => {
      ignore = true;
    };
  }, [certId]);

  // ---- fetch distributed (exclude revoked) ----
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!certId) return;
      setLoading(true);
      setErr(null);
      setSelected(new Set());
      try {
        let anchorColumns: string[] = [];
        try {
          const anchorRes = await Axios.get<GetAnchorResponse>(
            `/certificate/anchor/${certId}`
          );
          if (anchorRes.status === 200) {
            const anchors = Array.isArray(anchorRes.data.data)
              ? anchorRes.data.data
              : [];
            anchorColumns = ensureEmailColumn(anchors as string[]);
          }
        } catch (anchorError) {
          console.error("Failed to fetch anchor columns:", anchorError);
        }

        if (!anchorColumns.length) {
          anchorColumns = ensureEmailColumn([]);
        }

        const res = await Axios.get<ApiResponse>(`/participant/${certId}`, {
          params: { status: "distributed" },
        });

        const participants = res.data?.data ?? [];

        const serverColumns = Array.from(
          new Set(
            participants.flatMap((participant) =>
              Object.keys(participant?.data ?? {})
            )
          )
        )
          .map((col) => (typeof col === "string" ? col.trim() : ""))
          .filter((col) => col.length > 0);

        let resolvedColumns = anchorColumns.length ? [...anchorColumns] : [];

        if (!anchorColumns.length) {
          if (serverColumns.length) {
            resolvedColumns = serverColumns;
          }
        }

        if (!resolvedColumns.length) {
          resolvedColumns = ensureEmailColumn([]);
        }

        const orderedColumns = ensureEmailColumn(resolvedColumns);

        const mapped: RecipientRow[] = participants.map((p) => {
          const rowData: Record<string, string> = {};
          orderedColumns.forEach((col) => {
            rowData[col] = p.data?.[col] ?? "";
          });
          const isRevoked = toBool(p.is_revoked);
          return {
            id: p.id,
            data: rowData,
            issueDate: formatDate(p.updated_at || p.created_at),
            certificateUrl: p.certificate_url ?? undefined,
            status: isRevoked ? "Revoked" : "Valid",
          };
        });

        if (!ignore) {
          setColumns(orderedColumns);
          setRows(mapped);
        }
      } catch (e: any) {
        if (!ignore) setErr(e?.response?.data?.msg || "Failed to load history");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [certId]);

  // ---- filtering ----
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        columns.some((col) => r.data[col]?.toLowerCase().includes(q)) ||
        r.issueDate.toLowerCase().includes(q)
    );
  }, [rows, query, columns]);

  const isSearching = query.trim().length > 0;
  const emptyDescription = isSearching
    ? "Try adjusting your search terms or clear the search box."
    : "Participants will appear here after certificates are distributed.";

  // ---- selection helpers (bulk) ----
  const toggleOne = (id: string) => {
    const target = rows.find((r) => r.id === id);
    if (!target || target.status === "Revoked") return;
    setSelected((prev) => {
      const next = new Set(prev);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectableRows = filtered.filter((r) => r.status !== "Revoked");
  const allIds = selectableRows.map((r) => r.id);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = allIds.some((id) => selected.has(id));
  const toggleAll = () => {
    setSelected((prev) => {
      if (allSelected) {
        const next = new Set(prev);
        allIds.forEach((id) => next.delete(id));
        return next;
      } else {
        const next = new Set(prev);
        allIds.forEach((id) => next.add(id));
        return next;
      }
    });
  };

  // ---- revoke SELECTED (bulk) ----
  const handleRevoke = async () => {
    if (selected.size === 0) return;
    const confirm = window.confirm(
      `Revoke ${selected.size} participant${
        selected.size > 1 ? "s" : ""
      }? This will invalidate their certificate link.`
    );
    if (!confirm) return;

    setRevoking(true);
    try {
      const ids = Array.from(selected);
      const results = await Promise.allSettled(
        ids.map((id) => Axios.put(`/participant/revoke/${id}`))
      );

      const okIds: string[] = [];
      const fails: string[] = [];
      results.forEach((r, i) => {
        if (r.status === "fulfilled") okIds.push(ids[i]);
        else fails.push(ids[i]);
      });

      if (okIds.length) {
        setRows((prev) =>
          prev.map((r) =>
            okIds.includes(r.id) ? { ...r, status: "Revoked" } : r
          )
        );
        setSelected((prev) => {
          const next = new Set(prev);
          okIds.forEach((id) => next.delete(id));
          return next;
        });
      }

      if (fails.length) {
        alert(`Some revokes failed (${fails.length}). Please try again.`);
      } else {
        alert(
          `Revoked ${okIds.length} participant${okIds.length > 1 ? "s" : ""}.`
        );
      }
    } finally {
      setRevoking(false);
    }
  };

  const handleExportCsv = () => {
    if (filtered.length === 0) {
      alert("No history records to export.");
      return;
    }

    const escapeCsvValue = (value: string): string => {
      const prepared = value?.toString() ?? "";
      return `"${prepared.replace(/"/g, '""')}"`;
    };

    const header = [...columns, "Issue Date & Time", "Status"];
    const csvLines = [header.map(escapeCsvValue).join(",")];

    filtered.forEach((row) => {
      const values = columns.map((col) => row.data[col] ?? "");
      values.push(row.issueDate);
      values.push(row.status);
      csvLines.push(values.map(escapeCsvValue).join(","));
    });

    const csvContent = csvLines.join("\r\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = (certificateName || certId || "history")
      .replace(/[^a-z0-9\-_/ ]/gi, "")
      .toLowerCase()
      .replace(/\s+/g, "-");
    const filename = safeName ? `history-${safeName}.csv` : "history.csv";
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col">
      <div className="font-noto bg-secondary_background rounded-[15px] flex flex-row justify-between items-center w-full h-full px-[20px]">
        <div className="px-[25px] py-[50px] flex justify-between w-full h-[140px] items-center">
          <div className="font-bold text-[25px] w-fit">
            Shared History - {certificateName || `Cert ID: ${certId}`}
          </div>
          <div className="w-[550px] flex justify-between ">
            <div className="flex flex-row items-center">
              <input
                className="text-noto text-[14px] border-1 rounded-[7px] px-[20px] py-[15px] w-[224px] h-[39px]"
                type="text"
                placeholder="Search recipients..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex justify-between items-center">
              <p className="ml-10 mr-10 font-bold text-[14px]">
                {selected.size} Selected
              </p>
              <button
                disabled={selected.size === 0 || revoking}
                onClick={handleRevoke}
                className={`text-noto font-bold text-[14px] rounded-[10px] h-[39px] px-6 flex items-center ${
                  selected.size === 0 || revoking
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-primary_button text-secondary_text hover:opacity-90"
                }`}
              >
                {revoking ? "Revoking..." : "Revoke Selected"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="font-noto bg-secondary_background min-h-[777px] rounded-[15px] flex-col justify-center w-full h-full px-[100px] mt-[25px] py-[48px]">
        {/* States */}
        {loading && <div className="px-2 py-4">Loading...</div>}
        {err && !loading && <div className="px-2 py-4 text-red-500">{err}</div>}
        {!loading && !err && filtered.length === 0 && (
          <EmptyState
            title="No participants found."
            description={emptyDescription}
          />
        )}

        {/* Table */}
        {!loading && !err && filtered.length > 0 && (
          <>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse border border-gray-300">
                <thead className="bg-[#f3f3f3]">
                  <tr>
                    <th className="w-[60px] text-gray-700 border border-gray-300 text-center">
                      <input
                        type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = !allSelected && someSelected;
                      }}
                      onChange={toggleAll}
                    />
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="p-3 text-center text-[14px] font-semibold text-gray-700 border border-gray-300"
                    >
                      {col}
                    </th>
                  ))}
                  <th className="p-3 text-center text-[14px] font-semibold text-gray-700 border border-gray-300 w-[150px]">
                    Issue Date & Time
                  </th>
                  <th className="p-3 text-center text-[14px] font-semibold text-gray-700 border border-gray-300 w-[120px]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const checked = selected.has(r.id);
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="p-4 text-gray-800 border border-gray-300 text-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(r.id)}
                          disabled={revoking || r.status === "Revoked"}
                        />
                      </td>
                      {columns.map((col) => (
                        <td
                          key={col}
                          className="p-3 text-sm text-gray-800 border border-gray-300"
                        >
                          {r.data[col] || ""}
                        </td>
                      ))}
                      <td className="p-3 text-sm text-gray-800 border border-gray-300 text-center">
                        {r.issueDate}
                      </td>
                      <td
                        className={`p-3 text-sm border border-gray-300 text-center font-semibold ${
                          r.status === "Revoked" ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {r.status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleExportCsv}
                className="rounded-md bg-primary_button px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Download CSV
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export { HistoryPage };
