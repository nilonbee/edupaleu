"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useGetApplicationQuery, useUpdateApplicationStatusMutation, useUpdateApplicationRegisteredMutation } from "@/state/applicationApi";
import { useGetApplicationStatusesQuery } from "@/state/api";
import { ApplicationViewSkeleton } from "@/app/(components)/LoadingSkeleton/ApplicationSkeleton";
import Button from "@/app/(components)/Button";
import { StatusChangeModal } from "@/app/(components)/ApplicationsTable/StatusChangeModal";
import { showToast } from "@/utils/toast";
import { useAppSelector } from "@/app/redux";

const ViewApplicationPage = () => {
  const params = useParams();
  const router = useRouter();
  const applicationId = params?.id ? parseInt(params.id as string) : null;
  const currentUser = useAppSelector((state) => state.auth.user);
  const isAdmin = currentUser?.role === 'admin';

  const {
    data: application,
    isLoading,
    error,
    refetch,
  } = useGetApplicationQuery(applicationId!, {
    skip: !applicationId,
  });

  const { data: availableStatuses = [] } = useGetApplicationStatusesQuery();
  const [updateStatus] = useUpdateApplicationStatusMutation();
  const [updateRegistered] = useUpdateApplicationRegisteredMutation();
  const [statusModal, setStatusModal] = useState({
    open: false,
    applicationId: applicationId!,
    applicationRef: "",
    currentStatus: undefined as string | undefined,
    currentRegistered: false,
  });

  // Type assertion for the response structure
  const appData = application ? ((application as any)?.data || application) : null;

  const handleStatusChange = useCallback(
    async (applicationId: number, newStatus: string) => {
      try {
        await updateStatus({ applicationId, status: newStatus }).unwrap();
        showToast.success("Application status updated successfully");
        setStatusModal({
          open: false,
          applicationId: applicationId,
          applicationRef: "",
          currentStatus: undefined,
          currentRegistered: false,
        });
        refetch();
      } catch (error: any) {
        const errorMessage =
          error?.data?.message ||
          error?.message ||
          "Failed to update status. Please try again.";
        showToast.error(errorMessage);
        throw error;
      }
    },
    [updateStatus, refetch]
  );

  useEffect(() => {
    if (appData && applicationId) {
      setStatusModal({
        open: false,
        applicationId: applicationId,
        applicationRef: appData.applicationRef || "",
        currentStatus: appData.applicationStatus?.status,
        currentRegistered: appData.registered ?? false,
      });
    }
  }, [appData, applicationId]);

  if (!applicationId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-red-600 mb-4">Invalid application ID</p>
          <Link href="/applications">
            <Button variant="primary" size="md">
              Back to Applications
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <ApplicationViewSkeleton />;
  }

  if (error || !application) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-red-600 mb-4">Error loading application</p>
          <Link href="/applications">
            <Button variant="primary" size="md">
              Back to Applications
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!appData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-red-600 mb-4">No application data available</p>
          <Link href="/applications">
            <Button variant="primary" size="md">
              Back to Applications
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case "SUBMITTED":
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "PENDING":
      case "IN_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/applications"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150"
          >
            ← Back to Applications
          </Link>
          <Link
            href={`/applications/${applicationId}/edit`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-orange-600 rounded shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-150"
          >
            Edit Application
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Application Details
              </h1>
              <p className="text-gray-600 mt-1">
                Reference: {appData.applicationRef}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                  appData.applicationStatus?.status
                )}`}
              >
                {appData.applicationStatus?.status || "DRAFT"}
              </span>
              {appData.registered !== undefined && (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    appData.registered
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {appData.registered ? "Registered" : "Not Registered"}
                </span>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setStatusModal({
                    open: true,
                    applicationId: applicationId!,
                    applicationRef: appData.applicationRef || "",
                    currentStatus: appData.applicationStatus?.status,
                    currentRegistered: appData.registered ?? false,
                  })
                }
              >
                Change Status
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Submission Date</p>
              <p className="font-medium">
                {formatDate(appData.submissionDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Intake</p>
              <p className="font-medium">
                {appData.intakeMonth} {appData.intakeYear}
              </p>
            </div>
          </div>
        </div>

        {/* Student Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Student Information
          </h2>
          {appData.student ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">First Name</p>
                <p className="font-medium">{appData.student.firstName || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Name</p>
                <p className="font-medium">{appData.student.lastName || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{appData.student.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{appData.student.phone || "N/A"}</p>
              </div>
              {appData.student.secondPhone && (
                <div>
                  <p className="text-sm text-gray-500">Second Phone</p>
                  <p className="font-medium">{appData.student.secondPhone || "N/A"}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium">
                  {formatDate(appData.student.dateOfBirth)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium">{appData.student.gender || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nationality</p>
                <p className="font-medium">
                  {appData.student.nationality || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Passport Number</p>
                <p className="font-medium">
                  {appData.student.passportNumber || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Passport Expiry</p>
                <p className="font-medium">
                  {formatDate(appData.student.passportExpiry)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{appData.student.address || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">City</p>
                <p className="font-medium">{appData.student.city || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">State</p>
                <p className="font-medium">{appData.student.state || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ZIP Code</p>
                <p className="font-medium">{appData.student.zipCode || "N/A"}</p>
              </div>
              {appData.student.hasEnglishTest && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">English Test Type</p>
                    <p className="font-medium">{appData.student.englishTestType || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">English Test Score</p>
                    <p className="font-medium">{appData.student.englishTestScore || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">English Test Date</p>
                    <p className="font-medium">
                      {formatDate(appData.student.englishTestDate)}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No student information available</p>
          )}
        </div>

        {/* University Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            University Information
          </h2>
          {appData.university && (
            <div>
              <p className="text-sm text-gray-500">University</p>
              <p className="font-medium text-lg">{appData.university.name}</p>
              {appData.university.website && (
                <a
                  href={appData.university.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {appData.university.website}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Intended Programs */}
        {appData.intendedPrograms && appData.intendedPrograms.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Intended Programs ({appData.intendedPrograms.length})
            </h2>
            <div className="space-y-4">
              {appData.intendedPrograms.map((program: any, index: number) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Country</p>
                      <p className="font-medium">{program.country}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">University</p>
                      <p className="font-medium">{program.university}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Program</p>
                      <p className="font-medium">{program.programme}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents */}
        {appData.documents && appData.documents.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Documents ({appData.documents.length})
            </h2>
            <div className="space-y-2">
              {appData.documents.map((doc: any, index: number) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded border"
                >
                  <div>
                    <p className="font-medium">{doc.fileName}</p>
                    <p className="text-sm text-gray-500">
                      {doc.documentType} •{" "}
                      {doc.fileSize
                        ? `${(doc.fileSize / 1024).toFixed(2)} KB`
                        : "N/A"}
                    </p>
                  </div>
                  {doc.filePath && (
                    <a
                      href={doc.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Document
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Academic Qualifications */}
        {appData.academicQualifications &&
          appData.academicQualifications.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Academic Qualifications (
                {appData.academicQualifications.length})
              </h2>
              <div className="space-y-4">
                {appData.academicQualifications.map(
                  (qual: any, index: number) => (
                    <div
                      key={index}
                      className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50"
                    >
                      <p className="font-medium">
                        {qual.name} - {qual.educationLevel}
                      </p>
                      <p className="text-sm text-gray-600">
                        {qual.institutionName}
                      </p>
                      {qual.grade && (
                        <p className="text-sm text-gray-600">
                          Grade: {qual.grade}
                          {qual.gpa ? ` (GPA: ${qual.gpa})` : ""}
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          )}
      </div>

      {/* Status Change Modal */}
      {statusModal.applicationId && (
        <StatusChangeModal
          open={statusModal.open}
          onClose={() =>
            setStatusModal({
              open: false,
              applicationId: applicationId!,
              applicationRef: "",
              currentStatus: undefined,
              currentRegistered: false,
            })
          }
          applicationId={statusModal.applicationId}
          applicationRef={statusModal.applicationRef}
          currentStatus={statusModal.currentStatus}
          availableStatuses={availableStatuses}
          onStatusChange={handleStatusChange}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

export default ViewApplicationPage;
