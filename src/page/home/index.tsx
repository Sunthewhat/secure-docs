import { useNavigate } from "react-router-dom";
import searchIcon from "../../asset/searchIcon.svg";

const certificateItem = [
  {
    id: "1",
    imageURL:
      "https://marketplace.canva.com/EAFlVDzb7sA/3/0/1600w/canva-white-gold-elegant-modern-certificate-of-participation-Qn4Rei141MM.jpg",
    name: "IT4K",
  },
  {
    id: "2",
    imageURL:
      "https://i.etsystatic.com/11323145/r/il/7f7042/1489349106/il_570xN.1489349106_o3z1.jpg",
    name: "CSFD",
  },
  {
    id: "3",
    imageURL:
      "https://d1csarkz8obe9u.cloudfront.net/posterpreviews/professional-certificate-design-template-882d9df12b1505d88cfb20c9b7ed22bb_screen.jpg?ts=1689415226",
    name: "123",
  },
  {
    id: "4",
    imageURL:
      "https://marketplace.canva.com/EAGMPfFcHWI/1/0/1600w/canva-blue-and-white-simple-modern-certificate-of-appreciation-kYHEaKKpJI0.jpg",
    name: "ASDF",
  },
  {
    id: "5",
    imageURL:
      "https://cdn.venngage.com/template/thumbnail/full/d793fea5-7d9c-4cdf-a438-69ea99c696b3.webp",
    name: "OPENHOUSE2022",
  },
  {
    id: "6",
    imageURL:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNWpPkIDgivVqgADN67EimZttkFaXpxvB33A&s",
    name: "TEst",
  },
  {
    id: "7",
    imageURL:
      "https://cdn.venngage.com/template/thumbnail/small/95f1e2aa-cfae-4b41-94e4-9eadfcb9e7d3.webp",
    name: "Wow",
  },
];

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
          {certificateItem.map((data, index) => (
            <div
              key={index}
              className="rounded-[10px] w-full aspect-square flex flex-col px-5 py-5 items-center"
            >
              <div className="bg-gray-300 w-full h-[237px] rounded-[10px]">
                <img
                  src={data.imageURL}
                  alt="Description"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="mt-5 font-semibold text-[16px] text-center text-primary_text">
                {data.name}
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
