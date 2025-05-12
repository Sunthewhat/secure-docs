import { useNavigate } from "react-router-dom";
import searchIcon from "../../asset/searchIcon.svg";

const HomePage = () => {
  const navigate = useNavigate();
  return (
    <div className=" flex flex-col">
      {/*  div text search and button */}
      <div className="font-noto bg-secondary_background rounded-[15px] flex flex-row justify-between items-center w-full h-full px-[20px]">
        {/* div text  */}
        <div className="px-[25px] py-[50px]">
          <p className="font-bold text-lg w-fit">Collections</p>
        </div>
        {/*div search and button*/}
        <div className="px-[25px] py-[50px] flex flex-row">
          {/* div icon and search */}
          <div className="flex flex-row items-center">
            <img
              className="mr-[10px] w-[24px] h-[24px]"
              src={searchIcon}
              alt="searchIcon"
            />
            <input
              className="text-noto text-[14px] border-1 rounded-[7px] px-[20px] py-[15px] mr-[25px] w-[224px] h-[39px]"
              type="text"
              placeholder="Search designs..."
            />
          </div>
          <button
            className="text-noto text-[14px] bg-primary_button text-secondary_text rounded-[7px] w-[185px] h-[39px] flex justify-center items-center"
            onClick={() => void navigate("/")}
          >
            + Create design
          </button>
        </div>
      </div>
      {/* <div className="font-noto bg-secondary_background rounded-[15px] mt-[40px] flex">
				<Collection name="dsf" />
			</div> */}
      <div className="font-noto bg-secondary_background rounded-[15px] flex flex-col items-center w-full h-full px-[20px] mt-[25px] py-[20px]">
        <div className="grid grid-cols-3 gap-[20px] w-full h-full">
          {[
            "IT4K",
            "OpenHouse2028",
            "SIT-RSA",
            "D-Day",
            "IT6K",
            "GoodStudent",
            "Test",
          ].map((label, i) => (
            <div
              key={i}
              className="rounded-[10px] w-full aspect-square flex flex-col px-5 py-5 items-center"
            >
              <div className="bg-gray-300 w-full h-[237px] rounded-[10px]"></div>
              <span className="mt-[20px] font-semibold text-[16px] text-center text-primary_text">
                {label}
              </span>
              <div className="mt-[15px] flex flex-row gap-[10px] w-full">
                <button className="bg-secondary_button text-white text-sm py-3 rounded-[8px] w-full">
                  Delete
                </button>
                <button className="bg-primary_button text-white text-sm py-3 rounded-[8px] w-full">
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { HomePage };
