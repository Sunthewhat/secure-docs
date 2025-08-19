import { useState } from "react";
import { useNavigate } from "react-router";

interface Recipient {
	id: string;
	name: string;
	email: string;
}

const PreviewPage = () => {
	const navigate = useNavigate();
	const [recipients, setRecipients] = useState<Recipient[]>([
		{
			id: "1",
			name: "Thawatchai Wongboonsiri",
			email: "thawatchai.wongb@mail.kmutt.ac.th",
		},
		{
			id: "2",
			name: "John Doe",
			email: "john.doe@mail.kmutt.ac.th",
		},
		{
			id: "3",
			name: "Jane Smith",
			email: "jane.smith@mail.kmutt.ac.th",
		},
	]);

	// Function to handle sending data to next page via navigation state
	const handleSend = () => {
		//TODO
		setRecipients(recipients);
		// Pass recipients data to the next page via navigate state
		void navigate("/share/preview/send", { state: { recipients } });
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
						<div className=" border-4 border-black p-2 aspect-[4/3] w-full xl:max-w-[500px] max-w-full">
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
							<button className="bg-primary_button text-white px-5 h-[40px] rounded-[7px] text-sm font-medium ">
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
										<th className="font-normal px-6 py-2 border-r border-gray-200 w-1/2">
											Recipient Name
										</th>
										<th className="font-normal px-6 py-2 w-1/2">
											Recipient Email
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
											<td className="px-6 py-2 break-words">
												{recipient.email}
											</td>
										</tr>
									))}
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
