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
  const certificateLabel =
    certificateName || (certId ? `Certificate ${certId}` : "Certificate");

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
    <div className="select-none cursor-default flex flex-col gap-12 text-white">
      <header className="rounded-[32px] border border-white/25 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm uppercase tracking-[0.35em] text-white/60">History</span>
          <h1 className="text-4xl font-semibold">Share history</h1>
          <p className="max-w-2xl text-base text-white/70">Review distributed certificates and manage revocations for {certificateLabel}.</p>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-white/70">
            Certificate: <span className="text-white">{certificateLabel}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              className="h-10 w-full max-w-xs rounded-full border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
              type="text"
              placeholder="Search recipients..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/70">{selected.size} selected</span>
              <button
                disabled={selected.size === 0 || revoking}
                onClick={handleRevoke}
                className={`inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-semibold transition ${
                  selected.size === 0 || revoking
                    ? 'bg-white/20 text-white/40 cursor-not-allowed'
                    : 'bg-primary_button text-white hover:scale-[1.01]'
                }`}
              >
                {revoking ? 'Revoking...' : 'Revoke selected'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="rounded-[32px] border border-white/25 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8 flex flex-col gap-6">
        {loading && <div className="text-sm text-white/70">Loading history...</div>}
        {err && !loading && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/20 px-5 py-4 text-sm text-red-100 shadow-lg">{err}</div>
        )}
        {!loading && !err && filtered.length === 0 && (
          <div className="rounded-3xl border border-white/20 bg-white/95 px-6 py-12 text-center text-primary_text shadow-xl">
            <EmptyState title="No participants found." description={emptyDescription} />
          </div>
        )}

        {!loading && !err && filtered.length > 0 && (
          <div className="rounded-3xl border border-white/20 bg-white/95 text-primary_text shadow-xl">
            <div className="max-h-[580px] overflow-auto">
              <table className="min-w-full table-fixed">
                <thead className="bg-transparent text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  <tr>
                    <th className="w-14 px-5 py-3 text-center">
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
                      <th key={col} className="px-5 py-3">
                        {col}
                      </th>
                    ))}
                    <th className="px-5 py-3">Issue date &amp; time</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {filtered.map((r) => {
                    const checked = selected.has(r.id);
                    return (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleOne(r.id)}
                            disabled={revoking || r.status === 'Revoked'}
                          />
                        </td>
                        {columns.map((col) => (
                          <td key={col} className="px-5 py-3">
                            {r.data[col] || ''}
                          </td>
                        ))}
                        <td className="px-5 py-3 text-center">{r.issueDate}</td>
                        <td
                          className={`px-5 py-3 text-center font-semibold ${
                            r.status === 'Revoked' ? 'text-red-600' : 'text-emerald-600'
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
            <div className="flex justify-end border-t border-gray-200 px-6 py-4">
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center justify-center rounded-full bg-primary_button px-6 py-2 text-sm font-semibold text-white transition hover:scale-[1.01]"
              >
                Download CSV
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );

};

export { HistoryPage };
