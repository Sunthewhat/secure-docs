import { FC, useState, useRef, useEffect, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth/useAuth";
import UserIcon from "@/asset/User.svg";
import EasyCertIcon from "@/asset/EasyCertLogo.svg";

interface PageTopBarProps {
	content?: ReactNode;
}

const TopBar: FC<{ pageTopBarProps?: PageTopBarProps | null }> = ({ pageTopBarProps }) => {
	const auth = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const isValidatePage = location.pathname.startsWith("/validate");

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div className="px-4 sm:px-6 md:px-10 2xl:px-30 h-20 flex flex-row justify-between items-center">
			{/* Left: Logo + nav */}
			<button className="flex justify-center items-center" onClick={() => void navigate("/")}>
				<img src={EasyCertIcon} alt="Logo" className="h-15" />
			</button>
			<div className={`flex-1 min-w-0 flex justify-end ${!isValidatePage ? "lg:pr-40" : ""}`}>
				{/* Middle: Page-specific content */}
				{pageTopBarProps?.content}
			</div>

			{/* Right: User dropdown */}
			{!isValidatePage && (
				<div className="relative flex justify-center z-50 shrink-0" ref={dropdownRef}>
					<button
						onClick={() => setIsDropdownOpen(!isDropdownOpen)}
						className="rounded-full border border-white/20 bg-black/40 p-1.5 transition-colors hover:bg-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
						aria-label="User menu"
					>
						<img src={UserIcon} className="h-8 w-8 sm:h-10 sm:w-10" alt="User" />
					</button>

					{isDropdownOpen && (
						<div className="absolute right-0 mt-16 w-48 bg-white rounded-lg shadow-lg py-2">
							{auth.user ? (
								<>
									<div className="px-4 py-2 border-b border-gray-200">
										<p className="text-sm font-semibold text-gray-800">
											{auth.user.username}
										</p>
									</div>
									<button
										onClick={() => {
											auth.signout(() => {
												void navigate("/");
											});
											setIsDropdownOpen(false);
										}}
										className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
									>
										Logout
									</button>
								</>
							) : (
								<button
									onClick={() => {
										void navigate("/login");
										setIsDropdownOpen(false);
									}}
									className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 transition-colors"
								>
									Log in
								</button>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export { TopBar };
