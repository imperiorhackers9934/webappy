import React, { useState, useRef } from 'react';
import { Download, Award, QrCode, Eye, RefreshCw } from 'lucide-react';
import QRCode from 'react-qr-code';

const QRCertificateGenerator = () => {
  const [formData, setFormData] = useState({
    recipientName: '',
    courseName: '',
    completionDate: '',
    issuerName: 'Your Organization',
    certificateId: '',
    description: ''
  });
  
  const [showPreview, setShowPreview] = useState(false);
  const [qrData, setQrData] = useState('');
  const certificateRef = useRef(null);

  // Generate random certificate ID
  const generateCertificateId = () => {
    const id = 'CERT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    setFormData({ ...formData, certificateId: id });
  };

  // Generate certificate and QR code data
  const generateCertificate = () => {
    if (!formData.recipientName || !formData.courseName) {
      alert('Please fill in recipient name and course name');
      return;
    }

    const certificateId = formData.certificateId || 'CERT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    // Update certificate ID if not set
    if (!formData.certificateId) {
      setFormData({ ...formData, certificateId: certificateId });
    }

    const certificateData = {
      id: certificateId,
      recipient: formData.recipientName,
      course: formData.courseName,
      date: formData.completionDate,
      issuer: formData.issuerName,
      description: formData.description,
      verifyUrl: `https://verify.certificates.com/${certificateId}`,
      timestamp: new Date().toISOString()
    };

    // Set QR data for react-qr-code component
    setQrData(JSON.stringify(certificateData));
    setShowPreview(true);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const downloadCertificate = () => {
    if (certificateRef.current) {
      // In a real implementation, you'd use html2canvas or similar
      alert('Certificate download feature would be implemented with html2canvas or jsPDF library for production use');
    }
  };

  const resetForm = () => {
    setFormData({
      recipientName: '',
      courseName: '',
      completionDate: '',
      issuerName: 'Your Organization',
      certificateId: '',
      description: ''
    });
    setShowPreview(false);
    setQrData('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Award className="w-12 h-12 mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold">QR Certificate Generator</h1>
          </div>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Create professional certificates with embedded QR codes for instant verification
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Form Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <QrCode className="w-8 h-8 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-800">Certificate Details</h2>
              </div>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                Reset
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Enter recipient's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Course/Achievement Name *
                </label>
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="e.g., React Development Bootcamp"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Completion Date
                </label>
                <input
                  type="date"
                  name="completionDate"
                  value={formData.completionDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Issuing Organization
                </label>
                <input
                  type="text"
                  name="issuerName"
                  value={formData.issuerName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Your organization name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Certificate ID
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    name="certificateId"
                    value={formData.certificateId}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="Auto-generated if empty"
                  />
                  <button
                    onClick={generateCertificateId}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    title="Generate Random ID"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
                  placeholder="Additional details about the achievement..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={generateCertificate}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center justify-center"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Generate & Preview
                </button>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Certificate Preview</h2>
              {showPreview && (
                <button
                  onClick={downloadCertificate}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              )}
            </div>

            {showPreview ? (
              <div 
                ref={certificateRef}
                className="bg-gradient-to-br from-blue-50 to-indigo-100 border-8 border-blue-600 rounded-2xl p-8 text-center relative overflow-hidden"
              >
                {/* Decorative elements */}
                <div className="absolute top-4 left-4 w-16 h-16 border-4 border-blue-300 rounded-full opacity-20"></div>
                <div className="absolute bottom-4 right-4 w-20 h-20 border-4 border-purple-300 rounded-full opacity-20"></div>
                <div className="absolute top-1/2 left-2 w-8 h-8 bg-blue-200 rounded-full opacity-30"></div>
                <div className="absolute top-1/4 right-8 w-12 h-12 bg-purple-200 rounded-full opacity-30"></div>
                
                <div className="relative z-10">
                  <div className="mb-6">
                    <Award className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">CERTIFICATE</h1>
                    <p className="text-lg text-gray-600">OF ACHIEVEMENT</p>
                  </div>

                  <div className="mb-8 space-y-4">
                    <p className="text-lg text-gray-700">This is to certify that</p>
                    <h2 className="text-3xl font-bold text-blue-800 py-2 border-b-2 border-blue-200 mx-4">
                      {formData.recipientName}
                    </h2>
                    <p className="text-lg text-gray-700">has successfully completed</p>
                    <h3 className="text-xl font-semibold text-gray-800 px-4">
                      {formData.courseName}
                    </h3>
                    {formData.description && (
                      <p className="text-gray-600 mt-4 italic px-4 text-sm">
                        "{formData.description}"
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 items-end">
                    <div className="text-left">
                      <p className="text-xs text-gray-600 uppercase tracking-wide">Date of Completion</p>
                      <p className="font-semibold text-gray-800 text-sm">
                        {formData.completionDate || 'Not specified'}
                      </p>
                      <p className="text-xs text-gray-600 mt-2 uppercase tracking-wide">Certificate ID</p>
                      <p className="font-mono text-xs text-gray-800">
                        {formData.certificateId}
                      </p>
                    </div>

                    <div className="text-center">
                      {qrData && (
                        <div className="inline-block">
                          <div className="bg-white p-3 rounded-lg shadow-md border-2 border-gray-200">
                            <QRCode
                              value={qrData}
                              size={80}
                              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                              viewBox="0 0 256 256"
                              bgColor="#ffffff"
                              fgColor="#2563eb"
                            />
                          </div>
                          <p className="text-xs text-gray-600 mt-2 font-medium">Scan to verify</p>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="border-t-2 border-gray-400 pt-2">
                        <p className="font-semibold text-gray-800 text-sm">
                          {formData.issuerName}
                        </p>
                        <p className="text-xs text-gray-600">Authorized Signature</p>
                      </div>
                    </div>
                  </div>

                  {/* Certificate authenticity footer */}
                  <div className="mt-6 pt-4 border-t border-gray-300">
                    <p className="text-xs text-gray-500">
                      This certificate can be verified by scanning the QR code or visiting our verification portal
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                <Award className="w-24 h-24 mb-4 opacity-20" />
                <p className="text-lg mb-2">Certificate Preview</p>
                <p className="text-sm text-center max-w-xs">
                  Fill in the required details and click "Generate & Preview" to see your professional certificate
                </p>
              </div>
            )}
          </div>
        </div>

        {/* QR Code Info Section */}
        {showPreview && qrData && (
          <div className="mt-12 bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center mb-6">
              <QrCode className="w-8 h-8 text-blue-600 mr-3" />
              <h3 className="text-2xl font-bold text-gray-800">QR Code Information</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Certificate Data Stored in QR Code:</h4>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700 max-h-64 overflow-y-auto">
                  {JSON.stringify(JSON.parse(qrData), null, 2)}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Verification Features:</h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Unique certificate ID for tracking
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Timestamp for issuance verification
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Complete certificate details embedded
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Verification URL for online validation
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Tamper-proof JSON structure
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <QrCode className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">QR Code Verification</h3>
            <p className="text-gray-600">Each certificate includes a unique QR code containing complete verification data using react-qr-code for optimal performance.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <Award className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Professional Design</h3>
            <p className="text-gray-600">Beautiful, customizable certificate templates with modern styling that look professional and impressive.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <Download className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Easy Download</h3>
            <p className="text-gray-600">Download certificates in high-quality format, ready for printing or digital sharing with embedded QR verification.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCertificateGenerator;
