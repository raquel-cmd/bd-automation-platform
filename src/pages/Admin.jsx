import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout';
import DataUploadSection from '../components/admin/DataUploadSection';
import { formatDate } from '../utils/dateUtils';

export default function Admin() {
  const [uploadHistory, setUploadHistory] = useState([]);

  useEffect(() => {
    fetchUploadHistory();
  }, []);

  const fetchUploadHistory = async () => {
    try {
      // Mock data for demonstration
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
          <p className="text-sm text-gray-500 mt-1">
            Upload CSV files to import platform and revenue data
          </p>
        </div>

        {/* Data Upload Section */}
        <DataUploadSection />

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
