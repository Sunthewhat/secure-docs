import { useNavigate } from "react-router-dom";

const HomePage = () => {
	const navigate = useNavigate();
	return (
		<div className=" mx-">
			<div className="bg-component_bakcground rounded-[15px] flex flex-row justify-between ">
				<div className="px-[25px] py-[50px]">
					<p className="  w-fit text-secondary_text">Collection</p>
				</div>
				<div className="px-[25px] py-[50px]">
					<input type="text" />
					<button
						className="bg-primary_button text-secondary_text"
						onClick={() => void navigate("/")}>
						HI
					</button>
				</div>
			</div>
		</div>
	);
};

export { HomePage };
{
	/* <div className="bg-white w-full max-w-6xl rounded-lg shadow-sm p-6">
	<div className="flex justify-between items-center">
		<div className="relative">
			<h2 className="text-xl font-bold">Collections</h2>
			<div className="absolute -inset-1 border border-blue-400 border-dashed rounded-sm" />
		</div>

		<div className="flex items-center gap-4">
			<div className="relative">
				<Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
				<input
					type="text"
					placeholder="Search designs..."
					className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-1">
				<Plus className="w-4 h-4" />
				<span>Create Design</span>
			</button>
		</div>
	</div>
</div>; */
}
