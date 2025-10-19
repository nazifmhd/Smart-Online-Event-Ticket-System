import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from 'react-query';
import { ticketsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  QrCode, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader,
  Camera,
  CameraOff
} from 'lucide-react';

const QRScanner = ({ onScan, onClose, isOpen = false }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const verifyTicketMutation = useMutation(ticketsAPI.verifyTicket, {
    onSuccess: (data) => {
      toast.success('Ticket verified successfully!');
      setScannedData(data);
      onScan(data);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ticket verification failed');
      setError(error.response?.data?.message || 'Verification failed');
    }
  });

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setHasPermission(true);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Camera access denied. Please allow camera access to scan QR codes.');
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScan = (data) => {
    if (data && data !== scannedData) {
      setScannedData(data);
      verifyTicketMutation.mutate(data);
    }
  };

  const handleError = (err) => {
    console.error('QR Scanner error:', err);
    setError('Failed to scan QR code. Please try again.');
  };

  const resetScanner = () => {
    setScannedData(null);
    setError(null);
    setIsScanning(true);
  };

  const closeScanner = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <QrCode className="w-5 h-5 mr-2" />
              QR Code Scanner
            </h3>
            <button
              onClick={closeScanner}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {/* Camera Permission Status */}
          {hasPermission === false && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <CameraOff className="w-5 h-5 text-red-600 mr-2" />
                <h4 className="font-medium text-red-800">Camera Access Denied</h4>
              </div>
              <p className="text-sm text-red-700 mt-2">
                Please allow camera access to scan QR codes. You can enable it in your browser settings.
              </p>
              <button
                onClick={startCamera}
                className="btn-primary mt-3 text-sm"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <h4 className="font-medium text-red-800">Scan Error</h4>
              </div>
              <p className="text-sm text-red-700 mt-2">{error}</p>
              <button
                onClick={resetScanner}
                className="btn-secondary mt-3 text-sm"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Scanner Status */}
          {isScanning && !error && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <Camera className="w-5 h-5 text-blue-600 mr-2" />
                <h4 className="font-medium text-blue-800">Scanning...</h4>
              </div>
              <p className="text-sm text-blue-700 mt-2">
                Point your camera at the QR code to scan
              </p>
            </div>
          )}

          {/* Video Element */}
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-64 bg-gray-100 rounded-lg object-cover"
              playsInline
              muted
            />
            
            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-blue-500 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500 rounded-br-lg"></div>
                </div>
              </div>
            )}
          </div>

          {/* Scan Results */}
          {scannedData && (
            <div className="mt-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <h4 className="font-medium text-green-800">Ticket Verified</h4>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ticket Number:</span>
                    <span className="font-medium">{scannedData.ticket?.ticketNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Event:</span>
                    <span className="font-medium">{scannedData.ticket?.event?.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">User:</span>
                    <span className="font-medium">{scannedData.ticket?.user?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {verifyTicketMutation.isLoading && (
            <div className="mt-4 flex items-center justify-center">
              <Loader className="w-5 h-5 animate-spin text-blue-600 mr-2" />
              <span className="text-sm text-gray-600">Verifying ticket...</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 mt-6">
            <button
              onClick={resetScanner}
              className="flex-1 btn-secondary"
            >
              Scan Another
            </button>
            <button
              onClick={closeScanner}
              className="flex-1 btn-primary"
            >
              Close
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-6 text-sm text-gray-600">
            <h4 className="font-medium text-gray-900 mb-2">How to use:</h4>
            <ul className="space-y-1">
              <li>• Point your camera at the QR code</li>
              <li>• Make sure the QR code is clearly visible</li>
              <li>• Hold steady until the code is scanned</li>
              <li>• The ticket will be automatically verified</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
