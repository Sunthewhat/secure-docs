import { FC, useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router";
import * as fabric from "fabric";
import { getParticipantData } from "@/api/participant/validation";
import { ValidateParticipantData } from "@/types/response";
import { IoDocumentTextOutline } from "react-icons/io5";

const CertificateValidationResultPage: FC = () => {
  const participantId = useParams()["participantId"] ?? "";

  const canvasRef = useRef<fabric.Canvas | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingError, setLoadingError] = useState<string>("");
  const [participantData, setParticipantData] =
    useState<ValidateParticipantData | null>(null);

  const fetchData = async () => {
    const response = await getParticipantData(participantId);

    if (response.success) {
      setParticipantData(response.data);
    } else {
      setLoadingError(response.msg);
    }
    setIsLoading(false);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setLoadingError("");
    fetchData();
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateCanvasWithData = (participantData: ValidateParticipantData) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const objects = canvas.getObjects();

    objects.forEach((obj) => {
      if (obj.isAnchor && obj.id && obj.type === "textbox") {
        const textbox = obj as fabric.Textbox;
        const colName = obj.id.replace("PLACEHOLDER-", "");
        const fieldValue = participantData.participant.data[colName];
        if (fieldValue) {
          textbox.set("text", fieldValue);
        }
      }
    });

    canvas.renderAll();
  };

  const resizeCanvas = useCallback(() => {
    if (!canvasRef.current || !participantData?.certificate?.design) return;

    const containerElement = document.getElementById("certificate-preview");
    if (!containerElement) return;

    const containerRect = containerElement.getBoundingClientRect();
    const newWidth = containerRect.width;
    const newHeight = containerRect.height;

    if (newWidth <= 0 || newHeight <= 0) return;

    const canvas = canvasRef.current;

    // Store original design dimensions
    const designData = JSON.parse(participantData.certificate.design);
    const originalWidth = designData.width || 800;
    const originalHeight = designData.height || 600;

    // Calculate scale to fit the design in the current container
    const scaleX = newWidth / originalWidth;
    const scaleY = newHeight / originalHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

    // Resize canvas
    canvas.setDimensions({ width: newWidth, height: newHeight });

    // Reload and scale the certificate design
    canvas.loadFromJSON(designData).then(() => {
      canvas.getObjects().forEach((obj) => {
        obj.set({
          left: (obj.left || 0) * scale,
          top: (obj.top || 0) * scale,
          scaleX: (obj.scaleX || 1) * scale,
          scaleY: (obj.scaleY || 1) * scale,
          selectable: false,
          evented: false,
        });
      });

      canvas.renderAll();

      // Re-apply participant data
      if (participantData) {
        setTimeout(() => {
          updateCanvasWithData(participantData);
        }, 100);
      }
    });
  }, [participantData]);

  // Initialize canvas and render certificate design
  useEffect(() => {
    if (!participantData?.certificate?.design) {
      return;
    }

    // Cleanup existing canvas first
    if (canvasRef.current) {
      canvasRef.current.dispose();
      canvasRef.current = null;
    }

    // Use setTimeout to ensure DOM is ready
    const initCanvas = () => {
      const canvasElement = document.getElementById(
        "validation-canvas"
      ) as HTMLCanvasElement;
      const containerElement = document.getElementById("certificate-preview");

      if (!canvasElement || !containerElement) {
        setTimeout(initCanvas, 100);
        return;
      }

      // Check if canvas is already initialized
      if (canvasRef.current) {
        return;
      }

      // Get container dimensions
      const containerRect = containerElement.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // Use container dimensions to fit properly
      const canvasWidth = containerWidth;
      const canvasHeight = containerHeight;

      // Initialize Fabric canvas
      const canvas = new fabric.Canvas(canvasElement, {
        width: canvasWidth,
        height: canvasHeight,
        selection: false, // Disable selection in validation mode
      });

      // Set canvas element CSS to fit container
      canvasElement.style.maxWidth = "100%";
      canvasElement.style.maxHeight = "100%";
      canvasElement.style.width = "auto";
      canvasElement.style.height = "auto";

      canvasRef.current = canvas;

      // Load and render the certificate design
      try {
        const designData = JSON.parse(participantData.certificate.design);

        canvas
          .loadFromJSON(designData)
          .then(() => {
            // Scale down the entire canvas content to fit validation view
            const objects = canvas.getObjects();
            if (objects.length > 0) {
              // Calculate scale to fit the design in the validation canvas
              const originalWidth = designData.width || 800;
              const originalHeight = designData.height || 600;
              const scaleX = canvasWidth / originalWidth;
              const scaleY = canvasHeight / originalHeight;
              const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

              // Apply scale to all objects
              objects.forEach((obj) => {
                obj.set({
                  left: (obj.left || 0) * scale,
                  top: (obj.top || 0) * scale,
                  scaleX: (obj.scaleX || 1) * scale,
                  scaleY: (obj.scaleY || 1) * scale,
                  selectable: false,
                  evented: false,
                });
              });
            } else {
              // Disable all object interactions for validation view
              canvas.getObjects().forEach((obj) => {
                obj.set({
                  selectable: false,
                  evented: false,
                });
              });
            }

            canvas.renderAll();

            // Apply participant data
            setTimeout(() => {
              updateCanvasWithData(participantData);
            }, 100);
          })
          .catch((error) => {
            console.error("Error loading certificate design:", error);
          });
      } catch (error) {
        console.error("Error parsing certificate design:", error);
      }
    };

    // Start initialization
    setTimeout(initCanvas, 100);

    // Cleanup function
    return () => {
      if (canvasRef.current) {
        canvasRef.current.dispose();
        canvasRef.current = null;
      }
    };
  }, [participantData]);

  // Add resize observer to handle responsive canvas sizing
  useEffect(() => {
    const containerElement = document.getElementById("certificate-preview");
    if (!containerElement) return;

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });

    resizeObserver.observe(containerElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [participantData, resizeCanvas]);

  if (isLoading) {
    return (
      <div className="select-none cursor-default">
        <div className="font-noto bg-secondary_background rounded-[15px] flex flex-row items-center w-full h-[72px] mt-[24px] px-[20px]">
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <p className="font-semibold text-[32px] w-fit">
              Certificate Validation
            </p>
          </div>
        </div>
        <div className="font-noto bg-secondary_background min-h-[777px] rounded-[15px] flex justify-center items-center w-full h-full px-[40px] mt-[25px] pb-[48px] pt-[0px]">
          <p className="text-gray-600">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (!isLoading && loadingError !== "") {
    return (
      <div className="select-none cursor-default">
        <div className="font-noto bg-secondary_background rounded-[15px] flex flex-row items-center w-full h-[72px] px-[20px] ">
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <p className="font-semibold text-[32px] w-fit">
              Certificate Validation
            </p>
          </div>
        </div>
        <div className="font-noto bg-secondary_background min-h-[777px] rounded-[15px] flex flex-col justify-center items-center w-full h-full px-[40px] mt-[25px] py-[48px]">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Failed to load
          </h1>
          <h2 className="text-lg text-gray-700 mb-6">{loadingError}</h2>
          <button
            className="bg-primary_button text-white px-6 py-3 rounded-[7px] text-sm font-medium hover:bg-opacity-90"
            onClick={handleRefresh}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="select-none cursor-default">
      <div className="bg-black px-6 h-20 flex flex-row justify-between">
        <div className="flex flex-row items-center gap-2">
          <IoDocumentTextOutline size={30} className="text-white" />
          <h1 className="text-2xl font-bold text-white font-adlam cursor-pointer text-[25px]">
            EasyCert
          </h1>
        </div>
      </div>
      <div className="font-noto bg-secondary_background rounded-[15px] flex flex-row items-center w-full h-[72px] px-[20px] mt-[24px]">
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <p className="font-semibold text-[32px] w-fit">
            Certificate Validation
          </p>
        </div>
      </div>
      <div className="font-noto bg-secondary_background min-h-[777px] rounded-[15px] flex justify-center items-center w-full h-full px-[40px] pb-[48px]">
        {participantData ? (
          <div className="flex flex-col items-center w-full max-w-4xl">
            {/* Certificate Display */}
            <div className="border-4 border-black p-2 aspect-[297/210] w-full max-w-[600px] mb-8">
              <div
                id="certificate-preview"
                className="w-full h-full bg-white relative"
              >
                <canvas
                  id="validation-canvas"
                  className="w-full h-full object-contain"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                  }}
                />
              </div>
            </div>

            {/* Participant Information */}
            <div className="bg-white rounded-[15px] p-6 w-full max-w-[600px] shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-center">
                Participant Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(participantData.participant.data).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between items-center border-b border-gray-200 pb-2"
                    >
                      <span className="font-medium text-gray-700 capitalize">
                        {key}:
                      </span>
                      <span className="text-gray-900">{value}</span>
                    </div>
                  )
                )}
              </div>
              <div className="mt-4 flex justify-between items-center">
                <span className="font-medium text-gray-700">Status :</span>
                <span
                  className={
                    participantData.participant.is_revoked
                      ? "text-red-400"
                      : "text-green-400"
                  }
                >
                  {participantData.participant.is_revoked
                    ? "This certificate has been revoked"
                    : "This certificate is valid"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-600">No certificate data found</div>
        )}
      </div>
    </div>
  );
};

export { CertificateValidationResultPage };
