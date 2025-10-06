import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useLocation } from "react-router-dom";
import type {
  GetCertificateResponse,
  GetParticipantResponse,
  Participant,
} from "@/types/response";
import { Axios } from "@/util/axiosInstance";
import { useToast } from "@/components/toast/ToastContext";

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
  const toast = useToast();
  const locationState = useMemo(
    () => (location.state as LocationState | null) ?? null,
    [location.state]
  );

  // UI states
  const [rendering, setRendering] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [certId, setCertId] = useState<string>("");
  const [mailStatusMap, setMailStatusMap] = useState<
    Record<string, "success" | "failed">
  >({});

  useEffect(() => {
    if (!locationState) return;

    if (Array.isArray(locationState.participants)) {
      setParticipants(locationState.participants);
    }

    if (locationState.certId) {
      setCertId(locationState.certId);
    }
  }, [locationState]);

  useEffect(() => {
    if (certId || participants.length === 0) return;
    const withCertId = participants.find(
      (participant) => participant.certificate_id
    );
    if (withCertId?.certificate_id) {
      setCertId(withCertId.certificate_id);
    }
  }, [certId, participants]);

  useEffect(() => {
    if (participants.length > 0) return;
    if (locationState?.participants?.length) return;
    if (!certId) return;

    let ignore = false;

    const fetchParticipants = async () => {
      try {
        const response = await Axios.get<GetParticipantResponse>(
          `/participant/${certId}`
        );
        if (response.status === 200 && Array.isArray(response.data?.data)) {
          if (!ignore) {
            setParticipants(response.data.data);
          }
        }
      } catch {
        if (!ignore) {
          toast.error("Failed to load participants.");
        }
      }
    };

    void fetchParticipants();

    return () => {
      ignore = true;
    };
  }, [certId, locationState, participants.length, toast]);

  useEffect(() => {
    if (!certId) return;
    const missingIds = participants.some((participant) => !participant.id);
    if (!missingIds) return;

    let ignore = false;

    const hydrateParticipants = async () => {
      try {
        const response = await Axios.get<GetParticipantResponse>(
          `/participant/${certId}`
        );
        if (response.status === 200 && Array.isArray(response.data?.data)) {
          if (!ignore) {
            setParticipants(response.data.data);
          }
        }
      } catch {
        if (!ignore) {
          toast.error("Failed to sync participants with the server.");
        }
      }
    };

    void hydrateParticipants();

    return () => {
      ignore = true;
    };
  }, [certId, participants, toast]);

  useEffect(() => {
    setMailStatusMap((prev) => {
      if (participants.length === 0) return {};
      const next: Record<string, "success" | "failed"> = {};
      for (const participant of participants) {
        const id = participant.id;
        if (id && prev[id]) {
          next[id] = prev[id];
        }
      }
      return next;
    });
  }, [participants]);

  // store render payload after "Generate"
  const [renderData, setRenderData] = useState<RenderResponse["data"] | null>(
    null
  );

  // union of dynamic columns
  const columns = useMemo(() => {
    const set = new Set<string>();
    for (const p of participants)
      Object.keys(p.data ?? {}).forEach((k) => set.add(k));
    return Array.from(set);
  }, [participants]);

  // detect the "email" column (case-insensitive)
  const emailColumn = useMemo(
    () => columns.find((c) => c.toLowerCase().includes("email")) || null,
    [columns]
  );

  const participantIds = useMemo(
    () =>
      participants.map((p) => p.id).filter((id): id is string => Boolean(id)),
    [participants]
  );

  const renderStatusMap = useMemo(() => {
    const map = new Map<string, "success" | "failed">();
    renderData?.results?.forEach((result) => {
      if (result.participantId) {
        map.set(result.participantId, result.status);
      }
    });
    return map;
  }, [renderData]);

  // 1) GENERATE (render only)
  const handleGenerate = async () => {
    if (!certId) {
      setError("Missing certificate id.");
      return;
    }
    setError(null);
    setNotice(null);
    setRendering(true);
    try {
      const res = await Axios.post<RenderResponse>(
        `/certificate/render/${certId}`,
        {
          participantIds,
        }
      );
      if (!res.data?.success) throw new Error(res.data?.msg || "Render failed");
      setRenderData(res.data.data);
      toast.success("Render completed.");
    } catch (e) {
      setError((e as Error).message || "Render failed");
      setRenderData(null);
    } finally {
      setRendering(false);
    }
  };

  // 2) DOWNLOAD (first mark as distributed, then download)
  const handleDownload = async () => {
    if (!renderData) return;
    if (participantIds.length === 0) {
      setError("No participant IDs found.");
      return;
    }

    setError(null);
    setNotice(null);
    setDownloading(true);
    try {
      // A) mark as distributed
      try {
        const dist = await Axios.put(`/participant/distribute`, {
          participantIds,
        });
        if (!dist.data?.success) {
          setNotice(
            dist.data?.msg || "Distribution status could not be updated."
          );
        } else {
          const d = dist.data?.data;
          if (d?.failed_count > 0) {
            setNotice(
              `Marked as distributed: ${d?.success_count ?? 0}/${
                d?.total_participants ?? participantIds.length
              }.`
            );
          } else {
            setNotice("Participants marked as distributed.");
          }
        }
      } catch {
        setNotice(
          "Could not update distribution status, continuing to download…"
        );
      }

      // B) download rendered file(s)
      const { zipFilePath, results } = renderData;
      const targetUrl = zipFilePath || results?.[0]?.filePath;
      if (!targetUrl) throw new Error("No file URL returned from renderer.");

      try {
        const certData = await Axios.get<GetCertificateResponse>(
          `/certificate/${certId}`
        );
        const zipfileUrl = certData.data.data.archive_url;
        window.open(zipfileUrl, "_blank", "noopener,noreferrer");
      } catch {
        // CORS fallback
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      setError((e as Error).message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  // 3) SEND EMAILS (GET /certificate/mail/:certId?email=<columnName>)
  const handleSend = async () => {
    if (!certId) {
      setError("Missing certificate id.");
      return;
    }
    if (!emailColumn) {
      setError(
        'Email column not found. Please ensure a column named "email" exists.'
      );
      return;
    }

    setError(null);
    setNotice(null);
    setSending(true);
    try {
      const res = await Axios.get(`/certificate/mail/${certId}`, {
        params: { email: emailColumn }, // the column name to use
      });

      if (!res.data?.success) {
        throw new Error(res.data?.msg || "Mail distribution failed");
      }

      const data = res.data?.data;
      const results = Array.isArray(data?.results) ? data.results : [];

      if (results.length > 0) {
        setMailStatusMap((prev) => {
          const next = { ...prev };
          for (const item of results) {
            const participantId =
              typeof item?.participantId === "string"
                ? item.participantId
                : typeof item?.participant_id === "string"
                ? item.participant_id
                : undefined;

            const rawStatus =
              typeof item?.status === "string"
                ? item.status.toLowerCase()
                : undefined;

            if (
              participantId &&
              (rawStatus === "success" || rawStatus === "failed")
            ) {
              next[participantId] = rawStatus;
            }
          }
          return next;
        });
      } else if (
        typeof data?.success_count === "number" &&
        typeof data?.failed_count === "number"
      ) {
        if (data.failed_count === 0 && data.success_count > 0) {
          setMailStatusMap((prev) => {
            const next = { ...prev };
            for (const participant of participants) {
              if (participant.id) next[participant.id] = "success";
            }
            return next;
          });
        } else if (data.success_count === 0 && data.failed_count > 0) {
          setMailStatusMap((prev) => {
            const next = { ...prev };
            for (const participant of participants) {
              if (participant.id) next[participant.id] = "failed";
            }
            return next;
          });
        }
      }
    } catch (e) {
      setError((e as Error).message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="select-none cursor-default flex flex-col gap-12 text-white">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => void navigate(-1)}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
              Preview
            </button>
            <span className="text-sm uppercase tracking-[0.35em] text-white/60">
              Collection
            </span>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold">Distribute certificates</h1>
            <p className="max-w-2xl text-base text-white/70">
              Generate participant files or deliver them directly through email.
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold shadow-lg ${
            renderData
              ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-100'
              : 'border-white/20 bg-white/10 text-white/70'
          }`}
        >
          <span className="inline-flex h-2 w-2 rounded-full bg-current" />
          {renderData ? 'Render complete' : 'Awaiting render'}
        </span>
      </header>

      <section className="rounded-[32px] border border-white/25 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:p-10">
        <div className="flex flex-col gap-8">
          {error ? (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/20 px-5 py-4 text-sm text-red-100 shadow-lg">
              {error}
            </div>
          ) : notice ? (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/20 px-5 py-4 text-sm text-emerald-100 shadow-lg">
              {notice}
            </div>
          ) : null}

          <div className="rounded-3xl border border-white/20 bg-white/95 text-primary_text shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <h2 className="text-lg font-semibold text-primary_text">Recipients</h2>
              <span className="text-sm text-gray-500">{participants.length} total</span>
            </div>
            <div className="max-h-[520px] overflow-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  <tr>
                    {columns.length > 0 ? (
                      columns.map((col) => (
                        <th key={col} className="px-5 py-3">
                          {col}
                        </th>
                      ))
                    ) : (
                      <th className="px-5 py-3">No columns</th>
                    )}
                    <th className="px-5 py-3 text-right">Email status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {participants.length > 0 ? (
                    participants.map((participant, index) => {
                      const mailStatus = participant.id ? mailStatusMap[participant.id] : undefined;
                      const renderStatus = participant.id
                        ? renderStatusMap.get(participant.id)
                        : undefined;
                      const status = mailStatus ?? renderStatus;

                      return (
                        <tr
                          key={participant.id ?? `participant-${index}`}
                          className="transition hover:bg-primary_button/5"
                        >
                          {columns.map((col) => (
                            <td key={col} className="px-5 py-3 text-left">
                              {participant.data?.[col] ?? ''}
                            </td>
                          ))}
                          <td className="px-5 py-3 text-right">
                            {status === 'success' ? (
                              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-600">
                                <svg
                                  className="h-4 w-4"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm-1 15-4-4 1.414-1.414L11 13.172l5.586-5.586L18 9Z" />
                                </svg>
                                Delivered
                              </span>
                            ) : status === 'failed' ? (
                              <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-600">
                                <svg
                                  className="h-4 w-4"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm3.707 12.293-1.414 1.414L12 13.414l-2.293 2.293-1.414-1.414L10.586 12 8.293 9.707l1.414-1.414L12 10.586l2.293-2.293 1.414 1.414L13.414 12Z" />
                                </svg>
                                Failed
                              </span>
                            ) : (
                              <span className="text-gray-400">Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={Math.max(columns.length, 1) + 1}
                        className="px-6 py-10 text-center text-gray-500"
                      >
                        No participants found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 pt-2">
            {!renderData ? (
              <button
                onClick={handleGenerate}
                disabled={rendering || participants.length === 0}
                className={`inline-flex items-center justify-center rounded-full bg-primary_button px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01] ${
                  rendering || participants.length === 0
                    ? 'cursor-not-allowed opacity-60'
                    : ''
                }`}
              >
                {rendering ? 'Rendering…' : 'Generate'}
              </button>
            ) : (
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className={`inline-flex items-center justify-center rounded-full bg-primary_button px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01] ${
                    downloading ? 'cursor-not-allowed opacity-60' : ''
                  }`}
                >
                  {downloading ? 'Preparing…' : 'Download'}
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className={`inline-flex items-center justify-center rounded-full border border-white/40 bg-white/90 px-6 py-3 text-sm font-semibold text-primary_button shadow-lg transition hover:scale-[1.01] ${
                    sending ? 'cursor-not-allowed opacity-60' : ''
                  }`}
                >
                  {sending ? 'Sending…' : 'Send to participant email'}
                </button>
              </div>
            )}
            <p className="text-center text-xs uppercase tracking-[0.25em] text-white/50">
              {renderData ? 'Ready to distribute' : 'Generate certificates before sharing'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export { SaveSendPage };
