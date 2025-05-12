import { useNavigate } from "react-router-dom";
import { RiEdit2Line } from "react-icons/ri";
import { RiDeleteBinLine } from "react-icons/ri";

const recipients = [
  { name: "John Doe", email: "john@example.com" },
  { name: "Jane Smith", email: "jane@example.com" },
  { name: "A", email: "a@example.com" },
  { name: "B", email: "b@example.com" },
  { name: "C", email: "c@example.com" },
  { name: "D", email: "d@example.com" },

  // Add more recipients as needed
];

const SharePage = () => {
  const navigate = useNavigate();
  return (
    <div className=" flex flex-col">
      {/*  div text search and button */}
      <div className="font-noto bg-secondary_background rounded-[15px] flex flex-row justify-between items-center w-full h-full px-[20px]">
        {/* div text  */}
        <div className="px-[25px] py-[50px]">
          <p className="font-bold text-lg w-fit">Add Recipients</p>
        </div>
        {/*div search and button*/}
        <div className="px-[25px] py-[50px] flex flex-row">
          <button
            className="text-noto text-[14px] bg-primary_button text-secondary_text rounded-[7px] w-[92px] h-[39px] flex justify-center items-center"
            onClick={() => void navigate("/")}
          >
            Send
          </button>
        </div>
      </div>
      {/* <div className="font-noto bg-secondary_background rounded-[15px] mt-[40px] flex">
				<Collection name="dsf" />
			</div> */}

<div className="font-noto bg-secondary_background rounded-[15px] flex flex-row items-start w-full h-full px-[20px] mt-[25px] py-[20px] gap-[5px]">
  {/* Certificate preview block on the left */}
  <div className="rounded-[10px] w-[30%] aspect-square flex flex-col px-5 py-3 items-center bg-white">
    <div className="bg-gray-300 w-[338px] h-[237px] rounded-[10px]"></div>
    <span className="mt-[20px] font-semibold text-[16px] text-center text-primary_text">
      IT4K
    </span>
    <div className="mt-[15px] flex justify-center flex-row gap-[10px] w-full">
      <button className="bg-secondary_button text-white text-sm py-3 rounded-[8px] w-50">
        Change Design
      </button>
    </div>

    {/* New section with two sub-columns */}
    <div className="mt-[20px] w-full">
      <table className="w-full border">
        <tbody>
          <tr>
            <td className="p-2 text-sm text-primary_text">Name</td>
            <td className="p-2">
              <select className="w-full px-3 py-2 border rounded-[8px] text-sm">
                <option>Select Column</option>
                <option>Design 1</option>
                <option>Design 2</option>
                <option>Design 3</option>
              </select>
            </td>
          </tr>
        </tbody>
        <tbody>
          <tr>
            <td className="p-2 text-sm text-primary_text">Email</td>
            <td className="p-2">
              <select className="w-full px-3 py-2 border rounded-[8px] text-sm">
                <option>Select Column</option>
                <option>Design 1</option>
                <option>Design 2</option>
                <option>Design 3</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
     
    </div>
  </div>

  {/* Table on the right */}
  <div className="flex-1 py-3 px-2 rounded-[10px] overflow-x-auto">
    <table className="w-full text-left border-collapse border border-gray-300">
      <thead className="bg-gray-200">
        <tr>
          <th className="p-3 text-center text-[14px] font-semibold text-gray-700 border border-gray-300">
            Recipient Name
          </th>
          <th className="p-3 text-center text-[14px] font-semibold text-gray-700 border border-gray-300">
            Recipient Email
          </th>
          <th className="p-3 text-center text-[14px] font-semibold text-gray-700 border border-gray-300 w-[120px]">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {recipients.map((recipient, index) => (
          <tr key={index}>
            <td className="p-3 text-sm text-gray-800 border border-gray-300">
              {recipient.name}
            </td>
            <td className="p-3 text-sm text-gray-800 border border-gray-300">
              {recipient.email}
            </td>
            <td className="p-3 border border-gray-300 w-[120px]">
              <div className="flex gap-7 justify-center">
                <button className="text-black hover:text-blue-600">
                  <RiEdit2Line size={20} />
                </button>
                <button className="text-black hover:text-red-600">
                  <RiDeleteBinLine size={20} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

    </div>
  );
};

export { SharePage };
