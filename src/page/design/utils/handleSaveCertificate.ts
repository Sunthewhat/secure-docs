import { ToastContextType } from "@/components/toast/ToastContext";
import { Axios } from "@/util/axiosInstance";
import * as fabric from "fabric";

export const handleSaveCertificateUtil = async (
	certificateName: string,
	canvasRef: React.RefObject<fabric.Canvas | null>,
	certificateId: string | null,
	toast: ToastContextType
): Promise<string | null> => {
	if (!certificateName.trim()) {
		toast.error("Please enter a certificate name"); // ✅
		return null;
	}

	if (!canvasRef.current) {
		toast.error("Canvas not ready"); // ✅
		return null;
	}

	if (!certificateId) {
		toast.error("No certificate ID provided for update");
		return null;
	}

	try {
		const canvas = canvasRef.current;

		const fabricDesign = canvas.toJSON();

		const payload = {
			name: certificateName,
			design: JSON.stringify(fabricDesign),
		};

		const response = await Axios.put(
			`/certificate/${certificateId}`,
			payload
		);

		if (response.status === 200) {
			toast.success("Certificate saved successfully!");
			return response.data?.data?.updated_at || null;
		} else {
			toast.error(response.data?.msg || "Failed to save certificate"); // ✅
			return null;
		}
	} catch (error) {
		console.error("Save failed:", error);
		toast.error("Failed to save certificate. Please try again."); // ✅
		return null;
	}
};
