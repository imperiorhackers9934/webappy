import React, { useState, useRef } from 'react';
import { Download, QrCode, Eye, RefreshCw, Search, Check, X, User, Calendar, Building, Hash } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const QRCodeGenerator = () => {
  const [formData, setFormData] = useState({
    recipientName: '',
    courseName: '',
    completionDate: '',
    issuerName: '',
    certificateId: '',
    description: ''
  });

  const [qrData, setQrData] = useState('');
  const [generatedQR, setGeneratedQR] = useState(null);
  const [verificationInput, setVerificationInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [activeTab, setActiveTab] = useState('generate');
  const qrRef = useRef(null);

  // In-memory storage for generated QR codes (in production, use a database)
  const [qrDatabase, setQrDatabase] = useState([]);

  // Generate random certificate ID
  const generateCertificateId = () => {
    const id = 'CERT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    setFormData({ ...formData, certificateId: id });
  };

  // Generate QR code with data
  const generateQRCode = () => {
    if (!formData.recipientName) {
      alert('Please fill in recipient name');
      return;
    }

    const certificateId = formData.certificateId || 'CERT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    if (!formData.certificateId) {
      setFormData({ ...formData, certificateId: certificateId });
    }

    const qrPayload = {
      id: certificateId,
      recipient: formData.recipientName,
      course: formData.courseName || null,
      date: formData.completionDate || null,
      issuer: formData.issuerName || null,
      description: formData.description || null,
      verifyUrl: `https://verify.example.com/${certificateId}`,
      timestamp: new Date().toISOString(),
      type: 'certificate'
    };

    const qrString = JSON.stringify(qrPayload);
    setQrData(qrString);
    setGeneratedQR(qrPayload);

    // Store in "database" for verification
    setQrDatabase(prev => {
      const filtered = prev.filter(item => item.id !== certificateId);
      return [...filtered, qrPayload];
    });
  };

  // Verify QR code
  const verifyQRCode = () => {
    if (!verificationInput.trim()) {
      alert('Please enter QR code data to verify');
      return;
    }

    try {
      const parsedData = JSON.parse(verificationInput);
      
      // Check if QR code exists in our database
      const found = qrDatabase.find(item => item.id === parsedData.id);
      
      if (found) {
        // Verify data integrity
        const isValid = JSON.stringify(found) === JSON.stringify(parsedData);
        setVerificationResult({
          isValid: isValid,
          data: found,
          message: isValid ? 'QR Code is valid and verified' : 'QR Code data has been tampered with'
        });
      } else {
        setVerificationResult({
          isValid: false,
          data: parsedData,
          message: 'QR Code not found in database - may be invalid or from another system'
        });
      }
    } catch (error) {
      setVerificationResult({
        isValid: false,
        data: null,
        message: 'Invalid QR code format - not a valid JSON structure'
      });
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Download QR code as image
  const downloadQRCode = () => {
    if (!qrRef.current) {
      alert('No QR code to download');
      return;
    }

    const canvas = qrRef.current.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `qr-code-${formData.recipientName?.replace(/\s+/g, '-') || 'unnamed'}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetForm = () => {
    setFormData({
      recipientName: '',
      courseName: '',
      completionDate: '',
      issuerName: '',
      certificateId: '',
      description: ''
    });
    setQrData('');
    setGeneratedQR(null);
  };

  const clearVerification = () => {
    setVerificationInput('');
    setVerificationResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <QrCode className="w-12 h-12 mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold">QR Code Generator & Verifier</h1>
          </div>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Generate secure QR codes with certificate data and verify their authenticity
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white rounded-xl p-2 shadow-lg">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'generate' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <QrCode className="w-5 h-5 mr-2" />
            Generate QR Code
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'verify' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Search className="w-5 h-5 mr-2" />
            Verify QR Code
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'database' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Eye className="w-5 h-5 mr-2" />
            Database ({qrDatabase.length})
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Generate QR Code */}
          {activeTab === 'generate' && (
            <>
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <QrCode className="w-8 h-8 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-800">Generate QR Code</h2>
                  </div>
                  <button
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    Reset
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
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
                      Course/Achievement Name
                    </label>
                    <input
                      type="text"
                      name="courseName"
                      value={formData.courseName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="e.g., React Development Bootcamp (Optional)"
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
                      placeholder="Your organization name (Optional)"
                    />
                  </div>

                  <div className="md:col-span-2">
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

                  <div className="md:col-span-2">
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
                </div>

                <div className="mt-8">
                  <button
                    onClick={generateQRCode}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center justify-center"
                  >
                    <QrCode className="w-5 h-5 mr-2" />
                    Generate QR Code
                  </button>
                </div>
              </div>

              {/* QR Code Display */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Generated QR Code</h2>
                  {generatedQR && (
                    <button
                      onClick={downloadQRCode}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors text-sm"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </button>
                  )}
                </div>

                {generatedQR ? (
                  <div className="text-center">
                    <div ref={qrRef} className="inline-block bg-white p-6 rounded-lg shadow-lg border-2 border-gray-200 mb-6">
                      <QRCodeCanvas
                        value={qrData}
                        size={200}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="M"
                        includeMargin={true}
                      />
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 text-left">
                      <h3 className="font-semibold text-gray-800 mb-3">QR Code Contains:</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-blue-600 mr-2" />
                          <span className="font-medium">Recipient:</span>
                          <span className="ml-2">{generatedQR.recipient}</span>
                        </div>
                        {generatedQR.course && (
                          <div className="flex items-center">
                            <Building className="w-4 h-4 text-green-600 mr-2" />
                            <span className="font-medium">Course:</span>
                            <span className="ml-2">{generatedQR.course}</span>
                          </div>
                        )}
                        {generatedQR.date && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-purple-600 mr-2" />
                            <span className="font-medium">Date:</span>
                            <span className="ml-2">{generatedQR.date}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Hash className="w-4 h-4 text-orange-600 mr-2" />
                          <span className="font-medium">ID:</span>
                          <span className="ml-2 font-mono text-xs">{generatedQR.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <QrCode className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg mb-2">No QR Code Generated</p>
                    <p className="text-sm text-center">Fill in the recipient name and click "Generate QR Code"</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Verify QR Code */}
          {activeTab === 'verify' && (
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <Search className="w-8 h-8 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-800">Verify QR Code</h2>
                  </div>
                  <button
                    onClick={clearVerification}
                    className="text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    Clear
                  </button>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      QR Code Data (JSON)
                    </label>
                    <textarea
                      value={verificationInput}
                      onChange={(e) => setVerificationInput(e.target.value)}
                      rows="10"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none font-mono text-sm"
                      placeholder="Paste the QR code data here (JSON format)..."
                    />
                    
                    <button
                      onClick={verifyQRCode}
                      className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Verify QR Code
                    </button>
                  </div>

                  <div>
                    {verificationResult && (
                      <div className={`p-6 rounded-xl border-2 ${
                        verificationResult.isValid 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center mb-4">
                          {verificationResult.isValid ? (
                            <Check className="w-8 h-8 text-green-600 mr-3" />
                          ) : (
                            <X className="w-8 h-8 text-red-600 mr-3" />
                          )}
                          <div>
                            <h3 className={`text-xl font-bold ${
                              verificationResult.isValid ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {verificationResult.isValid ? 'Valid QR Code' : 'Invalid QR Code'}
                            </h3>
                            <p className={`text-sm ${
                              verificationResult.isValid ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {verificationResult.message}
                            </p>
                          </div>
                        </div>

                        {verificationResult.data && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-800">Certificate Details:</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="font-medium">Recipient:</span>
                                <span>{verificationResult.data.recipient}</span>
                              </div>
                              {verificationResult.data.course && (
                                <div className="flex justify-between">
                                  <span className="font-medium">Course:</span>
                                  <span>{verificationResult.data.course}</span>
                                </div>
                              )}
                              {verificationResult.data.date && (
                                <div className="flex justify-between">
                                  <span className="font-medium">Date:</span>
                                  <span>{verificationResult.data.date}</span>
                                </div>
                              )}
                              {verificationResult.data.issuer && (
                                <div className="flex justify-between">
                                  <span className="font-medium">Issuer:</span>
                                  <span>{verificationResult.data.issuer}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="font-medium">Certificate ID:</span>
                                <span className="font-mono text-xs">{verificationResult.data.id}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Generated:</span>
                                <span className="text-xs">{new Date(verificationResult.data.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {!verificationResult && (
                      <div className="flex flex-col items-center justify-center h-64 text-gray-500 border-2 border-dashed border-gray-300 rounded-xl">
                        <Search className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg mb-2">Verification Results</p>
                        <p className="text-sm text-center">Enter QR code data and click verify to see results</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Database View */}
          {activeTab === 'database' && (
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="flex items-center mb-8">
                  <Eye className="w-8 h-8 text-blue-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">QR Code Database</h2>
                  <span className="ml-4 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {qrDatabase.length} records
                  </span>
                </div>

                {qrDatabase.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Certificate ID</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Recipient</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Course</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Generated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {qrDatabase.map((record, index) => (
                          <tr key={record.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 text-sm font-mono">{record.id}</td>
                            <td className="px-4 py-3 text-sm">{record.recipient}</td>
                            <td className="px-4 py-3 text-sm">{record.course || '-'}</td>
                            <td className="px-4 py-3 text-sm">{record.date || '-'}</td>
                            <td className="px-4 py-3 text-sm">{new Date(record.timestamp).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <Eye className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg mb-2">No QR Codes Generated</p>
                    <p className="text-sm text-center">Generate some QR codes to see them in the database</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
