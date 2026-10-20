import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { X, Camera, FlipHorizontal, ScanLine, Info } from 'lucide-react';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
  continuous?: boolean;
}

export const ScannerModal = ({ isOpen, onClose, onScan, continuous = false }: ScannerModalProps) => {
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [isMirrored, setIsMirrored] = useState<boolean>(() => {
    return localStorage.getItem('smartpos_scanner_mirror') === 'true';
  });

  const handleToggleMirror = () => {
    setIsMirrored(prev => {
      const next = !prev;
      localStorage.setItem('smartpos_scanner_mirror', String(next));
      return next;
    });
  };

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
        className="absolute inset-0 bg-black/60 transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal Content */}
      <div className="glass relative z-10 w-full max-w-md rounded-2xl animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden border border-white/20 shadow-2xl bg-white/40 dark:bg-black/40">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">Kamera Scanner</h2>
              <p className="text-xs text-muted-foreground">Arahkan barcode atau QR ke kotak fokus</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button 
              type="button"
              onClick={handleToggleMirror}
              title="Balik Tampilan Kamera (Cermin / Normal)"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isMirrored 
                  ? 'bg-primary text-white border-primary shadow-xs' 
                  : 'bg-white/40 dark:bg-white/10 text-foreground border-white/20 hover:bg-white/60'
              }`}
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>{isMirrored ? 'Mode Cermin' : 'Mode Normal'}</span>
            </button>
            <button 
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors text-foreground cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-5 space-y-3">
          <div className="bg-black/5 rounded-xl overflow-hidden relative border border-white/10">
            <div id="reader" className="w-full"></div>
            {/* CSS overrides for html5-qrcode UI with mirror support */}
            <style>{`
              #reader {
                border: none !important;
                border-radius: 0.75rem;
                overflow: hidden;
              }
              #reader video {
                transform: ${isMirrored ? 'scaleX(-1)' : 'scaleX(1)'} !important;
                transition: transform 0.25s ease;
                border-radius: 0.75rem;
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

          {/* Explanation Banner */}
          <div className="p-3 rounded-xl bg-white/30 dark:bg-black/30 border border-white/20 text-xs text-muted-foreground space-y-1.5">
            <div className="flex items-center gap-1.5 text-foreground font-semibold">
              <ScanLine className="w-4 h-4 text-primary" />
              <span>Status Pembacaan Barcode</span>
            </div>
            <p className="leading-relaxed">
              Kamera barcode mendukung pembacaan dua arah (*bidirectional*). Barcode dan QR code tetap dapat terdeteksi dengan cepat baik dalam <strong>Mode Normal</strong> maupun <strong>Mode Cermin</strong>.
            </p>
          </div>

          {continuous && (
            <p className="text-xs text-center text-muted-foreground">
              Mode scan berulang aktif. Arahkan barcode barang berikutnya ke kamera.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
