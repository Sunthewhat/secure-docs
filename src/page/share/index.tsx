import { useNavigate } from "react-router-dom";
import { RiEdit2Line, RiDeleteBinLine, RiAddLine } from "react-icons/ri";
import { useState, useRef, useEffect } from "react";

type Recipient = {
  [key: string]: string; // dynamic columns
};

const SharePage = () => {
  const navigate = useNavigate();

  const [columns, setColumns] = useState<string[]>(["Recipient Name"]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Recipient>({});
  const inputRef = useRef<HTMLInputElement | null>(null);

  // auto-focus input when editing
  useEffect(() => {
    if (editIndex !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editIndex]);

  const handleEdit = (index: number) => {
    setEditIndex(index);
    setEditForm(recipients[index]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, col: string) => {
    setEditForm({ ...editForm, [col]: e.target.value });
  };

  const handleSave = (index: number) => {
    const updated = [...recipients];
    updated[index] = editForm;
    setRecipients(updated);
    setEditIndex(null);
  };

  const handleCancel = () => {
    if (editIndex !== null && Object.values(recipients[editIndex]).every((v) => v === "")) {
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
            onClick={() => void navigate("/")}
          >
            Send
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="font-noto bg-secondary_background min-h-[777px] rounded-[15px] flex justify-center w-full h-full px-[100px] mt-[25px] py-[48px]">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse border border-gray-300">
            <thead className="bg-[#f3f3f3]">
              <tr>
                {columns.map((col, i) => (
                  <th
                    key={i}
                    className="p-3 text-center text-[14px] font-semibold text-gray-700 border border-gray-300"
                  >
                    {col}
                  </th>
                ))}
                <th className="p-3 text-center text-[14px] font-semibold text-gray-700 border border-gray-300 w-[120px]">
                  Actions
                </th>
                <th className="p-3 text-center border border-gray-300 w-[50px]">
                  <button
                    onClick={handleAddColumn}
                    className="text-green-600 hover:text-green-800"
                    title="Add column"
                  >
                    <RiAddLine size={20} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {recipients.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 2}
                    className="text-center text-gray-500 p-4 border border-gray-300"
                  >
                    No recipients yet. Click <b>+ Add Recipient</b> to start.
                  </td>
                </tr>
              ) : (
                recipients.map((recipient, index) => (
                  <tr key={index}>
                    {columns.map((col, i) => (
                      <td key={i} className="p-3 text-sm text-gray-800 border border-gray-300">
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
                          recipient[col]
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
                    <td className="border border-gray-300" />
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Add recipient button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={handleAddRow}
              className="text-noto text-[14px] bg-green-500 hover:bg-green-600 text-white rounded-[7px] w-[142px] h-[39px] flex justify-center items-center"
            >
              + Add Recipient
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { SharePage };
