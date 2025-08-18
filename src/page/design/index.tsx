// import { useAuth } from "@/context/authContext";
import { useState } from "react";
import { useNavigate } from "react-router";
import CanvasArea from "@/components/design/CanvasArea";
import ToolsSidebar from "@/components/design/ToolsSidebar";

const DesignPage = () => {
	// const auth = useAuth();
	const navigate = useNavigate();
	const [certificateName, setCertificateName] = useState("");
	const [activeMenu, setActiveMenu] = useState<
		"background" | "element" | "text" | null
	>("element");
	const handleShare = () => {
		// Implement share functionality
		void navigate("/share");
	};
	const handleSaveDraft = () => {
		// Implement save functionality
	};

	const handleShapeAdd = (shapeType: string) => {
		console.log('Shape clicked:', shapeType);
	};

	const handleTextAdd = (textType: string) => {
		console.log('Text clicked:', textType);
	};
	return (
		<div className="select-none cursor-default">
			<div className="font-noto bg-secondary_background rounded-[15px] flex  flex-row items-center w-full h-[72px] px-[20px]">
				{/* div text  */}
				<div className=" pl-[10px]">
					<p className="font-semibold text-[25px] w-fit ">
						Certificate canva
					</p>
				</div>
				{/*div button*/}
				<div className="flex flex-row items-center ml-auto gap-3">
					{/* form here */}
					<input
						type="text"
						value={certificateName}
						onChange={(e) => setCertificateName(e.target.value)}
						placeholder="Enter certificate name"
						className="font-noto text-[14px] px-3 py-2 border border-gray-300 rounded-[7px] w-[200px] h-[39px] focus:outline-none focus:border-blue-500"
					/>
					<button
						className="text-noto text-[14px] bg-primary_button text-secondary_text rounded-[7px] w-[92px] h-[39px] flex justify-center items-center "
						onClick={handleSaveDraft}>
						Save draft
					</button>
					<button
						className="text-noto text-[14px] bg-primary_button text-secondary_text rounded-[7px] w-[92px] h-[39px] flex justify-center items-center "
						onClick={handleShare}>
						Share
					</button>
				</div>
			</div>
			{/* Main content area */}
			<div className="font-noto bg-secondary_background min-h-[777px] rounded-[15px] flex justify-start w-full h-full pl-[10px] mt-[25px] py-[30px] ">
				<ToolsSidebar
					activeMenu={activeMenu}
					setActiveMenu={setActiveMenu}
					onShapeAdd={handleShapeAdd}
					onTextAdd={handleTextAdd}
				/>
				<CanvasArea />
			</div>
		</div>
	);
};

export { DesignPage };
