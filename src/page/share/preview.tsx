import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Axios } from "@/util/axiosInstance";

interface Recipient {
	id: string;
	certificate_id: string;
	is_revoked: boolean;
	created_at: string;
	updated_at: string;
	data: {
		[key: string]: string; // dynamic columns
	};
}

const PreviewPage = () => {
	const navigate = useNavigate();
	const { certId } = useParams<{ certId: string }>();
	const [recipients, setRecipients] = useState<Recipient[]>([]);
	const [columns, setColumns] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);

	// Fetch participants data from API
	useEffect(() => {
		const fetchParticipants = async () => {
			if (!certId) return;

			try {
				setLoading(true);
				const response = await Axios.get(`/participant/${certId}`);
				if (response.status === 200) {
					setRecipients(response.data);
					// Extract column names from first recipient's data object if data exists
					if (response.data.length > 0 && response.data[0].data) {
						setColumns(Object.keys(response.data[0].data));
					}
				} else {
					console.error("Failed to fetch participants");
				}
			} catch (error) {
				console.error("Error fetching participants:", error);
			} finally {
				setLoading(false);
			}
		};

		void fetchParticipants();
	}, [certId]);

	// Function to handle sending data to next page via navigation state
	const handleSend = () => {
		//TODO
		setRecipients(recipients);
		// Pass recipients data to the next page via navigate state
		void navigate("/share/preview/send", { state: { recipients } });
	};
	const handleEdit = () => {
		// Pass edit mode and certificate ID to design page
		void navigate(`/design/${certId}/edit`);
	};

	return (
		<div className="select-none cursor-default">
			<div className="font-noto bg-secondary_background rounded-[15px] flex  flex-row items-center w-full h-[72px] px-[20px]">
				{/* back button */}
				<button
					className="text-noto text-[14px] bg-white text-primary_text rounded-[7px] w-[120px] h-[39px] flex justify-center items-center  underline "
					onClick={() => void navigate(-1)}>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="currentColor">
						<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
					</svg>
					Edit Recipients
				</button>
				{/* div text  */}
				<div className="absolute left-1/2 transform  -translate-x-1/2">
					<p className="font-semibold text-[32px] w-fit ">Preview</p>
				</div>
				{/*div button*/}
				<div className="ml-auto">
					<button
						className="text-noto text-[14px] bg-primary_button text-secondary_text rounded-[7px] w-[92px] h-[39px] flex justify-center items-center "
						onClick={handleSend}>
						Send
					</button>
				</div>
			</div>
			<div className="font-noto bg-secondary_background min-h-[777px] rounded-[15px] flex justify-start w-full h-full px-[40px] mt-[25px] py-[48px] ">
				<div className="flex flex-col xl:flex-row w-full h-full">
					<div className="flex flex-col w-full xl:w-3/7 flex-shrink-0 items-start">
						<div className=" border-4 border-black p-2 aspect-[297/210] w-full xl:max-w-[500px] max-w-full">
							<img
								src={
									"https://marketplace.canva.com/EAFlVDzb7sA/3/0/1600w/canva-white-gold-elegant-modern-certificate-of-participation-Qn4Rei141MM.jpg"
									//TODO
								}
								alt="Description"
								className="w-full h-full object-cover"
							/>
						</div>

						{/* Edit Design Button */}
						<div className="mt-5 flex flex-row justify-between items-center w-full xl:max-w-[500px] max-w-full">
							<button
								className="bg-primary_button text-white px-5 h-[40px] rounded-[7px] text-sm font-medium "
								onClick={handleEdit}>
								Edit Design
							</button>
							{/* Navigation arrows */}
							<div className="flex justify-center gap-2">
								<button className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-400">
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="currentColor">
										<path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
									</svg>
								</button>
								<button className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-400">
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="currentColor">
										<path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
									</svg>
								</button>
							</div>
						</div>
					</div>

					{/* Recipients Table */}
					<div className="w-full xl:w-4/7 pl-0 xl:pl-[20px] mt-8 xl:mt-0 flex-shrink-0 overflow-hidden">
						<div className="overflow-y-scroll max-h-[600px]">
							<table className="w-full border border-gray-200 text-center text-sm table-fixed">
								<thead>
									<tr className="bg-gray-100">
										{columns.map((col, index) => (
											<th
												key={index}
												className={`font-normal px-6 py-2 ${
													index < columns.length - 1
														? "border-r border-gray-200"
														: ""
												}`}>
												{col}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{loading ? (
										<tr>
											<td
												colSpan={columns.length}
												className="px-6 py-8 text-gray-500">
												Loading participants...
											</td>
										</tr>
									) : recipients.length > 0 ? (
										recipients.map((recipient) => (
											<tr
												key={recipient.id}
												className="border border-gray-200">
												{columns.map((col, index) => (
													<td
														key={index}
														className={`px-6 py-2 break-words ${
															index <
															columns.length - 1
																? "border-r border-gray-200"
																: ""
														}`}>
														{recipient.data[col] ||
															""}
													</td>
												))}
											</tr>
										))
									) : (
										<tr>
											<td
												colSpan={columns.length || 1}
												className="px-6 py-8 text-gray-500">
												No participants found
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export { PreviewPage };
