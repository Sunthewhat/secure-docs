import { FC, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";

const CertificateValidationScanPage: FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>("");
  const [scanResult, setScanResult] = useState<string>("");
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    // Initialize the QR code reader
    readerRef.current = new BrowserMultiFormatReader();

    return () => {
      // Cleanup
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, []);

  const extractParticipantIdFromUrl = (url: string): string | null => {
    try {
      // Parse the URL and extract participant ID from path like /validate/result/:participantId
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split("/");

      // Find the index of 'result' and get the next segment as participant ID
      const resultIndex = pathSegments.findIndex(
        (segment) => segment === "result"
      );
      if (resultIndex !== -1 && pathSegments[resultIndex + 1]) {
        return pathSegments[resultIndex + 1];
      }

      return null;
    } catch {
      return null;
    }
  };

  const startScanning = async () => {
    if (!readerRef.current || !videoRef.current) return;

    try {
      setIsScanning(true);
      setError("");
      setScanResult("");

      // Get available video input devices
      const videoInputDevices = await navigator.mediaDevices.enumerateDevices();
      const cameras = videoInputDevices.filter(
        (device) => device.kind === "videoinput"
      );

      if (cameras.length === 0) {
        throw new Error("No camera found");
      }

      // Use the first available camera (usually back camera on mobile)
      const selectedDeviceId = cameras[0].deviceId;

      // Start scanning
      await readerRef.current
        .decodeOnceFromVideoDevice(selectedDeviceId, videoRef.current)
        .then((result) => {
          const qrCodeText = result.getText();
          setScanResult(qrCodeText);

          // Extract participant ID from the scanned URL
          const participantId = extractParticipantIdFromUrl(qrCodeText);

          if (participantId) {
            // Navigate to the result page with the extracted participant ID
            navigate(`/validate/result/${participantId}`);
          } else {
            setError("Invalid QR code format. Expected a validation URL.");
          }
        })
        .catch((err) => {
          if (err instanceof NotFoundException) {
            setError("No QR code found. Please try again.");
          } else {
            setError(`Scanning error: ${err.message}`);
          }
        });
    } catch (err) {
      setError(
        `Camera error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    setIsScanning(false);
  };

  return (
    <div className="select-none cursor-default flex flex-col gap-12 text-white">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-4">
          <span className="text-sm uppercase tracking-[0.35em] text-white/60">Validation</span>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold sm:text-4xl">Scan QR Code</h1>
            <p className="max-w-2xl text-base text-white/70">Point your camera at a validation QR code to verify a certificate.</p>
          </div>
        </div>
      </header>

      <section className="rounded-[32px] border border-white/25 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:p-10">
        <div className="flex flex-col items-center gap-8">
          {/* Camera Preview */}
          <div className="relative w-full max-w-[420px] aspect-square rounded-3xl overflow-hidden border border-white/20 bg-black/60 shadow-xl">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <p className="text-white/90 text-base">Camera preview will appear here</p>
              </div>
            )}
            {/* Scanning overlay */}
            {isScanning && (
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-6 rounded-2xl border-2 border-white/70 animate-pulse" />
                <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white/90">
                  Scanning for QR code…
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="w-full max-w-[520px] grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-center">
            <button
              onClick={startScanning}
              disabled={isScanning}
              className={`inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-semibold shadow-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                isScanning
                  ? "cursor-not-allowed bg-white/20 text-white/60"
                  : "bg-primary_button text-white hover:scale-[1.01]"
              } w-full sm:w-auto`}
              aria-label="Start scanning QR"
              aria-disabled={isScanning}
            >
              {isScanning ? "Scanning…" : "Start scan"}
            </button>
            <button
              onClick={stopScanning}
              disabled={!isScanning}
              className={`inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-semibold shadow-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                !isScanning
                  ? "cursor-not-allowed bg-white/20 text-white/60"
                  : "bg-white/90 text-primary_text hover:bg-white"
              } w-full sm:w-auto`}
              aria-label="Stop scanning"
              aria-disabled={!isScanning}
            >
              Stop
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="w-full max-w-[520px] rounded-2xl border border-red-300/40 bg-red-500/10 px-5 py-4 text-red-200">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Scan Result (debug info) */}
          {scanResult && (
            <div className="w-full max-w-[520px] rounded-2xl border border-white/20 bg-white/95 px-5 py-4 text-primary_text shadow-xl">
              <p className="text-sm font-semibold">Scanned URL</p>
              <p className="text-sm break-all opacity-80">{scanResult}</p>
            </div>
          )}

          {/* Tips */}
          <div className="w-full max-w-[520px] rounded-3xl border border-white/20 bg-white/95 p-6 text-primary_text shadow-xl">
            <h3 className="text-base font-bold mb-3 text-center">How to scan</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Allow camera access when prompted.</li>
              <li>• Center the QR code within the square frame.</li>
              <li>• Hold steady for a moment while it detects.</li>
              <li>• You’ll be redirected to the validation result.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export { CertificateValidationScanPage };
