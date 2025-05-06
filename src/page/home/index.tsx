import { useNavigate } from "react-router-dom";
import searchIcon from "../../asset/searchIcon.svg";
import { Collection } from "../../components/home/collection.js";
const HomePage = () => {
	const navigate = useNavigate();
	return (
		<div className=" flex flex-col">
			{/*  div text search and button */}
			<div className="font-noto bg-secondary_background rounded-[15px] flex flex-row justify-between items-center  ">
				{/* div text  */}
				<div className="px-[25px] py-[50px]">
					<p className="font-bold text-lg w-fit">Collections</p>
				</div>
				{/*div search and button*/}
				<div className="px-[25px] py-[50px] flex flex-row">
					{/* div icon and search */}
					<div className="flex flex-row">
						<img
							className="mr-[10px]"
							src={searchIcon}
							alt="searchIcon"
						/>
						<input
							className=" border-1 rounded-[15px] px-[20px] py-[15px] mr-[25px]"
							type="text"
							placeholder="Search designs..."
						/>
					</div>
					<button
						className="bg-primary_button text-secondary_text rounded-[15px] px-[35px] py-[15px] "
						onClick={() => void navigate("/")}>
						+ Create design
					</button>
				</div>
			</div>
			<div className="font-noto bg-secondary_background rounded-[15px] mt-[40px] flex">
				<Collection name="dsf" />
			</div>
		</div>
	);
};

export { HomePage };
