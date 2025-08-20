import IoCheckboxOutline from "../../asset/IoCheckboxOutline.svg";

const recipients = [
  {
    name: "John Doe",
    email: "john@example.com",
    issueDate: "19/08/2025",
    certName: "IT4K",
  },
  {
    name: "Jane Smith",
    email: "jane@example.com",
    issueDate: "19/08/2025",
    certName: "IT4K",
  },
  {
    name: "A",
    email: "a@example.com",
    issueDate: "19/08/2025",
    certName: "IT4K",
  },
  {
    name: "B",
    email: "b@example.com",
    issueDate: "19/08/2025",
    certName: "IT4K",
  },
  {
    name: "C",
    email: "c@example.com",
    issueDate: "19/08/2025",
    certName: "IT4K",
  },
  {
    name: "D",
    email: "d@example.com",
    issueDate: "19/08/2025",
    certName: "IT4K",
  },

  // Add more recipients as needed
];

const HistoryPage = () => {
  return (
    <div className=" flex flex-col">
      <div className="font-noto bg-secondary_background min-h-[777px] rounded-[15px] flex-col justify-center w-full h-full px-[100px] mt-[25px] py-[48px]">
        {/* Certificate preview block on the left */}
        <div className="flex justify-between h-[120px]">
          <div className="font-bold text-[22px]">Shared History</div>
          <div className="w-[225px] flex-col">
            <div className="flex flex-row items-center">
            <input
              className="text-noto text-[14px] border-1 rounded-[7px] px-[20px] py-[15px] w-full h-[39px] mb-4"
              type="text"
              placeholder="Search recipients..."
            />
          </div>
            <div className="flex justify-between items-center">
              <p className="ml-8 font-bold text-[14px]">0 Selected</p>
			   <div
              className="text-noto font-bold text-[14px] bg-primary_button text-secondary_text rounded-[10px]  h-[39px] px-6 flex justify-between items-center"
            >

              <p>Revoke</p>
            </div>
            </div>
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse border border-gray-300">
            <thead className="bg-[#f3f3f3]">
              <tr>
                <th className=" w-[60px] text-gray-700 border-gray-300">
				</th>
                <th className="p-3 text-center text-[14px] font-semibold text-gray-700 border border-gray-300 ">
                  Recipient Name
                </th>
                <th className="p-3 text-center text-[14px] font-semibold text-gray-700 border border-gray-300">
                  Recipient Email
                </th>
                <th className="p-3 text-center text-[14px] font-semibold text-gray-700 border border-gray-300 w-[120px]">
                  Issue Date
                </th>
                <th className="p-3 text-center text-[14px] font-semibold text-gray-700 border border-gray-300 w-[120px]">
                  Certificate
                </th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((recipient, index) => (
                <tr key={index}>
                  <td className="p-4 text-gray-800 border border-gray-300">
				<img
              className="w-[24px] h-[24px]"
              src={IoCheckboxOutline}
              alt="IoCheckboxOutline"
            />
				  </td>
                  <td className="p-3 text-sm text-gray-800 border border-gray-300">
                    {recipient.name}
                  </td>
                  <td className="p-3 text-sm text-gray-800 border border-gray-300">
                    {recipient.email}
                  </td>
                  <td className="p-3 text-sm text-gray-800 border border-gray-300 text-center">
                    {recipient.issueDate}
                  </td>
                  <td className="p-3 text-sm text-gray-800 border border-gray-300 text-center">
                    {recipient.certName}
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

export { HistoryPage };
