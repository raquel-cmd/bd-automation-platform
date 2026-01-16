import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import Layout from '../components/Layout';
import { admin, skimlinks } from '../utils/api';
import { formatDate } from '../utils/dateUtils';

export default function Admin() {
  // Skimlinks-specific state
  const [skimlinksFile, setSkimlinksFile] = useState(null);
  const [skimlinksMonth, setSkimlinksMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [skimlinksStatus, setSkimlinksStatus] = useState(null);
  const [skimlinksLoading, setSkimlinksLoading] = useState(false);

  // Original upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('Skimlinks');
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const platforms = [
    'Skimlinks',
    'Creator Connections',
    'Flat Fee',
    'Other Attribution',
  ];

  useEffect(() => {
    fetchUploadHistory();
  }, []);

  const fetchUploadHistory = async () => {
    try {
      const mockHistory = [
        {
          id: 1,
          filename: 'skimlinks_november_2025.csv',
          platform: 'Skimlinks',
          uploadDate: new Date('2025-11-15'),
          status: 'success',
          recordsProcessed: 237,
          uploadedBy: 'admin',
        },
        {
          id: 2,
          filename: 'creator_connections_november_2025.csv',
          platform: 'Creator Connections',
          uploadDate: new Date('2025-11-14'),
          status: 'success',
          recordsProcessed: 412,
          uploadedBy: 'admin',
        },
        {
          id: 3,
          filename: 'flat_fee_november_2025.csv',
          platform: 'Flat Fee',
          uploadDate: new Date('2025-11-13'),
          status: 'success',
          recordsProcessed: 8,
          uploadedBy: 'admin',
        },
        {
          id: 4,
          filename: 'skimlinks_october_2025.csv',
          platform: 'Skimlinks',
          uploadDate: new Date('2025-10-31'),
          status: 'success',
          recordsProcessed: 285,
          uploadedBy: 'admin',
        },
      ];

      setUploadHistory(mockHistory);
    } catch (error) {
      console.error('Error fetching upload history:', error);
    }
  };

  // Skimlinks CSV upload handler
  const handleSkimlinksFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.csv')) {
      setSkimlinksFile(file);
      setSkimlinksStatus(null);
    } else {
      setSkimlinksStatus({
        type: 'error',
        message: 'Please select a valid CSV file',
      });
    }
  };

  const handleSkimlinksUpload = async () => {
    if (!skimlinksFile) {
      setSkimlinksStatus({
        type: 'error',
        message: 'Please select a file first',
      });
      return;
    }

    setSkimlinksLoading(true);
    setSkimlinksStatus({
      type: 'processing',
      message: 'Uploading and processing Skimlinks data...',
    });

    try {
      // Read file as text
      const csvContent = await skimlinksFile.text();

      // Upload to backend
      const response = await skimlinks.uploadCSV(csvContent, skimlinksMonth);

      setSkimlinksStatus({
        type: 'success',
        message: response.message || `Successfully uploaded ${response.count} merchants for ${response.month}`,
      });

      // Clear file
      setSkimlinksFile(null);
      document.getElementById('skimlinks-file-upload').value = '';

      // Add to history
      const newRecord = {
        id: uploadHistory.length + 1,
        filename: skimlinksFile.name,
        platform: 'Skimlinks',
        uploadDate: new Date(),
        status: 'success',
        recordsProcessed: response.count,
        uploadedBy: 'admin',
      };
      setUploadHistory([newRecord, ...uploadHistory]);

    } catch (error) {
      setSkimlinksStatus({
        type: 'error',
        message: `Upload failed: ${error.message}`,
      });
    } finally {
      setSkimlinksLoading(false);
    }
  };

  // Original upload handlers
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
      setUploadStatus(null);
    } else {
      setUploadStatus({
        type: 'error',
        message: 'Please select a valid CSV file',
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus({
        type: 'error',
        message: 'Please select a file first',
      });
      return;
    }

    setLoading(true);
    setUploadStatus({
      type: 'processing',
      message: 'Uploading and processing file...',
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newRecord = {
        id: uploadHistory.length + 1,
        filename: selectedFile.name,
        platform: selectedPlatform,
        uploadDate: new Date(),
        status: 'success',
        recordsProcessed: Math.floor(Math.random() * 500) + 100,
        uploadedBy: 'admin',
      };

      setUploadHistory([newRecord, ...uploadHistory]);
      setUploadStatus({
        type: 'success',
        message: `Successfully uploaded ${selectedFile.name} - ${newRecord.recordsProcessed} records processed`,
      });
      setSelectedFile(null);
      document.getElementById('file-upload').value = '';
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: `Upload failed: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBgColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'processing':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
          <p className="text-sm text-gray-500 mt-1">
            Upload CSV files to import revenue data
          </p>
        </div>

        {/* Skimlinks Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Upload className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Skimlinks Brand Performance Upload</h3>
          </div>

          <div className="space-y-4">
            {/* Month Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month
              </label>
              <input
                type="month"
                value={skimlinksMonth}
                onChange={(e) => setSkimlinksMonth(e.target.value)}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skimlinks Publisher Report CSV
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                    <FileText className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      {skimlinksFile ? skimlinksFile.name : 'Choose Skimlinks CSV file'}
                    </span>
                  </div>
                  <input
                    id="skimlinks-file-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleSkimlinksFileChange}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleSkimlinksUpload}
                  disabled={!skimlinksFile || skimlinksLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {skimlinksLoading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>

            {/* Status Message */}
            {skimlinksStatus && (
              <div
                className={`p-4 rounded-lg border flex items-start ${getStatusBgColor(
                  skimlinksStatus.type
                )}`}
              >
                <div className="mr-3 mt-0.5">
                  {getStatusIcon(skimlinksStatus.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{skimlinksStatus.message}</p>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                Skimlinks CSV Format:
              </h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Export the "Publisher Report" from Skimlinks</li>
                <li>• Required columns: Merchant, Clicks, Sales, Conversion rate, Order value, Revenue, EPC</li>
                <li>• Select the month above before uploading</li>
                <li>• The system will automatically parse and store brand performance data</li>
              </ul>
            </div>
          </div>
        </div>

        {/* General Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Upload className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">General CSV Upload</h3>
          </div>

          <div className="space-y-4">
            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform
              </label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {platforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSV File
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                    <FileText className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      {selectedFile ? selectedFile.name : 'Choose a CSV file'}
                    </span>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>

            {/* Status Message */}
            {uploadStatus && (
              <div
                className={`p-4 rounded-lg border flex items-start ${getStatusBgColor(
                  uploadStatus.type
                )}`}
              >
                <div className="mr-3 mt-0.5">
                  {getStatusIcon(uploadStatus.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{uploadStatus.message}</p>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                CSV Format Requirements:
              </h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• File must be in CSV format</li>
                <li>• Required columns: Date, Brand, Revenue, GMV, Transactions</li>
                <li>• Date format: YYYY-MM-DD</li>
                <li>• Revenue and GMV: Numeric values without currency symbols</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Upload History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <FileText className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Upload History</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filename
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Upload Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Records
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uploadHistory.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.platform}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(record.uploadDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(record.status)}
                        <span className="ml-2 text-sm capitalize text-gray-700">
                          {record.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                      {record.recordsProcessed.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.uploadedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
