import { useNavigate } from "react-router";
import { useLocation } from "react-router-dom";

interface Recipient {
	id: string;
	name: string;
	email: string;
}

interface LocationState {
	recipients?: Recipient[];
}
const SaveSendPage = () => {
	const location = useLocation() as { state: LocationState | null };
	const navigate = useNavigate();
	const recipients: Recipient[] = location.state?.recipients || [];
	console.log(recipients);
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
					Preview
				</button>
				{/* div text  */}
				<div className="absolute left-1/2 transform  -translate-x-1/2">
					<p className="font-semibold text-[32px] w-fit ">
						Save & Send
					</p>
				</div>
			</div>
			<div className="font-noto bg-secondary_background min-h-[777px] rounded-[15px] flex justify-start w-full h-full px-[40px] mt-[25px] py-[48px] ">
				<div className="flex flex-col w-full h-full px-[20px] ">
					<div className="overflow-y-scroll max-h-[600px]">
						<table className="w-full border border-gray-200 text-center text-sm table-fixed ">
						<thead>
							<tr className="bg-gray-100">
								<th className="font-normal px-6 py-2 border-r border-gray-200 w-1/2">
									Recipient Name
								</th>
								<th className="font-normal px-6 py-2 border-r border-gray-200 w-1/2 ">
									Recipient Email
								</th>
								<th className="font-normal px-6 py-2 w-1/2">
									School
								</th>
							</tr>
						</thead>
						<tbody>
							{recipients.map((recipient) => (
								<tr
									key={recipient.id}
									className="border border-gray-200">
									<td className="border-r border-gray-200 px-6 py-2 break-words">
										{recipient.name}
									</td>
									<td className="border-r border-gray-200 px-6 py-2 break-words">
										{recipient.email}
									</td>
									<td className="px-6 py-2 break-words">
										{recipient.email}
									</td>
								</tr>
							))}
						</tbody>
						</table>
					</div>
					<div className="flex flex-row mt-[50px] justify-center">
						<div className="w-1/2 flex justify-between">
							<button className="bg-primary_button text-white px-5 h-[40px] w-2/5 rounded-[7px] text-sm font-medium ">
								Download
							</button>
							<button className="bg-primary_button text-white px-5 h-[40px] w-2/5 rounded-[7px] text-sm font-medium ">
								Send to participants
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export { SaveSendPage };
