import { useNavigate } from "react-router-dom";
import { RiEdit2Line} from "react-icons/ri";
import { RiDeleteBinLine } from "react-icons/ri";

const recipients = [
  { name: "John Doe", email: "john@example.com", school: "ASCP" },
  { name: "Jane Smith", email: "jane@example.com", school: "TUP" },
  { name: "A", email: "a@example.com", school: "RYW" },
  { name: "B", email: "b@example.com", school: "TUP" },
  { name: "C", email: "c@example.com", school: "TU" },
  { name: "D", email: "d@example.com", school: "OSK" },

  // Add more recipients as needed
];

const SharePage = () => {
  const navigate = useNavigate();
  return (
    <div className=" flex flex-col">
      {/*  div text search and button */}
      <div className="font-noto bg-secondary_background rounded-[15px] flex  flex-row items-center w-full h-[72px] px-[20px]">
        {/* div text  */}
        <div className="absolute left-1/2 transform  -translate-x-1/2">
          <p className="font-semibold text-[32px] w-fit">Add Recipients</p>
        </div>
        {/*div search and button*/}
        <div className="ml-auto">
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

<div className="font-noto bg-secondary_background min-h-[777px] rounded-[15px] flex justify-center w-full h-full px-[100px] mt-[25px] py-[48px]">
  {/* Certificate preview block on the left */}

 

  <div className="w-full overflow-x-auto">
    <table className="w-full text-left border-collapse border border-gray-300">
      <thead className="bg-[#f3f3f3]">
        <tr>
          <th className="p-3 text-center text-[14px] font-semibold text-gray-700 border border-gray-300">
            Recipient Name
          </th>
          <th className="p-3 text-center text-[14px] font-semibold text-gray-700 border border-gray-300">
            Recipient Email
          </th>
          <th className="p-3 text-center text-[14px] font-semibold text-gray-700 border border-gray-300 w-[120px]">
            School
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
            <td className="p-3 text-sm text-gray-800 border border-gray-300">
              {recipient.school}
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
    <div className="flex justify-center">
    <div
            className="text-noto text-[14px] bg-primary_button text-secondary_text rounded-[7px] w-[142px] h-[39px] px-4 flex justify-between items-center mt-[45px]"
            onClick={() => void navigate("/share/preview")}
          > 
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11 16V7.85L8.4 10.45L7 9L12 4L17 9L15.6 10.45L13 7.85V16H11ZM6 20C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18V15H6V18H18V15H20V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H6Z" fill="#FEF7FF"/>
</svg>

            <p>Upload CSV</p>
          </div>
          </div>
  </div>
</div>

    </div>
  );
};

export { SharePage };
