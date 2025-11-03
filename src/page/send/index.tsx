import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type {
  CertificateStatusResponse,
  GetCertificateResponse,
  GetParticipantResponse,
  Participant,
  RenderCertificateResponse,
  GetSignerStatusResponse,
  SignerStatus,
} from "@/types/response";
import { Axios } from "@/util/axiosInstance";
import { useToast } from "@/components/toast/ToastContext";

type DownloadStatus = "pending" | "downloaded" | "failed";
type EmailStatus = "pending" | "success" | "failed";

const SaveSendPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
	const { certId } = useParams<{ certId: string }>();

  // UI states
  const [rendering, setRendering] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [signers, setSigners] = useState<SignerStatus[]>([]);
  const [requestingSignerId, setRequestingSignerId] = useState<string | null>(null);
  const [generateStatus, setGenerateStatus] = useState<CertificateStatusResponse["data"] | null>(
    null
  );
  const [mailStatusMap, setMailStatusMap] = useState<
    Record<string, "success" | "failed">
  >({});
  const [downloadedMap, setDownloadedMap] = useState<Record<string, boolean>>({});
  const initialColumnsRef = useRef<string[] | null>(null);
  const [sendingParticipantId, setSendingParticipantId] = useState<string | null>(
    null
  );

  const sanitizeColumns = useCallback((cols?: string[]): string[] => {
    if (!Array.isArray(cols)) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const col of cols) {
      if (typeof col !== "string") continue;
      const trimmed = col.trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      result.push(trimmed);
    }
    return result;
  }, []);
  const markParticipantsAsDownloaded = useCallback((ids: string[]) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    setDownloadedMap((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        next[id] = true;
      }
      return next;
    });
    setParticipants((prev) =>
      prev.map((participant) =>
        idSet.has(participant.id)
          ? { ...participant, is_downloaded: true }
          : participant
      )
    );
  }, []);

  const fetchParticipants = useCallback(
    async ({ silent }: { silent?: boolean } = {}) => {
      if (!certId) return;

      try {
        const response = await Axios.get<GetParticipantResponse>(
          `/participant/${certId}`
        );
        if (response.status === 200 && Array.isArray(response.data?.data)) {
          setParticipants(response.data.data);
        }
      } catch {
        if (!silent) {
          toast.error("Failed to load participants.");
        }
      }
    },
    [certId, toast]
  );

  const fetchGenerateStatus = useCallback(async () => {
    if (!certId) return;

    try {
      const response = await Axios.get<CertificateStatusResponse>(
        `/certificate/generate/status/${certId}`
      );
      if (response.status === 200 && response.data?.data) {
        setGenerateStatus(response.data.data);
      }
    } catch {
      // ignore status errors; buttons will fallback to render state
    }
  }, [certId]);

  const fetchSignerStatus = useCallback(async () => {
    if (!certId) return;
    try {
      const res = await Axios.get<GetSignerStatusResponse>(`/signer/status/${certId}`);
      if (res.status === 200 && Array.isArray(res.data?.data)) {
        setSigners(res.data.data);
      }
    } catch {
      // ignore for now; table will show empty
    }
  }, [certId]);

  const handleRequestSigner = useCallback(async (signerId: string) => {
    try {
      setRequestingSignerId(signerId);
      const res = await Axios.get(`/signature/resign/${signerId}`);
      if (res.status === 200 && res.data?.success) {
        toast.success(res.data?.msg || 'Request sent');
      } else {
        throw new Error(res.data?.msg || 'Failed to send request');
      }
    } catch (e) {
      toast.error((e as Error).message || 'Failed to send request');
    } finally {
      await fetchSignerStatus();
      setRequestingSignerId(null);
    }
  }, [fetchSignerStatus, toast]);

  useEffect(() => {
    if (!certId) return;

    void fetchParticipants();
    void fetchGenerateStatus();
    void fetchSignerStatus();
  }, [certId, fetchGenerateStatus, fetchParticipants, fetchSignerStatus]);

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

  useEffect(() => {
    setDownloadedMap((prev) => {
      if (participants.length === 0) return {};
      const next: Record<string, boolean> = {};
      for (const participant of participants) {
        const id = participant.id;
        if (!id) continue;
        if (prev[id] || participant.is_downloaded) {
          next[id] = true;
        }
      }
      return next;
    });
  }, [participants, sanitizeColumns]);

  // store render payload after "Generate"
  const [renderData, setRenderData] = useState<RenderCertificateResponse["data"] | null>(
    null
  );

  // align dynamic columns without reordering the initial structure
  useEffect(() => {
    if (participants.length === 0) {
      if (!initialColumnsRef.current?.length) {
        setColumns([]);
      }
      return;
    }

    setColumns((prev) => {
      const base =
        initialColumnsRef.current && initialColumnsRef.current.length
          ? [...initialColumnsRef.current]
          : prev.length
          ? [...prev]
          : sanitizeColumns(
              Array.from(
                new Set(
                  participants.flatMap((participant) =>
                    Object.keys(participant.data ?? {})
                  )
                )
              )
            );

      const seen = new Set(base);
      let updated = false;

      for (const participant of participants) {
        const keys = Object.keys(participant.data ?? {});
        for (const key of keys) {
          if (!seen.has(key)) {
            const trimmed = typeof key === "string" ? key.trim() : "";
            if (!trimmed || seen.has(trimmed)) continue;
            base.push(trimmed);
            seen.add(trimmed);
            updated = true;
          }
        }
      }

      if (!initialColumnsRef.current?.length) {
        initialColumnsRef.current = [...base];
      } else if (updated) {
        initialColumnsRef.current = [...base];
      }

      const sameLength = prev.length === base.length;
      const sameOrder =
        sameLength && prev.every((col, idx) => col === base[idx]);

      return sameOrder ? prev : base;
    });
  }, [participants, sanitizeColumns]);

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

  const nonRevokedParticipantIds = useMemo(
    () =>
      participants
        .filter((participant) => !participant.is_revoked)
        .map((participant) => participant.id)
        .filter((id): id is string => Boolean(id)),
    [participants]
  );

  const incomingParticipants = useMemo(
    () => participants.filter((participant) => !participant.certificate_url),
    [participants]
  );

  const incomingActiveParticipants = useMemo(
    () => incomingParticipants.filter((participant) => !participant.is_revoked),
    [incomingParticipants]
  );

  const incomingActiveParticipantIds = useMemo(
    () =>
      incomingActiveParticipants
        .map((participant) => participant.id)
        .filter((id): id is string => Boolean(id)),
    [incomingActiveParticipants]
  );

  const hasIncomingActive = incomingActiveParticipantIds.length > 0;
  const renderStatusMap = useMemo(() => {
    const map = new Map<string, "success" | "failed">();
    renderData?.results?.forEach((result) => {
      if (result.participantId) {
        map.set(result.participantId, result.status);
      }
    });
    return map;
  }, [renderData]);

  const determineDownloadStatus = (
    participant: Participant,
    renderStatus?: "success" | "failed"
  ): DownloadStatus => {
    if (renderStatus === "failed") {
      return "failed";
    }

    if (!participant.certificate_url) {
      return "pending";
    }

    if (participant.is_downloaded) {
      return "downloaded";
    }

    if (participant.id && downloadedMap[participant.id]) {
      return "downloaded";
    }

    return "pending";
  };

  const determineEmailStatus = (
    participant: Participant,
    mailStatus?: "success" | "failed"
  ): EmailStatus => {
    if (mailStatus) return mailStatus;

    const emailStatus = participant.email_status;
    if (emailStatus === "success" || emailStatus === "failed") {
      return emailStatus;
    }

    return "pending";
  };

  const hasSigned = generateStatus?.is_signed ?? false;
  const hasGenerated = generateStatus?.is_generated ?? false;
  const canDistribute =
    (!hasGenerated && Boolean(renderData)) || (hasGenerated && !hasIncomingActive);
  const generateButtonLabel = !hasSigned
    ? "Certificate not signed"
      : hasGenerated
      ? "Generate new incoming"
      : "Generate";

  const runGenerate = async (
    targetIds: string[],
    emptyMessage: string
  ): Promise<void> => {
    if (!certId) {
      setError("Missing certificate id.");
      return;
    }

    setError(null);
    setNotice(null);
    setRendering(true);

    if (targetIds.length === 0) {
      setError(emptyMessage);
      setRendering(false);
      return;
    }

    try {
      const res = await Axios.post<RenderCertificateResponse>(
        `/certificate/render/${certId}`,
        {
          participantIds: targetIds,
        }
      );
      if (!res.data?.success) throw new Error(res.data?.msg || "Render failed");
      setRenderData(res.data.data);
      toast.success("Render completed.");
      await fetchGenerateStatus();
      await fetchParticipants({ silent: true });
    } catch (e) {
      setError((e as Error).message || "Render failed");
      setRenderData(null);
    } finally {
      setRendering(false);
    }
  };

  // 1) GENERATE (render only)
  const handleGenerate = () => {
    const targetParticipantIds = !hasSigned ? [] : hasGenerated
      ? incomingActiveParticipantIds
      : participantIds;

    const emptyMessage = !hasSigned ? "Certificate is not signed by all signer yet" : hasGenerated
      ? "No incoming participants available to generate."
      : "No participant IDs found.";    

    void runGenerate(targetParticipantIds, emptyMessage);
  };

  // Re-generate everything (regardless of existing renders)
  const handleRegenerateAll = () => {
    const ids = participantIds;
    const emptyMessage = 'No participant IDs found.';
    void runGenerate(ids, emptyMessage);
  };

  const handleGenerateExcludingRevoked = () => {
    const emptyMessage =
      "No participant IDs available to generate (all participants revoked).";
    void runGenerate(nonRevokedParticipantIds, emptyMessage);
  };

  // 2) DOWNLOAD (first mark as distributed, then download)
  const handleDownload = async () => {
    if (participantIds.length === 0) {
      setError("No participant IDs found.");
      return;
    }

    setError(null);
    setNotice(null);
    setDownloading(true);
    try {
      if (!renderData) {
        const certData = await Axios.get<GetCertificateResponse>(
          `/certificate/${certId}`
        );
        const zipfileUrl = certData.data.data.archive_url;
        if (!zipfileUrl) {
          throw new Error("No downloadable file available. Please generate first.");
        }

        // Fetch file as blob and download
        const response = await fetch(zipfileUrl, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Download failed: ${response.statusText}`);
        }

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'certificates.zip';
        link.style.display = 'none';
        document.body.appendChild(link);

        // Use setTimeout to ensure blob URL is ready for Chromium
        setTimeout(() => {
          link.click();
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
          }, 100);
        }, 0);

        markParticipantsAsDownloaded(participantIds);
        return;
      }

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

      let downloadUrl = targetUrl;
      try {
        const certData = await Axios.get<GetCertificateResponse>(
          `/certificate/${certId}`
        );
        const zipfileUrl = certData.data.data.archive_url;
        if (zipfileUrl) {
          downloadUrl = zipfileUrl;
        }
      } catch {
        // Use targetUrl as fallback
      }

      // Fetch file as blob and download
      const response = await fetch(downloadUrl, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'certificates.zip';
      link.style.display = 'none';
      document.body.appendChild(link);

      // Use setTimeout to ensure blob URL is ready for Chromium
      setTimeout(() => {
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
      }, 0);

      markParticipantsAsDownloaded(participantIds);
    } catch (e) {
      setError((e as Error).message || "Download failed");
    } finally {
      await fetchParticipants({ silent: true });
      setDownloading(false);
    }
  };

  // 3) SEND EMAILS (POST /certificate/mail/:certId?email=<columnName>)
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
      await fetchParticipants({ silent: true });
      setSending(false);
    }
  };

  const handleSendIndividual = async (participantId: string | undefined) => {
    if (!participantId) {
      setError("Missing participant id.");
      return;
    }
    if (!certId) {
      setError("Missing certificate id.");
      return;
    }

    setError(null);
    setNotice(null);
    setSendingParticipantId(participantId);
    try {
      const res = await Axios.post(`/certificate/mail/resend/${participantId}`);

      if (!res.data?.success) {
        throw new Error(res.data?.msg || "Mail resend failed");
      }

      const data = res.data?.data;
      const participantKey =
        typeof data?.participant_id === "string"
          ? data.participant_id
          : participantId;
      const statusValue =
        typeof data?.email_status === "string"
          ? data.email_status.toLowerCase()
          : "success";

      if (participantKey) {
        setMailStatusMap((prev) => ({
          ...prev,
          [participantKey]:
            statusValue === "success" || statusValue === "failed"
              ? statusValue
              : "success",
        }));
      }

      toast.success("Email sent successfully.");
    } catch (e) {
      setMailStatusMap((prev) => ({
        ...prev,
        [participantId]: "failed",
      }));
      setError((e as Error).message || "Send failed");
    } finally {
      await fetchParticipants({ silent: true });
      setSendingParticipantId(null);
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
            canDistribute
              ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-100'
              : 'border-white/20 bg-white/10 text-white/70'
          }`}
        >
          <span className="inline-flex h-2 w-2 rounded-full bg-current" />
          {canDistribute ? 'Render complete' : 'Awaiting render'}
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

          {/* Signer status table */}
          <div className="rounded-3xl border border-white/20 bg-white/95 text-primary_text shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <h2 className="text-lg font-semibold text-primary_text">Signer status</h2>
              <span className="text-sm text-gray-500">{signers.length} total</span>
            </div>
            <div className="max-h-[320px] overflow-auto">
              <table className="min-w-full">
                <thead className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  <tr>
                    <th className="sticky top-0 z-10 bg-white px-5 py-3 shadow-sm">Name</th>
                    <th className="sticky top-0 z-10 bg-white px-5 py-3 shadow-sm">Email</th>
                    <th className="sticky top-0 z-10 bg-white px-5 py-3 shadow-sm">Requested</th>
                    <th className="sticky top-0 z-10 bg-white px-5 py-3 shadow-sm">Signed</th>
                    <th
                      className="sticky top-0 z-10 rounded-tr-3xl bg-white px-5 py-3 text-right shadow-sm"
                      style={{ width: '170px' }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {signers.length > 0 ? (
                    signers.map((s) => (
                      <tr key={s.id}>
                        <td className="px-5 py-3">{s.display_name || '-'}</td>
                        <td className="px-5 py-3">{s.email || '-'}</td>
                        <td className="px-5 py-3">
                          {s.is_requested ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/15 px-2.5 py-0.5 text-xs font-semibold text-sky-600">
                              Requested
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Not requested</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {s.is_signed ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                              Signed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right" style={{ width: '170px' }}>
                          <button
                            onClick={() => void handleRequestSigner(s.id)}
                            disabled={requestingSignerId === s.id}
                            className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold transition ${
                              requestingSignerId === s.id
                                ? 'cursor-not-allowed border-gray-400 bg-gray-200/70 text-gray-500'
                                : 'border-primary_button bg-primary_button/10 text-primary_button hover:scale-[1.01]'
                            }`}
                          >
                            {requestingSignerId === s.id
                              ? 'Sending…'
                              : (s.is_requested || s.is_signed)
                              ? 'Resend request'
                              : 'Send request'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-6 text-center text-gray-500">
                        No signer data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/95 text-primary_text shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <h2 className="text-lg font-semibold text-primary_text">Participants</h2>
              <span className="text-sm text-gray-500">{participants.length} total</span>
            </div>
            <div className="max-h-[520px] overflow-auto">
              <table className="min-w-full">
                <thead className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  <tr>
                    {columns.length > 0 ? (
                      columns.map((col) => (
                        <th
                          key={col}
                          className="sticky top-0 z-10 bg-white px-5 py-3 shadow-sm"
                        >
                          {col}
                        </th>
                      ))
                    ) : (
                      <th className="sticky top-0 z-10 bg-white px-5 py-3 shadow-sm">
                        No columns
                      </th>
                    )}
                    <th className="sticky top-0 z-10 bg-white px-5 py-3 text-right shadow-sm">
                      Download Status
                    </th>
                    <th className="sticky top-0 z-10 bg-white px-5 py-3 text-right shadow-sm">
                      Email Status
                    </th>
                    <th className="sticky top-0 z-10 bg-white px-5 py-3 text-right shadow-sm">
                      Email Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {participants.length > 0 ? (
                    participants.map((participant, index) => {
                      const mailStatus = participant.id ? mailStatusMap[participant.id] : undefined;
                      const renderStatus = participant.id
                        ? renderStatusMap.get(participant.id)
                        : undefined;
                      const isRevoked = Boolean(participant.is_revoked);
                      const downloadStatus = determineDownloadStatus(
                        participant,
                        renderStatus
                      );
                      const emailStatus = determineEmailStatus(
                        participant,
                        mailStatus
                      );

                      const canSendAfterRender = Boolean(
                        (participant.certificate_url &&
                          participant.certificate_url.trim().length > 0) ||
                        participant.is_distributed ||
                        participant.is_downloaded ||
                        renderStatus === 'success'
                      );
                      const emailActionDisabled =
                        sending ||
                        isRevoked ||
                        sendingParticipantId === participant.id ||
                        !participant.id ||
                        !canSendAfterRender;
                      const emailActionLabel = isRevoked
                        ? 'Revoked'
                        : sendingParticipantId === participant.id
                        ? 'Sending…'
                        : emailStatus === 'success'
                        ? 'Resend'
                        : 'Send';

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
                            {downloadStatus === 'downloaded' ? (
                              <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-600">
                                <svg
                                  className="h-4 w-4"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path d="M12 3a1 1 0 0 1 1 1v9.586l2.293-2.293 1.414 1.414L12 17.414l-4.707-4.707 1.414-1.414L11 13.586V4a1 1 0 0 1 1-1Zm-7 15h14v2H5v-2Z" />
                                </svg>
                                Downloaded
                              </span>
                            ) : downloadStatus === 'failed' ? (
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
                          <td className="px-5 py-3 text-right">
                            {emailStatus === 'success' ? (
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
                            ) : emailStatus === 'failed' ? (
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
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => void handleSendIndividual(participant.id)}
                              disabled={emailActionDisabled}
                              className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold transition ${
                                emailActionDisabled
                                  ? 'cursor-not-allowed border-gray-400 bg-gray-200/70 text-gray-500'
                                  : 'border-primary_button bg-primary_button/10 text-primary_button hover:scale-[1.01]'
                              }`}
                            >
                              {emailActionLabel}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={Math.max(columns.length, 1) + 3}
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
            <div className="flex flex-wrap justify-center gap-3 md:gap-4">
              {canDistribute ? (
                <>
                  <button
                    onClick={handleRegenerateAll}
                    disabled={rendering || participants.length === 0}
                    className={`inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition ${
                      rendering || participants.length === 0
                        ? 'cursor-not-allowed opacity-60 border-white/40 bg-white/90 text-primary_text'
                        : 'border-white/40 bg-white/90 text-primary_text hover:scale-[1.01]'
                    }`}
                    >
                    {/* refresh icon */}
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 6V3l-4 4 4 4V8a4 4 0 1 1-4 4H6a6 6 0 1 0 6-6Z" />
                    </svg>
                    {rendering ? 'Rendering…' : 'Re-generate'}
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className={`inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition ${
                      downloading
                        ? 'cursor-not-allowed opacity-60 border-white/40 bg-white/90 text-primary_text'
                        : 'border-white/40 bg-white/90 text-primary_text hover:scale-[1.01]'
                    }`}
                    >
                    {/* download icon */}
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 3a1 1 0 0 1 1 1v9.586l2.293-2.293 1.414 1.414L12 17.414l-4.707-4.707 1.414-1.414L11 13.586V4a1 1 0 0 1 1-1Zm-7 15h14v2H5v-2Z" />
                    </svg>
                    {downloading ? 'Preparing…' : 'Download'}
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className={`inline-flex items-center gap-2 rounded-full bg-primary_button px-6 py-3 text-sm font-semibold text-white shadow-lg transition ${
                      sending ? 'cursor-not-allowed opacity-60' : 'hover:scale-[1.01]'
                    }`}
                    >
                    {/* send icon */}
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2 .01 7Z" />
                    </svg>
                    {sending ? 'Sending…' : 'Send to all participants'}
                  </button>
                </>
              ) : null}
              {(!hasGenerated || hasIncomingActive) && (
                <button
                  onClick={handleGenerate}
                  disabled={
                    rendering ||
                    (!hasGenerated && participants.length === 0) ||
                    (hasGenerated && !hasIncomingActive)
                  }
                  className={`inline-flex items-center justify-center rounded-full bg-primary_button px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01] ${
                    rendering || !hasSigned ||
                    (!hasGenerated && participants.length === 0) ||
                    (hasGenerated && !hasIncomingActive)
                      ? 'cursor-not-allowed opacity-60'
                      : ''
                  }`}
                >
                  {rendering ? 'Rendering…' : generateButtonLabel}
                </button>
              )}
              {!canDistribute && hasGenerated && (
                <button
                  onClick={handleGenerateExcludingRevoked}
                  disabled={rendering || nonRevokedParticipantIds.length === 0}
                  className={`inline-flex items-center justify-center rounded-full bg-primary_button px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01] ${
                    rendering || nonRevokedParticipantIds.length === 0
                      ? 'cursor-not-allowed opacity-60'
                      : ''
                  }`}
                >
                  {rendering ? 'Rendering…' : 'Generate All Except Revoke'}
                </button>
              )}
            </div>
            <p className="text-center text-xs uppercase tracking-[0.25em] text-white/50">
              {canDistribute
                ? 'Ready to distribute'
                : 'Generate certificates before sharing'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export { SaveSendPage };
