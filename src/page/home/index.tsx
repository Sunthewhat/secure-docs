import { useNavigate } from "react-router-dom";
import searchIcon from "../../asset/searchIcon.svg";
import { AllCertTypeResponse, CertType, DeleteCertResponse } from "@/types/response";
import { Axios } from "@/util/axiosInstance";
import { useEffect, useState } from "react";
import ShareModal from "@/components/modal/ShareModal";
import DeleteModal from "@/components/modal/DeleteModal";

const HomePage = () => {
  const navigate = useNavigate();
  const [certificateItem, setCertificateItem] = useState<CertType[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectingShareCert, setSelectingShareCert] = useState<CertType | null>(
    null
  );

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectingDeleteCert, setSelectingDeleteCert] =
    useState<CertType | null>(null);

  const handleSelectDeleteCert = (cert: CertType) => {
    setSelectingDeleteCert(cert);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setIsDeleteModalOpen(false);

    // TODO: call your API to delete
    const response = await Axios.delete<DeleteCertResponse>(
      `/certificate/${id}`
    );

    if (response.status !== 200) {
      alert(response.data.msg);
      return;
    }
    // Refresh list
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

  const fetchCerts = async () => {
    const response = await Axios.get<AllCertTypeResponse>("/certificate");

    if (response.status !== 200) {
      alert(response.data.data);
      return;
    }
    setCertificateItem(response.data.data);

    console.log(response.data.data);
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  return (
    <div className=" flex flex-col">
      {/*  div text search and button */}
      <div className="font-noto bg-secondary_background rounded-[15px] flex flex-row justify-between items-center w-full h-full px-[20px]">
        {/* div text  */}
        <div className="px-[25px] py-[50px]">
          <p className="font-bold text-lg w-fit">Collections</p>
        </div>
        {/*div search and button*/}
        <div className="px-[25px] py-[50px] flex flex-row">
          {/* div icon and search */}
          <div className="flex flex-row items-center">
            <img
              className="mr-[10px] w-[24px] h-[24px]"
              src={searchIcon}
              alt="searchIcon"
            />
            <input
              className="text-noto text-[14px] border-1 rounded-[7px] px-[20px] py-[15px] mr-[25px] w-[224px] h-[39px]"
              type="text"
              placeholder="Search designs..."
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
      {/* <div className="font-noto bg-secondary_background rounded-[15px] mt-[40px] flex">
				<Collection name="dsf" />
			</div> */}
      <div className="font-noto bg-secondary_background rounded-[15px] flex flex-col items-center w-full min-h-[770px] px-[20px] mt-[25px] py-[20px]">
        <div className="grid grid-cols-3 gap-[20px] w-full h-full">
          {certificateItem.map((cert, index) => (
            <div
              key={index}
              className="rounded-[10px] w-full aspect-square flex flex-col px-5 py-5 items-center"
            >
              <div className="bg-gray-300 w-full h-[237px] rounded-[10px]">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png?20210521171500"
                  alt="Description"
                  className="w-full h-full object-cover"
                />
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
