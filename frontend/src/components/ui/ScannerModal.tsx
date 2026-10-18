import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
  continuous?: boolean;
}

export const ScannerModal = ({ isOpen, onClose, onScan, continuous = false }: ScannerModalProps) => {
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the DOM element exists
      const timer = setTimeout(() => {
        const html5QrcodeScanner = new Html5QrcodeScanner(
          "reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            rememberLastUsedCamera: true
          },
          /* verbose= */ false
        );

        html5QrcodeScanner.render(
          (decodedText) => {
            onScan(decodedText);
            if (!continuous) {
              html5QrcodeScanner.clear().catch(console.error);
              onClose();
            }
          },
          (error) => {
            // Ignore normal errors like "No barcode found in this frame"
          }
        );

        setScanner(html5QrcodeScanner);
      }, 100);

      return () => {
        clearTimeout(timer);
      };
    } else {
      if (scanner) {
        scanner.clear().catch(console.error);
        setScanner(null);
      }
    }
  }, [isOpen]);

  // Clean up on unmount just in case
  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [scanner]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (scanner) {
      scanner.clear().catch(console.error);
      setScanner(null);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60  transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal Content */}
      <div className="glass relative z-10 w-full max-w-md rounded-2xl animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden border border-white/20 shadow-2xl bg-white/40 dark:bg-black/40">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Kamera Scanner
          </h2>
          <button 
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-2 sm:p-4">
          <div className="bg-black/5 rounded-xl overflow-hidden relative">
            <div id="reader" className="w-full"></div>
            {/* Some CSS overrides for html5-qrcode UI */}
            <style>{`
              #reader {
                border: none !important;
                border-radius: 0.75rem;
                overflow: hidden;
              }
              #reader__scan_region {
                background: rgba(0,0,0,0.05);
              }
              #reader__dashboard_section_csr span, 
              #reader__dashboard_section_swaplink {
                color: var(--color-foreground) !important;
                font-size: 0.875rem;
              }
              #html5-qrcode-button-camera-permission,
              #html5-qrcode-button-camera-start,
              #html5-qrcode-button-camera-stop {
                background-color: var(--color-primary);
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 0.5rem;
                font-weight: 500;
                margin-top: 0.5rem;
                cursor: pointer;
                transition: opacity 0.2s;
              }
              #html5-qrcode-button-camera-permission:hover,
              #html5-qrcode-button-camera-start:hover,
              #html5-qrcode-button-camera-stop:hover {
                opacity: 0.9;
              }
            `}</style>
          </div>
          {continuous && (
            <p className="text-sm text-center text-muted-foreground mt-4">
              Mode Continuous aktif. Arahkan *barcode* ke kamera satu per satu.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
