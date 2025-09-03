import { ToastContextType } from '@/components/toast/ToastContext';
import { Axios } from '@/util/axiosInstance';
import { NavigateFunction } from 'react-router';
import * as fabric from 'fabric';

export const handleSaveCertificateUtil = async (
	certificateName: string,
	canvasRef: React.RefObject<fabric.Canvas | null>,
	isEditing: boolean,
	certificateId: string | null,
	navigate: NavigateFunction,
	clearLocalStorage: () => void,
	toast: ToastContextType
) => {
	if (!certificateName.trim()) {
		toast.error('Please enter a certificate name'); // ✅
		return;
	}

	if (!canvasRef.current) {
		toast.error('Canvas not ready'); // ✅
		return;
	}

	try {
		const canvas = canvasRef.current;

		const fabricDesign = canvas.toJSON();

		const payload = {
			name: certificateName,
			design: JSON.stringify(fabricDesign),
		};

		let response;
		if (isEditing && certificateId) {
			response = await Axios.put(`/certificate/${certificateId}`, payload);
		} else {
			response = await Axios.post('/certificate', payload);
			console.log(response.data.data.id);
		}

		if (response.status === 200) {
			// Clear local storage when successfully saved
			if (!isEditing) {
				clearLocalStorage();
				// Redirect to edit mode after first save
				const newCertId = response.data.data.id;
				toast.success('Certificate saved successfully!'); // ✅
				void navigate(`/design/${newCertId}/edit`, {
					replace: true,
				});
			} else {
				toast.success('Certificate updated successfully!'); // ✅
			}
		} else {
			toast.error(response.data?.msg || 'Failed to save certificate'); // ✅
		}
	} catch (error) {
		console.error('Save failed:', error);
		toast.error('Failed to save certificate. Please try again.'); // ✅
	}
};
