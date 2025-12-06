"use client";
import React, { useState, useMemo, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useGetApplicationsQuery,
  useDeleteApplicationMutation,
} from '@/state/applicationApi';
import { Application } from '@/state/api';
import { showToast } from '@/utils/toast';
import { TableSkeleton } from '@/app/(components)/LoadingSkeleton';

interface ApplicationsTableProps {
  onEdit?: (id: number) => void;
}

export const ApplicationsTable: React.FC<ApplicationsTableProps> = ({ onEdit }) => {
  const router = useRouter();
  const { data: applications = [], isLoading, error } = useGetApplicationsQuery();
  const [deleteApplication, { isLoading: isDeleting }] = useDeleteApplicationMutation();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number, applicationRef: string) => {
    if (!confirm(`Are you sure you want to delete application ${applicationRef}? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteApplication(id).unwrap();
      showToast.success('Application deleted successfully');
      // Success - the query will automatically refetch due to cache invalidation
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to delete application. Please try again.';
      showToast.error(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (id: number) => {
    if (onEdit) {
      onEdit(id);
    } else {
      router.push(`/applications/${id}/edit`);
    }
  };

  const getStatusColor = useMemo(() => {
    return (status?: string) => {
      switch (status?.toUpperCase()) {
        case 'SUBMITTED':
        case 'APPROVED':
          return 'bg-green-100 text-green-800';
        case 'PENDING':
        case 'IN_REVIEW':
          return 'bg-yellow-100 text-yellow-800';
        case 'REJECTED':
          return 'bg-red-100 text-red-800';
        case 'DRAFT':
          return 'bg-gray-100 text-gray-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };
  }, []);

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error loading applications</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-orange-600 rounded shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-150"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <svg
          className="w-16 h-16 text-gray-400 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No applications yet
        </h3>
        <p className="text-gray-500 mb-4">
          Get started by creating your first application.
        </p>
        <Link
          href="/applications/new"
          className="px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-orange-600 rounded shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-150 inline-flex items-center"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Start New Application
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Your Applications</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Application Ref
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Student Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                University
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Program
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Submission Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applications.map((app: Application) => (
              <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {app.applicationRef}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {app.student
                    ? `${app.student.firstName} ${app.student.lastName}`
                    : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {app.university?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {app.intendedProgram || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      app.applicationStatus?.status
                    )}`}
                  >
                    {app.applicationStatus?.status || 'DRAFT'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {app.submissionDate
                    ? new Date(app.submissionDate).toLocaleDateString()
                    : 'Not submitted'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-4">
                    <Link
                      href={`/applications/${app.id}`}
                      className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleEdit(app.id)}
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(app.id, app.applicationRef)}
                      disabled={deletingId === app.id || isDeleting}
                      className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {deletingId === app.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

