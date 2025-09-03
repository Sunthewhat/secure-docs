import { useNavigate } from "react-router-dom";
import searchIcon from "../../asset/searchIcon.svg";
import {
  AllCertTypeResponse,
  CertType,
  DeleteCertResponse,
} from "@/types/response";
import { Axios } from "@/util/axiosInstance";
import { useEffect, useRef, useState } from "react";
import ShareModal from "@/components/modal/ShareModal";
import DeleteModal from "@/components/modal/DeleteModal";
import AiOutlineEllipsis from "../../asset/AiOutlineEllipsis.svg";

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

  const handleCreateDesign = () => {
    // Clear canvas cache from localStorage to ensure fresh canvas
    localStorage.removeItem("design-canvas-state");
    navigate("/design");
  };

  const handleSelectDeleteCert = (cert: CertType) => {
    setSelectingDeleteCert(cert);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setIsDeleteModalOpen(false);
    const response = await Axios.delete<DeleteCertResponse>(
      `/certificate/${id}`
    );
    if (response.status !== 200) {
      // alert(response.data.msg);
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
      // alert(response.data.data as unknown as string);
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
            onClick={handleCreateDesign}
          >
            + Create design
          </button>
        </div>
      </div>

      {/* grid */}
      <div className="font-noto bg-secondary_background rounded-[15px] flex flex-col items-center w-full min-h-[770px] px-[20px] mt-[25px] py-[20px]">
        <div className="grid grid-cols-3 gap-[20px] w-full h-full">
          {certificateItem.map((cert) => (
            <Card
              key={cert.id}
              cert={cert}
              onEdit={() => handleEdit(cert.id)}
              onDelete={() => handleSelectDeleteCert(cert)}
              onShare={() => handleSelectShareCert(cert)}
              onHistory={() => navigate(`/history/${cert.id}`)}
            />
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

function Card({
  cert,
  onEdit,
  onDelete,
  onShare,
  onHistory,
}: {
  cert: CertType;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  onHistory?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return;
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        btnRef.current &&
        !btnRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="rounded-[10px] w-full aspect-square flex flex-col px-5 py-5 items-center">
      {/* image wrapper with top-right kebab menu */}
      <div className="relative w-full h-[237px] rounded-[10px] overflow-hidden">
        <img
          src={
            cert.thumbnail_url != ""
              ? cert.thumbnail_url
              : "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png?20210521171500"
          }
          alt={`${cert.name} preview`}
          className="w-full h-full object-cover"
          onClick={onEdit}
          role="button"
          aria-label={`Open ${cert.name} editor`}
        />

        {/* kebab */}
        <button
          ref={btnRef}
          className="absolute top-2 right-2 rounded-full bg-gray-300 hover:bg-gray-400 text-white p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Open actions for ${cert.name}`}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
        >
          <img
            src={AiOutlineEllipsis}
            alt=""
            aria-hidden="true"
            className="w-5 h-5"
          />
        </button>

        {/* dropdown menu */}
        {open && (
          <div
            ref={menuRef}
            role="menu"
            aria-label="Card actions"
            className="absolute top-12 right-2 z-10 min-w-[160px] rounded-md bg-white shadow-lg ring-1 ring-black/5  dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem
              label="Edit"
              onSelect={() => {
                setOpen(false);
                onEdit();
              }}
            />
            <MenuItem
              label="Delete"
              variant="danger"
              onSelect={() => {
                setOpen(false);
                onDelete(); // opens your DeleteModal
              }}
            />
          </div>
        )}
      </div>

      <span className="mt-5 font-semibold text-[16px] text-center text-primary_text">
        {cert.name}
      </span>

      {/* History + Share buttons */}
      <div className="mt-[15px] flex flex-row gap-[10px] w-full">
        <button
          className="bg-secondary_button text-white text-sm py-3 rounded-[8px] w-full"
          onClick={onHistory}
        >
          History
        </button>
        <button
          className="bg-primary_button text-white text-sm py-3 rounded-[8px] w-full"
          onClick={onShare}
        >
          Share
        </button>
      </div>
    </div>
  );
}

function MenuItem({
  label,
  onSelect,
  variant,
}: {
  label: string;
  onSelect: () => void;
  variant?: "default" | "danger";
}) {
  const itemRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    itemRef.current?.focus();
  }, []);

  const base =
    "w-full flex items-center gap-2 px-3 py-2 text-left text-sm focus:outline-none bg-white rounded-md";
  const normalHover = " hover:bg-black/5 hover:bg-gray-200 text-black";
  const danger = " text-red-600 dark:text-red-400 hover:bg-red-100";

  return (
    <button
      ref={itemRef}
      role="menuitem"
      className={base + (variant === "danger" ? danger : normalHover)}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <span>{label}</span>
    </button>
  );
}

export { HomePage };
