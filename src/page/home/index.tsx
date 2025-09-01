import { useNavigate } from "react-router-dom";
import searchIcon from "../../asset/searchIcon.svg";
import {
	AllCertTypeResponse,
	CertType,
	DeleteCertResponse,
} from "@/types/response";
import { Axios } from "@/util/axiosInstance";
import { useEffect, useState } from "react";
import ShareModal from "@/components/modal/ShareModal";
import DeleteModal from "@/components/modal/DeleteModal";
import { RiEdit2Line } from "react-icons/ri";

const HomePage = () => {
  const navigate = useNavigate();
  const [certificateItem, setCertificateItem] = useState<CertType[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectingShareCert, setSelectingShareCert] = useState<CertType | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectingDeleteCert, setSelectingDeleteCert] = useState<CertType | null>(null);

	const handleSelectDeleteCert = (cert: CertType) => {
		setSelectingDeleteCert(cert);
		setIsDeleteModalOpen(true);
	};

	const handleDelete = async (id: string) => {
		setIsDeleteModalOpen(false);

    const response = await Axios.delete<DeleteCertResponse>(`/certificate/${id}`);

    if (response.status !== 200) {
      alert(response.data.msg);
      return;
    }
    fetchCerts();
  };

	const handleSelectShareCert = (cert: CertType) => {
		setSelectingShareCert(cert);
		setIsShareModalOpen(true);
	};

  const handleShare = (certId: string) => {
    setIsShareModalOpen(false);
    navigate(`/share/${certId}`);
  };

  const handleEdit = (certId: string) => {
    navigate(`/design/${certId}/edit`);
  };

	const fetchCerts = async () => {
		const response = await Axios.get<AllCertTypeResponse>("/certificate");

    if (response.status !== 200) {
      alert(response.data.data as unknown as string);
      return;
    }
    setCertificateItem(response.data.data);
  };

	useEffect(() => {
		fetchCerts();
	}, []);

  return (
    <div className="flex flex-col">
      {/* top bar */}
      <div className="font-noto bg-secondary_background rounded-[15px] flex flex-row justify-between items-center w-full h-full px-[20px]">
        <div className="px-[25px] py-[50px]">
          <p className="font-bold text-lg w-fit">Collections</p>
        </div>

        <div className="px-[25px] py-[50px] flex flex-row">
          <div className="flex flex-row items-center">
            <img className="mr-[10px] w-[24px] h-[24px]" src={searchIcon} alt="searchIcon" />
            <input
              className="text-noto text-[14px] border-1 rounded-[7px] px-[20px] py-[15px] mr-[25px] w-[224px] h-[39px]"
              type="text"
              placeholder="Search designs..."
              // (optional) wire up search state here
            />
          </div>
          <button
            className="text-noto text-[14px] bg-primary_button text-secondary_text rounded-[7px] w-[185px] h-[39px] flex justify-center items-center"
            onClick={() => void navigate("/design")}
          >
            + Create design
          </button>
        </div>
      </div>

      {/* grid */}
      <div className="font-noto bg-secondary_background rounded-[15px] flex flex-col items-center w-full min-h-[770px] px-[20px] mt-[25px] py-[20px]">
        <div className="grid grid-cols-3 gap-[20px] w-full h-full">
          {certificateItem.map((cert) => (
            <div key={cert.id} className="rounded-[10px] w-full aspect-square flex flex-col px-5 py-5 items-center">
              {/* image wrapper with hover overlay */}
              <div
                className="relative group w-full h-[237px] rounded-[10px] overflow-hidden cursor-pointer"
                onClick={() => handleEdit(cert.id)}
                role="button"
                aria-label={`Edit ${cert.name}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleEdit(cert.id);
                  }
                }}
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png?20210521171500"
                  alt={`${cert.name} preview`}
                  className="w-full h-full object-cover"
                />
                {/* overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-white">
                    <RiEdit2Line className="text-3xl" aria-hidden="true" />
                    <span className="font-medium">Edit</span>
                  </div>
                </div>
              </div>

              <span className="mt-5 font-semibold text-[16px] text-center text-primary_text">
                {cert.name}
              </span>

              <div className="mt-[15px] flex flex-row gap-[10px] w-full">
                <button
                  className="bg-secondary_button text-white text-sm py-3 rounded-[8px] w-full"
                  onClick={() => handleSelectDeleteCert(cert)}
                >
                  Delete
                </button>
                <button
                  className="bg-primary_button text-white text-sm py-3 rounded-[8px] w-full"
                  onClick={() => handleSelectShareCert(cert)}
                >
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DeleteModal
        open={isDeleteModalOpen}
        cert={selectingDeleteCert}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />

			<ShareModal
				open={isShareModalOpen}
				cert={selectingShareCert}
				onClose={() => setIsShareModalOpen(false)}
				onConfirm={handleShare}
			/>
		</div>
	);
};

export { HomePage };
