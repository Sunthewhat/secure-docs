import { useNavigate, useParams } from "react-router-dom";
import {
  RiEdit2Line,
  RiDeleteBinLine,
  RiAddLine,
  RiCheckLine,
  RiCloseLine,
} from "react-icons/ri";
import { useState, useRef, useEffect } from "react";
import { Axios } from "@/util/axiosInstance";
import {
  AddParticipantResponse,
  GetParticipantResponse,
} from "@/types/response";

type Recipient = {
  [key: string]: string; // dynamic columns
};

const SharePage = () => {
  const certId = useParams().certId as string;
  const navigate = useNavigate();

  const [columns, setColumns] = useState<string[]>(["Recipient Name"]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Recipient>({});
  const inputRef = useRef<HTMLInputElement | null>(null);

  // for renaming columns
  const [editColIndex, setEditColIndex] = useState<number | null>(null);
  const [colEditValue, setColEditValue] = useState<string>("");

  const handleAddParticipants = async (certId: string) => {
    const response = await Axios.post<AddParticipantResponse>(
      `/participant/add/${certId}`,
      { participants: recipients }
    );

    if (response.status !== 200) {
      alert(response.data.msg);
      return;
    }

    navigate(`/preview/${certId}`);
  };

  const fetchParticipants = async () => {
  const response = await Axios.get<GetParticipantResponse>(
    `/participant/${certId}`
  );
  if (response.status !== 200) {
    alert(response.data.msg);
    return;
  }

  // each item has a `.data` object with actual participant fields
  const participants = response.data.data.map((p) => p.data);

  console.log("data11111",response.data.data.map((p) => p.data));

  if (participants.length > 0) {
    // Extract all unique keys from participant "data" objects
    const uniqueCols = Array.from(
      new Set(participants.flatMap((p) => Object.keys(p)))
    );

    // Convert each participant data into Recipient row
    const mappedRecipients: Recipient[] = participants.map((p) => {
      const row: Recipient = {};
      uniqueCols.forEach((col) => {
        row[col] = p[col as keyof typeof p]?.toString() ?? "";
      });
      return row;
    });

    setColumns(uniqueCols);       // e.g. ["email", "name"]
    setRecipients(mappedRecipients); // table rows
  } else {
    setRecipients([]); // no participants
  }
};


  useEffect(() => {
    fetchParticipants();
  }, []);

  // auto-focus input when editing row
  useEffect(() => {
    if (editIndex !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editIndex]);

  const handleEdit = (index: number) => {
    setEditIndex(index);
    setEditForm(recipients[index]);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    col: string
  ) => {
    setEditForm({ ...editForm, [col]: e.target.value });
  };

  const handleSave = (index: number) => {
    const updated = [...recipients];
    updated[index] = editForm;
    setRecipients(updated);
    setEditIndex(null);
  };

  const handleCancel = () => {
    if (
      editIndex !== null &&
      Object.values(recipients[editIndex]).every((v) => v === "")
    ) {
      setRecipients(recipients.filter((_, i) => i !== editIndex));
    }
    setEditIndex(null);
  };

  const handleDelete = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleAddRow = () => {
    const newRow: Recipient = {};
    columns.forEach((col) => (newRow[col] = ""));
    const newRecipients = [...recipients, newRow];
    setRecipients(newRecipients);
    setEditIndex(newRecipients.length - 1);
    setEditForm(newRow);
  };

  const handleAddColumn = () => {
    const newCol = `Column ${columns.length}`;
    setColumns([...columns, newCol]);
    setRecipients(recipients.map((r) => ({ ...r, [newCol]: "" })));
  };

  const handleStartEditColumn = (index: number, currentName: string) => {
    setEditColIndex(index);
    setColEditValue(currentName);
  };

  const handleSaveColumn = (index: number) => {
    if (colEditValue.trim() === "") return;
    const oldCol = columns[index];
    const newCol = colEditValue.trim();

    const updatedColumns = [...columns];
    updatedColumns[index] = newCol;

    // rename keys in recipients
    const updatedRecipients = recipients.map((r) => {
      const { [oldCol]: oldValue, ...rest } = r;
      return { ...rest, [newCol]: oldValue };
    });

    setColumns(updatedColumns);
    setRecipients(updatedRecipients);
    setEditColIndex(null);
    setColEditValue("");
  };

  const handleCancelColumn = () => {
    setEditColIndex(null);
    setColEditValue("");
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="font-noto bg-secondary_background rounded-[15px] flex flex-row items-center w-full h-[72px] px-[20px]">
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <p className="font-semibold text-[32px] w-fit">Add Recipients</p>
        </div>
        <div className="ml-auto">
          <button
            className="text-noto text-[14px] bg-primary_button text-secondary_text rounded-[7px] w-[92px] h-[39px] flex justify-center items-center"
            onClick={() => handleAddParticipants(certId)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Table with right column box */}
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
                      {editColIndex === i ? (
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="text"
                            value={colEditValue}
                            onChange={(e) => setColEditValue(e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                          />
                          <button
                            onClick={() => handleSaveColumn(i)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <RiCheckLine size={18} />
                          </button>
                          <button
                            onClick={handleCancelColumn}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <RiCloseLine size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>{col}</span>
                          <button
                            onClick={() => handleStartEditColumn(i, col)}
                            className="text-gray-600 hover:text-blue-600"
                          >
                            <RiEdit2Line size={16} />
                          </button>
                        </div>
                      )}
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
                  recipients.map((recipient, index) => (
                    <tr key={index}>
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
                            recipient[col] || ""
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
                                className="text-black hover:text-blue-600"
                                onClick={() => handleEdit(index)}
                              >
                                <RiEdit2Line size={20} />
                              </button>
                              <button
                                className="text-black hover:text-red-600"
                                onClick={() => handleDelete(index)}
                              >
                                <RiDeleteBinLine size={20} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Right box for dynamic columns */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleAddColumn}
              className="text-noto text-[14px] bg-blue-500 hover:bg-blue-600 text-white rounded-[7px] w-[142px] h-[39px] flex justify-center items-center mt-2"
            >
              <RiAddLine size={18} className="mr-2" /> Add Column
            </button>
          </div>
        </div>

        {/* Add Recipient button */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleAddRow}
            className="text-noto text-[14px] bg-green-500 hover:bg-green-600 text-white rounded-[7px] w-[142px] h-[39px] flex justify-center items-center"
          >
            + Add Recipient
          </button>
        </div>
      </div>
    </div>
  );
};

export { SharePage };
