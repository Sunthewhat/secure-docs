import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Axios } from "@/util/axiosInstance";
import { GetCertificateResponse } from "@/types/response";

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

type Recipient = {
  id: string;
  name: string;
  email: string;
  issueDate: string;
  certificateUrl?: string;
};

const toBool = (v: any) => v === true || v === "true" || v === 1 || v === "1";

function formatDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-GB");
}

const HistoryPage = () => {
  const { certId } = useParams<{ certId: string }>();
  const [rows, setRows] = useState<Recipient[]>([]);
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
        const res = await Axios.get<ApiResponse>(`/participant/${certId}`, {
          params: { status: "distributed" },
        });

        // ⬇️ Only keep NOT revoked
        const participants = (res.data?.data ?? []).filter(
          (p) => !toBool(p.is_revoked)
        );

        const mapped: Recipient[] = participants.map((p) => ({
          id: p.id,
          name:
            p.data?.name && p.data?.surname
              ? `${p.data.name} ${p.data.surname}`
              : p.data?.name || p.data?.fullname || "-",
          email: p.data?.email ?? "-",
          issueDate: formatDate(p.updated_at || p.created_at),
          certificateUrl: p.certificate_url ?? undefined,
        }));
        if (!ignore) setRows(mapped);
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
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.issueDate.toLowerCase().includes(q)
    );
  }, [rows, query]);

  // ---- selection helpers (bulk) ----
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allIds = filtered.map((r) => r.id);
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
        setRows((prev) => prev.filter((r) => !okIds.includes(r.id)));
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

  return (
    <div className="flex flex-col">
      <div className="font-noto bg-secondary_background rounded-[15px] flex flex-row justify-between items-center w-full h-full px-[20px]">
        <div className="px-[25px] py-[50px] flex justify-between w-full h-fit">
          <div className="font-bold text-[25px] w-fit">
            Shared History - {certificateName || `Cert ID: ${certId}`}
          </div>
          <div className="w-[360px] flex-col">
            <div className="flex flex-row items-center">
              <input
                className="text-noto text-[14px] border-1 rounded-[7px] px-[20px] py-[15px] w-full h-[39px] mb-4"
                type="text"
                placeholder="Search recipients..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex justify-between items-center">
              <p className="ml-10 font-bold text-[14px]">
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
          <div className="px-2 py-4">No distributed participants found.</div>
        )}

        {/* Table */}
        {!loading && !err && filtered.length > 0 && (
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
                  <th className="p-3 text-center text-[14px] font-semibold text-gray-700 border border-gray-300">
                    Recipient Name
                  </th>
                  <th className="p-3 text-center text-[14px] font-semibold text-gray-700 border border-gray-300">
                    Recipient Email
                  </th>
                  <th className="p-3 text-center text-[14px] font-semibold text-gray-700 border border-gray-300 w-[120px]">
                    Issue Date
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
                          disabled={revoking}
                        />
                      </td>
                      <td className="p-3 text-sm text-gray-800 border border-gray-300">
                        {r.name}
                      </td>
                      <td className="p-3 text-sm text-gray-800 border border-gray-300">
                        {r.email}
                      </td>
                      <td className="p-3 text-sm text-gray-800 border border-gray-300 text-center">
                        {r.issueDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export { HistoryPage };
