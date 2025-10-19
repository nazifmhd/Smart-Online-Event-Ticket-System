import React from 'react';
import { QrCode } from 'lucide-react';

const QRScanner = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">QR Scanner</h1>
        <p className="text-gray-600">
          Scan QR codes to verify tickets
        </p>
      </div>

      <div className="text-center py-12">
        <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">QR Scanner Coming Soon</h2>
        <p className="text-gray-600 mb-6">
          The QR code scanner functionality is being developed. Stay tuned!
        </p>
      </div>
    </div>
  );
};

export default QRScanner;
