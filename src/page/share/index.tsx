// src/pages/SharePage.tsx
import { useNavigate, useParams } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { RiEdit2Line, RiDeleteBinLine } from "react-icons/ri";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ChangeEvent,
} from "react";
import { Axios } from "@/util/axiosInstance";
import {
  AddParticipantResponse,
  GetAnchorResponse,
  EditParticipantResponse,
  GetParticipantResponse,
  DeleteParticipantResponse,
} from "@/types/response";
import { useToast } from "@/components/toast/ToastContext";
import { DeleteParticipantModal } from "@/components/modal/DeleteParticipantModal";
import { ColumnMappingModal } from "@/components/modal/ColumnMappingModal";

type Recipient = { [key: string]: string };

type ParticipantRow = {
  id?: string; // present if row exists on server
  data: Recipient; // editable fields
  isDistributed?: boolean;
};

const SharePage = () => {
  const certId = useParams().certId as string;
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const prevRef = useRef(location);

  const [columns, setColumns] = useState<string[]>([]);
  const [recipients, setRecipients] = useState<ParticipantRow[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Recipient>({});
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    index: number;
    participantId?: string;
    name?: string;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [csvFilename, setCsvFilename] = useState<string>("");
  const [csvImporting, setCsvImporting] = useState(false);

  const ensureEmailBeforeActions = useCallback((cols: string[]): string[] => {
    if (!cols.length) return ["email"];
    const filtered = cols.filter(
      (col): col is string => typeof col === "string" && col.trim().length > 0
    );
    const normalized = filtered.map((col) => col.trim().toLowerCase());
    let targetIndex = normalized.findIndex((col) => col === "email");
    if (targetIndex === -1) {
      targetIndex = normalized.findIndex((col) => col.includes("email"));
    }
    const reordered = [...filtered];
    if (targetIndex === -1) {
      reordered.push("email");
      return reordered;
    }
    if (targetIndex === reordered.length - 1) {
      return reordered;
    }
    const [emailCol] = reordered.splice(targetIndex, 1);
    reordered.push(emailCol);
    return reordered;
  }, []);

  useEffect(() => {
    // store the previous path on every navigation
    const prevPath =
      prevRef.current.pathname + prevRef.current.search + prevRef.current.hash;
    sessionStorage.setItem("prevPath", prevPath);
    prevRef.current = location;
  }, [location]);

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
      return;
    }
    const prev = sessionStorage.getItem("prevPath");
    if (prev) navigate(prev);
    else navigate("/"); // final fallback
  };

  // ===== API helpers =====

  const fetchAnchorColumns = async (): Promise<string[]> => {
    try {
      const response = await Axios.get<GetAnchorResponse>(
        `/certificate/anchor/${certId}`
      );
      if (response.status !== 200) {
        toast.error(response.data.msg);
        return [];
      }

      const anchors = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      const sanitized = anchors
        .map((col) => (typeof col === "string" ? col.trim() : ""))
        .filter((col) => col.length > 0);
      if (!sanitized.length) {
        const fallback = ensureEmailBeforeActions([]);
        setColumns(fallback);
        return fallback;
      }
      const ordered = ensureEmailBeforeActions(sanitized);
      setColumns(ordered);
      return ordered;
    } catch {
      toast.error("Failed to load anchor columns.");
      const fallback = ensureEmailBeforeActions([]);
      setColumns(fallback);
      return fallback;
    }
  };

  const fetchParticipants = async (preferredColumns?: string[]) => {
    try {
      const response = await Axios.get<GetParticipantResponse>(
        `/participant/${certId}`
      );
      if (response.status !== 200) {
        toast.error(response.data.msg);
        return;
      }

      const serverRows = response.data.data ?? [];
      const serverCols = Array.from(
        new Set(serverRows.flatMap((p) => Object.keys(p.data ?? {})))
      );

      const preferredSanitized = (preferredColumns ?? [])
        .map((col) => (typeof col === "string" ? col.trim() : ""))
        .filter((col) => col.length > 0);

      const preferredOnlyEmail =
        preferredSanitized.length > 0 &&
        preferredSanitized.every((col) => col.toLowerCase().includes("email"));

      let resolvedCols = preferredSanitized.length
        ? [...preferredSanitized]
        : [];

      if (!preferredOnlyEmail) {
        const existing = resolvedCols.length
          ? [...resolvedCols]
          : columns
              .map((col) => (typeof col === "string" ? col.trim() : ""))
              .filter((col) => col.length > 0);

        const merged = Array.from(new Set(existing));
        const serverNormalized = serverCols
          .map((col) => (typeof col === "string" ? col.trim() : ""))
          .filter((col) => col.length > 0);

        if (!merged.length && serverNormalized.length) {
          merged.push(...serverNormalized);
        } else {
          serverNormalized.forEach((col) => {
            if (!merged.includes(col)) merged.push(col);
          });
        }

        resolvedCols = merged;
      }

      if (!resolvedCols.length) {
        resolvedCols = ["email"];
      }

      const orderedCols = ensureEmailBeforeActions(resolvedCols);

      const mapped: ParticipantRow[] = serverRows.map((p) => {
        const normalized: Recipient = {};
        orderedCols.forEach((col) => {
          const val = p.data?.[col];
          normalized[col] =
            val !== undefined && val !== null ? String(val) : "";
        });
        return {
          id: p.id,
          data: normalized,
          isDistributed: Boolean(p.is_distributed),
        };
      });

      setColumns(orderedCols);
      setRecipients(mapped);
    } catch {
      toast.error("Failed to load recipients.");
    }
  };

  const editParticipantByParticipantId = async (
    participantId: string,
    data: Recipient
  ) => {
    const response = await Axios.put<EditParticipantResponse>(
      `/participant/edit/${participantId}`,
      { data } // matches API: { data: { ... } }
    );
    if (response.status !== 200) {
      toast.error(response.data.msg);
      return;
    }
  };

  const createParticipant = async (certId: string, data: Recipient) => {
    // API expects array under "participants"
    const response = await Axios.post<AddParticipantResponse>(
      `/participant/add/${certId}`,
      {
        participants: [data],
      }
    );
    if (response.status !== 200) {
      toast.error(response.data.msg);
      return;
    }
    // After creation, refresh so the new row gets its server id
    await fetchParticipants();
  };

  const parseCsvText = (csvText: string) => {
    const rows: string[][] = [];
    let currentField = "";
    let currentRow: string[] = [];
    let inQuotes = false;

    const pushField = () => {
      currentRow.push(currentField.trim());
      currentField = "";
    };

    const commitRow = () => {
      if (currentRow.some((cell) => cell !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
    };

    for (let i = 0; i < csvText.length; i += 1) {
      const char = csvText[i];

      if (char === "\"") {
        if (inQuotes && csvText[i + 1] === "\"") {
          currentField += "\"";
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        pushField();
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && csvText[i + 1] === "\n") {
          i += 1;
        }
        pushField();
        commitRow();
      } else {
        currentField += char;
      }
    }

    if (currentField.length > 0 || currentRow.length) {
      pushField();
      commitRow();
    }

    if (!rows.length) {
      return { headers: [] as string[], rows: [] as string[][] };
    }

    const [headerRow, ...dataRows] = rows;
    const headers = headerRow.map((header) => header.trim());
    const normalizedRows = dataRows.map((row) =>
      row.length < headers.length
        ? [...row, ...Array(headers.length - row.length).fill("")]
        : row.slice(0, headers.length)
    );

    return { headers, rows: normalizedRows };
  };

  const deriveInitialMapping = (
    anchors: string[],
    headers: string[]
  ): Record<string, string> => {
    const mapping: Record<string, string> = {};
    const normalizedHeaders = headers.map((header) => header.trim());

    const normalize = (value: string) =>
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    anchors.forEach((anchor) => {
      const normalizedAnchor = normalize(anchor);
      let match = normalizedHeaders.find(
        (header) => normalize(header) === normalizedAnchor
      );

      if (!match) {
        match = normalizedHeaders.find((header) =>
          normalize(header).includes(normalizedAnchor)
        );
      }

      mapping[anchor] = match ?? "";
    });

    return mapping;
  };

  const resetCsvImportState = () => {
    setCsvHeaders([]);
    setCsvRows([]);
    setColumnMapping({});
    setCsvFilename("");
  };

  const handleUploadButtonClick = () => {
    if (!columns.length) {
      toast.error("Anchors are not ready yet. Please try again in a moment.");
      return;
    }
    uploadInputRef.current?.click();
  };

  const handleCsvFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please choose a CSV file.");
      return;
    }

    try {
      const text = await file.text();
      const { headers, rows: parsedRows } = parseCsvText(text);

      if (!headers.length) {
        toast.error("The selected CSV does not contain a header row.");
        return;
      }

      if (!parsedRows.length) {
        toast.error("No data rows found in the CSV file.");
        return;
      }

      setCsvHeaders(headers);
      setCsvRows(parsedRows);
      setColumnMapping(deriveInitialMapping(columns, headers));
      setCsvFilename(file.name);
      setIsMappingModalOpen(true);
    } catch (
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _error
    ) {
      toast.error("Failed to read the CSV file. Please try again.");
    }
  };

  const handleMappingChange = (anchor: string, header: string) => {
    setColumnMapping((prev) => ({ ...prev, [anchor]: header }));
  };

  const handleCloseMappingModal = () => {
    if (csvImporting) return;
    setIsMappingModalOpen(false);
    resetCsvImportState();
  };

  const handleConfirmMapping = async () => {
    if (!columns.length) {
      toast.error("Anchors are not ready yet.");
      return;
    }

    const missingAnchor = columns.find((anchor) => !columnMapping[anchor]);
    if (missingAnchor) {
      toast.error(`Please map a CSV column to "${missingAnchor}".`);
      return;
    }

    const headerIndexMap = new Map<string, number>();
    csvHeaders.forEach((header, index) => {
      headerIndexMap.set(header, index);
    });

    const mappedRows: ParticipantRow[] = csvRows.map((row) => {
      const data: Recipient = {};
      columns.forEach((anchor) => {
        const header = columnMapping[anchor];
        const headerIndex = header ? headerIndexMap.get(header) ?? -1 : -1;
        const value = headerIndex >= 0 ? row[headerIndex] ?? "" : "";
        data[anchor] = value;
      });
      return { id: undefined, data, isDistributed: false };
    });

    const filledRows = mappedRows.filter((row) => !isRowEmpty(row));
    if (!filledRows.length) {
      toast.error("No usable rows found in the CSV file.");
      return;
    }

    setCsvImporting(true);
    try {
      const payload = filledRows.map((row) => ({ ...row.data }));
      const response = await Axios.post(`/participant/add/${certId}`, {
        participants: payload,
      });

      if (response.status !== 200 || !response.data?.success) {
        throw new Error(response.data?.msg || "Failed to import participants.");
      }

      await fetchParticipants();

      toast.success(
        `Imported ${filledRows.length} participant${
          filledRows.length === 1 ? "" : "s"
        } from CSV.`
      );
      setIsMappingModalOpen(false);
      resetCsvImportState();
    } catch (error) {
      toast.error((error as Error).message || "Failed to import participants.");
    } finally {
      setCsvImporting(false);
    }
  };


  // ===== Next flow =====

  const handleNext = () => {
    if (editIndex !== null) {
      toast.error("Please finish editing the current row before continuing.");
      return;
    }

    if (recipients.length === 0) {
      toast.error("Please add at least one recipient before continuing.");
      return;
    }
    if (!hasAtLeastOneFilledRow()) {
      toast.error("Please fill at least one field for a recipient.");
      return;
    }
    const previewParticipants = buildPreviewParticipants();
    if (!previewParticipants.length) {
      toast.error("Please fill at least one field for a recipient.");
      return;
    }

    navigate(`/preview/${certId}`, {
      state: {
        fromShare: true,
        columns: [...columns],
        participants: previewParticipants,
      },
    });
  };

  // ===== Effects =====

  useEffect(() => {
    const loadData = async () => {
      const anchorCols = await fetchAnchorColumns();
      await fetchParticipants(anchorCols);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editIndex !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editIndex]);

  // ===== Row edit handlers =====

  const handleEdit = (index: number) => {
    const row = recipients[index];
    if (row?.isDistributed) {
      toast.error("Distributed participants cannot be edited.");
      return;
    }
    setEditIndex(index);
    setEditForm({ ...row.data });
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>, col: string) => {
    setEditForm((prev) => ({ ...prev, [col]: e.target.value }));
  };

  const handleSave = async (index: number) => {
    const row = recipients[index];

    if (row?.isDistributed) {
      toast.error("Distributed participants cannot be edited.");
      return;
    }

    // If user tried to save an entirely empty row, show error and keep editing.
    if (Object.values(editForm).every((v) => (v ?? "").trim() === "")) {
      toast.error("This row is empty. Please fill at least one field.");
      return;
    }

    // Optimistic local update
    const updated = [...recipients];
    updated[index] = { ...row, data: { ...editForm } };
    setRecipients(updated);
    setEditIndex(null);

    try {
      if (row.id) {
        await editParticipantByParticipantId(row.id, editForm);
      } else {
        await createParticipant(certId, editForm);
      }
    } catch {
      fetchParticipants();
    }
  };

  const handleCancel = () => {
    if (
      editIndex !== null &&
      Object.values(recipients[editIndex].data).every((v) => v === "")
    ) {
      setRecipients(recipients.filter((_, i) => i !== editIndex));
    }
    setEditIndex(null);
  };

  const deriveParticipantLabel = (row: ParticipantRow) => {
    const priorityKeys = ["name", "fullname", "email"];
    for (const key of priorityKeys) {
      const value = row.data[key];
      if (value) return value;
    }
    for (const col of columns) {
      const value = row.data[col];
      if (value) return value;
    }
    return undefined;
  };

  const handleDelete = (index: number) => {
    const row = recipients[index];
    if (!row) return;
    if (row.isDistributed) {
      toast.error("Distributed participants cannot be modified.");
      return;
    }
    if (!row.id) {
      setRecipients((prev) => prev.filter((_, i) => i !== index));
      if (editIndex === index) {
        setEditIndex(null);
        setEditForm({});
      }
      return;
    }

    const label = deriveParticipantLabel(row);
    setDeleteTarget({ index, participantId: row.id, name: label });
  };

  // ===== Add row & rename column =====

  const handleAddRow = () => {
    const newData: Recipient = {};
    columns.forEach((col) => (newData[col] = ""));
    const newRecipients = [
      ...recipients,
      { id: undefined, data: newData, isDistributed: false },
    ];
    setRecipients(newRecipients);
    setEditIndex(newRecipients.length - 1);
    setEditForm(newData);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.participantId) return;
    setDeleteLoading(true);
    try {
      const response = await Axios.delete<DeleteParticipantResponse>(
        `/participant/${deleteTarget.participantId}`
      );
      if (response.status !== 200 || !response.data?.success) {
        toast.error(response.data?.msg || "Failed to delete participant.");
        return;
      }

      setRecipients((prev) =>
        prev.filter((_, i) => i !== deleteTarget.index)
      );
      if (editIndex === deleteTarget.index) {
        setEditIndex(null);
        setEditForm({});
      }
      toast.success("Participant deleted.");
      setDeleteTarget(null);
    } catch (
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _error
    ) {
      toast.error("Failed to delete participant.");
    } finally {
      setDeleteLoading(false);
    }
  };


  


  // is the whole row empty? (all fields blank or whitespace)
  const isRowEmpty = (row: ParticipantRow) =>
    Object.values(row.data).every((v) => (v ?? "").trim() === "");

  const buildPreviewParticipants = () => {
    const timestamp = Date.now();
    return recipients
      .filter((row) => !isRowEmpty(row))
      .map((row, index) => ({
        id: row.id ?? `local-${timestamp}-${index}`,
        data: { ...row.data },
        isDistributed: Boolean(row.isDistributed),
      }));
  };

  // does the table contain at least one non-empty row?
  const hasAtLeastOneFilledRow = () => recipients.some((r) => !isRowEmpty(r));

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="font-noto bg-secondary_background rounded-[15px] flex flex-row items-center w-full h-[72px] px-[20px]">
        <button
          className="text-noto text-[14px] bg-white text-primary_text rounded-[7px] w-[120px] h-[39px] flex justify-center items-center  underline "
          onClick={handleBack}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Back
        </button>
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <p className="font-semibold text-[25px] w-fit">Add Participants</p>
        </div>
        <div className="ml-auto">
          <button
            className="text-noto text-[14px] bg-primary_button text-secondary_text rounded-[7px] w-[92px] h-[39px] flex justify-center items-center"
            onClick={handleNext}
          >
            Next
          </button>
        </div>
      </div>

      {/* Table + side actions */}
      <div className="font-noto bg-secondary_background min-h-[777px] rounded-[15px] flex flex-col items-center w-full h-full px-[50px] mt-[25px] py-[48px]">
        <div className="w-full flex gap-4">
          {/* Table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse border border-gray-300">
              <thead className="bg-[#f3f3f3]">
                <tr>
                  {columns.map((col, i) => (
                    <th
                      key={i}
                      className="p-3 text-center min-w-[200px] text-[14px] font-semibold text-gray-700 border border-gray-300"
                    >
                      
                        <div className="flex items-center justify-center gap-2">
                          <span>{col}</span>
                          
                        </div>
                    </th>
                  ))}
                  <th className="p-3 text-center text-[14px] font-semibold text-gray-700 border border-gray-300 w-[120px]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {recipients.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="text-center text-gray-500 p-4 border border-gray-300"
                    >
                      No recipients yet. Click <b>+ Add Recipient</b> to start.
                    </td>
                  </tr>
                ) : (
                  recipients.map((row, index) => {
                    const isDistributed = Boolean(row.isDistributed);
                    return (
                      <tr key={row.id ?? `new-${index}`}>
                      {columns.map((col, i) => (
                        <td
                          key={i}
                          className="p-3 text-sm text-gray-800 border border-gray-300"
                        >
                          {editIndex === index ? (
                            <input
                              ref={i === 0 ? inputRef : null}
                              type="text"
                              value={editForm[col] || ""}
                              onChange={(e) => handleChange(e, col)}
                              className="border rounded px-2 py-1 w-full"
                              placeholder={`Enter ${col}`}
                            />
                          ) : (
                            row.data[col] || ""
                          )}
                        </td>
                      ))}

                      <td className="p-3 border border-gray-300 w-[120px]">
                        <div className="flex gap-4 justify-center">
                          {editIndex === index ? (
                            <>
                              <button
                                onClick={() => handleSave(index)}
                                className="text-green-600 hover:text-green-800"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancel}
                                className="text-gray-600 hover:text-gray-800"
                              >
                                Cancel
                              </button>
                            </>
                           ) : (
                             <>
                              <button
                                className={`text-black ${
                                  isDistributed
                                    ? 'opacity-40 cursor-not-allowed'
                                    : 'hover:text-blue-600'
                                }`}
                                onClick={() => handleEdit(index)}
                                title={
                                 isDistributed
                                    ? 'Editing disabled for distributed participants'
                                    : row.id
                                    ? 'Edit (PUT)'
                                    : 'Edit (POST on Save)'
                                }
                                disabled={isDistributed}
                              >
                                <RiEdit2Line size={20} />
                              </button>
                              <button
                                className={`text-black ${
                                  isDistributed
                                    ? 'opacity-40 cursor-not-allowed'
                                    : 'hover:text-red-600'
                                }`}
                                onClick={() => handleDelete(index)}
                                disabled={isDistributed}
                              >
                                <RiDeleteBinLine size={20} />
                             </button>
                           </>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
             </tbody>
           </table>
          </div>
        </div>

        {/* Add Recipient */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleUploadButtonClick}
            className="text-noto text-[14px] bg-blue-500 hover:bg-blue-600 text-white rounded-[7px] w-[142px] h-[39px] flex justify-center items-center"
          >
            Upload CSV
          </button>
          <input
            ref={uploadInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCsvFileChange}
          />
          <button
            onClick={handleAddRow}
            className="text-noto text-[14px] bg-green-500 hover:bg-green-600 text-white rounded-[7px] w-[142px] h-[39px] flex justify-center items-center"
          >
            + Add Recipient
          </button>
        </div>
      </div>

      <DeleteParticipantModal
        open={Boolean(deleteTarget)}
        participantName={deleteTarget?.name}
        onClose={() => {
          if (deleteLoading) return;
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
      <ColumnMappingModal
        open={isMappingModalOpen}
        anchors={columns}
        headers={csvHeaders}
        mapping={columnMapping}
        filename={csvFilename}
        sampleRow={csvRows[0] ?? []}
        onChange={handleMappingChange}
        onClose={handleCloseMappingModal}
        onConfirm={handleConfirmMapping}
        confirmLoading={csvImporting}
      />
    </div>
  );
};

export { SharePage };
