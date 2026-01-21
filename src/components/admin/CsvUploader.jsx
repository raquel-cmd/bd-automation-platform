import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';

/**
 * Reusable CSV uploader component
 * @param {Object} props
 * @param {string} props.platformKey - Unique identifier for the platform
 * @param {string} props.label - Display label for the uploader
 * @param {Function} props.onUploadSuccess - Callback with parsed rows
 * @param {string} props.description - Optional description text
 */
export default function CsvUploader({ platformKey, label, onUploadSuccess, description }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
      setStatus(null);
    } else {
      setStatus({
        type: 'error',
        message: 'Please select a valid CSV file',
      });
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const parseCsvContent = (content) => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows');
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim());

    // Parse rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};

      header.forEach((key, idx) => {
        const value = values[idx];
        // Convert numeric fields
        if (['weeklyRevenue', 'mtdRevenue', 'mtdGmv', 'targetGmv', 'totalContractRevenue'].includes(key)) {
          row[key] = value ? parseFloat(value) : 0;
        } else {
          row[key] = value || '';
        }
      });

      rows.push(row);
    }

    return rows;
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setStatus({
        type: 'error',
        message: 'Please select a file first',
      });
      return;
    }

    setUploading(true);
    setStatus({
      type: 'processing',
      message: 'Processing CSV file...',
    });

    try {
      // Read file content
      const content = await selectedFile.text();

      // Parse CSV
      const rows = parseCsvContent(content);

      if (rows.length === 0) {
        throw new Error('No valid data rows found in CSV');
      }

      // Call success callback with parsed rows
      await onUploadSuccess(rows);

      setStatus({
        type: 'success',
        message: `Successfully processed ${rows.length} records`,
      });

      // Clear file after successful upload
      setTimeout(() => {
        handleClearFile();
        setStatus(null);
      }, 3000);

    } catch (error) {
      setStatus({
        type: 'error',
        message: `Upload failed: ${error.message}`,
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
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
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{label}</h4>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* File Selection */}
        <div className="flex items-center gap-2">
          <label className="flex-1 cursor-pointer">
            <div className={`flex items-center px-3 py-2 border-2 border-dashed rounded-lg transition-colors ${
              selectedFile
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400'
            }`}>
              <FileText className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
              <span className="text-sm text-gray-600 truncate">
                {selectedFile ? selectedFile.name : 'Choose CSV file'}
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          {selectedFile && (
            <button
              onClick={handleClearFile}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear file"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>

        {/* Status Message */}
        {status && (
          <div
            className={`p-3 rounded-lg border flex items-start text-sm ${getStatusBgColor(
              status.type
            )}`}
          >
            <div className="mr-2 mt-0.5">
              {getStatusIcon(status.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{status.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
