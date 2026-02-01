import React, { useState } from 'react';
import { Database, AlertCircle } from 'lucide-react';
import CsvUploader from './CsvUploader';

// Hardcoded to Render Backend to prevent Vercel 405 errors (Environment variable issues)
const API_BASE_URL = 'https://bd-automation-platform-1.onrender.com';

/**
 * Type definitions for CSV rows
 *
 * @typedef {Object} PlatformCsvRow
 * @property {string} date - ISO date string
 * @property {string} brand - Brand name
 * @property {number} weeklyRevenue - Weekly revenue amount
 * @property {number} mtdRevenue - Month-to-date revenue
 * @property {number} mtdGmv - Month-to-date GMV
 * @property {number} targetGmv - Target GMV
 * @property {number} [totalContractRevenue] - Optional total contract revenue
 *
 * @typedef {Object} FlatFeeCsvRow
 * @property {string} partnerName - Partner name
 * @property {string} contractStart - Contract start date
 * @property {string} contractEnd - Contract end date
 * @property {number} totalContractRevenue - Total contract revenue
 */

export default function DataUploadSection() {
  const [globalStatus, setGlobalStatus] = useState(null);

  // Platform configurations for uploaders
  const attributionPlatforms = [
    { key: 'creator-connections', label: 'Creator Connections' },
    { key: 'levanta', label: 'Levanta' },
    { key: 'perch', label: 'Perch' },
    { key: 'partnerboost', label: 'PartnerBoost' },
    { key: 'archer', label: 'Archer' },
  ];

  const affiliatePlatforms = [
    { key: 'skimlinks', label: 'Skimlinks/Skimbit', description: 'Includes both Skimlinks and Skimbit data' },
    { key: 'impact', label: 'Impact' },
    { key: 'howl', label: 'Howl' },
    { key: 'brandads', label: 'BrandAds' },
    { key: 'other-affiliates', label: 'Other Affiliates', description: 'Awin, Partnerize, Connexity, Apple, etc.' },
  ];

  /**
   * Handle platform data upload
   * @param {string} platformKey
   * @param {PlatformCsvRow[]} rows
   */
  const handlePlatformUpload = async (platformKey, rows) => {
    try {
      setGlobalStatus({
        type: 'processing',
        message: `Uploading ${rows.length} records for ${platformKey}...`,
      });

      const response = await fetch(`${API_BASE_URL}/api/upload-platform-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platformKey,
          rows,
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          if (text) {
            const error = JSON.parse(text);
            errorMessage = error.message || error.error || errorMessage;
          } else {
            errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
          }
        } catch (e) {
          errorMessage = `Upload failed: ${response.status} ${response.statusText} (${text.substring(0, 100)})`;
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = text ? JSON.parse(text) : { success: true };
      } catch (e) {
        throw new Error('Server returned invalid JSON response');
      }

      setGlobalStatus({
        type: 'success',
        message: `Successfully uploaded ${result.recordsProcessed || rows.length} records for ${platformKey}`,
      });

      // Clear success message after 5 seconds
      setTimeout(() => setGlobalStatus(null), 5000);

    } catch (error) {
      setGlobalStatus({
        type: 'error',
        message: `Failed to upload ${platformKey}: ${error.message}`,
      });

      // Clear error message after 10 seconds
      setTimeout(() => setGlobalStatus(null), 10000);

      throw error;
    }
  };

  /**
   * Handle flat fee data upload
   * @param {FlatFeeCsvRow[]} rows
   */
  const handleFlatFeeUpload = async (rows) => {
    try {
      setGlobalStatus({
        type: 'processing',
        message: `Processing ${rows.length} flat fee contracts...`,
      });

      const response = await fetch(`${API_BASE_URL}/api/upload-flat-fees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rows,
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          if (text) {
            const error = JSON.parse(text);
            errorMessage = error.message || error.error || errorMessage;
          } else {
            errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
          }
        } catch (e) {
          errorMessage = `Upload failed: ${response.status} ${response.statusText} (${text.substring(0, 100)})`;
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = text ? JSON.parse(text) : { success: true };
      } catch (e) {
        throw new Error('Server returned invalid JSON response');
      }

      setGlobalStatus({
        type: 'success',
        message: `Successfully processed ${result.contractsProcessed || rows.length} flat fee contracts with ${result.weeksGenerated || 0} weekly allocations`,
      });

      // Clear success message after 5 seconds
      setTimeout(() => setGlobalStatus(null), 5000);

    } catch (error) {
      setGlobalStatus({
        type: 'error',
        message: `Failed to upload flat fees: ${error.message}`,
      });

      // Clear error message after 10 seconds
      setTimeout(() => setGlobalStatus(null), 10000);

      throw error;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Database className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Data Upload</h3>
        </div>
      </div>

      {/* Global Status Banner */}
      {globalStatus && (
        <div
          className={`p-4 rounded-lg border flex items-start ${getStatusBgColor(
            globalStatus.type
          )}`}
        >
          {globalStatus.type === 'processing' && (
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3 mt-0.5" />
          )}
          {globalStatus.type === 'error' && (
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium">{globalStatus.message}</p>
          </div>
        </div>
      )}

      {/* Attribution Partners Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-800 uppercase tracking-wide">
            Attribution Partners
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Expected columns: date, brand, weeklyRevenue, mtdRevenue, mtdGmv, targetGmv, totalContractRevenue
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attributionPlatforms.map((platform) => (
            <CsvUploader
              key={platform.key}
              platformKey={platform.key}
              label={platform.label}
              description={platform.description}
              onUploadSuccess={(rows) => handlePlatformUpload(platform.key, rows)}
            />
          ))}
        </div>
      </div>

      {/* Affiliate Partners Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-800 uppercase tracking-wide">
            Affiliate Partners
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Expected columns: date, brand, weeklyRevenue, mtdRevenue, mtdGmv, targetGmv, totalContractRevenue
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {affiliatePlatforms.map((platform) => (
            <CsvUploader
              key={platform.key}
              platformKey={platform.key}
              label={platform.label}
              description={platform.description}
              onUploadSuccess={(rows) => handlePlatformUpload(platform.key, rows)}
            />
          ))}
        </div>
      </div>

      {/* Flat Fee Deals Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-800 uppercase tracking-wide">
            Flat Fee Partnerships
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Expected columns: partnerName, contractStart, contractEnd, totalContractRevenue
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Note: Revenue will be evenly distributed across all weeks between contract start and end dates
          </p>
        </div>
        <div className="max-w-md">
          <CsvUploader
            platformKey="flat-fee-deals"
            label="Flat Fee Deals (Annual)"
            description="Upload annual flat fee contracts with automatic weekly allocation"
            onUploadSuccess={handleFlatFeeUpload}
          />
        </div>
      </div>

      {/* CSV Format Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          CSV Format Guidelines
        </h4>
        <div className="space-y-2 text-xs text-blue-800">
          <div>
            <strong>Platform Data CSV:</strong>
            <ul className="ml-4 mt-1 space-y-0.5">
              <li>• Header row required: date,brand,weeklyRevenue,mtdRevenue,mtdGmv,targetGmv,totalContractRevenue</li>
              <li>• Date format: YYYY-MM-DD (e.g., 2025-01-15)</li>
              <li>• Numeric values without currency symbols or commas</li>
            </ul>
          </div>
          <div className="mt-3">
            <strong>Flat Fee CSV:</strong>
            <ul className="ml-4 mt-1 space-y-0.5">
              <li>• Header row required: partnerName,contractStart,contractEnd,totalContractRevenue</li>
              <li>• Date format: YYYY-MM-DD</li>
              <li>• Revenue will be automatically distributed across weeks in the contract period</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
