import { Layout } from "@/components/shared/layout/mainLayout";
import { RequireAuth } from "@/components/shared/requiredAuth";
import { DesignPage } from "@/page/design";
import { HistoryPage } from "@/page/history";
import { HomePage } from "@/page/home";
import { LoginPage } from "@/page/login";
import { SharePage } from "@/page/share";
import { PreviewPage } from "@/page/preview";
import { SaveSendPage } from "@/page/send";
import SignaturePage from "@/page/signature";
import { CertificateValidationResultPage } from "@/page/validate/result";
import { CertificateValidationScanPage } from "@/page/validate/scan";
import { FC } from "react";
import { Routes, Route } from "react-router";

const RouterProvider: FC = () => {
	return (
		<Routes>
			<Route path="/login" element={<LoginPage />} />
			<Route element={<Layout />}>
				{/* Public Routes under layout */}
				<Route path="/validate">
					<Route path="result/:participantId" element={<CertificateValidationResultPage />} />
					<Route path="scan" element={<CertificateValidationScanPage />} />
				</Route>
				{/* Public Routes */}
				{/* <Route path='/' element={<HomePage />} /> */}

				{/* Protected Routes */}
				<Route
					path="/"
					element={
						<RequireAuth>
							<HomePage />
						</RequireAuth>
					}
				/>
				<Route
					path="/design/:certId"
					element={
						<RequireAuth>
							<DesignPage />
						</RequireAuth>
					}
				/>
				<Route
					path="/share/:certId"
					element={
						<RequireAuth>
							<SharePage />
						</RequireAuth>
					}
				/>
				<Route
					path="/preview/:certId"
					element={
						<RequireAuth>
							<PreviewPage />
						</RequireAuth>
					}
				/>
				<Route
					path="/send/:certId"
					element={
						<RequireAuth>
							<SaveSendPage />
						</RequireAuth>
					}
				/>
				<Route
					path="/history/:certId"
					element={
						<RequireAuth>
							<HistoryPage />
						</RequireAuth>
					}
				/>

				<Route
					path="/signature/:certificateId"
					element={
						<RequireAuth>
							<SignaturePage />
						</RequireAuth>
					}
				/>

				{/* Fallback for undefined routes */}
				<Route path="*" element={<p>There's nothing here!</p>} />
			</Route>
		</Routes>
	);
};

export { RouterProvider };
