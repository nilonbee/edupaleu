"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetSingleEnquiryQuery } from "@/state/enquiryApi";
import Button from "@/app/(components)/Button";
import {
  ArrowLeft,
  Edit,
  FileText,
  Mail,
  Phone,
  User,
  Calendar,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

// Parse remarks string to extract text, user, and timestamp
// Format: "timestamp||text||user" (timestamp first for sortability)
const parseRemarks = (
  remarks: string | null | undefined
): { text: string; user: string; timestamp: string } | null => {
  if (!remarks) return null;
  const parts = remarks.split("||");
  if (parts.length >= 3) {
    // New format: timestamp||text||user
    return {
      timestamp: parts[0] || "",
      text: parts[1] || "",
      user: parts[2] || "",
    };
  } else if (parts.length === 2) {
    // Could be old format (text||user) or partial - check if first part looks like ISO date
    if (parts[0].match(/^\d{4}-\d{2}-\d{2}T/)) {
      // Looks like new format with missing user
      return { timestamp: parts[0], text: parts[1], user: "" };
    }
    // Old format: text||user (no timestamp)
    return { text: parts[0], user: parts[1], timestamp: "" };
  }
  // Legacy format without delimiter - just text
  return { text: remarks, user: "", timestamp: "" };
};

// Get initials from name
const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name[0]?.toUpperCase() || "?";
};

// Get consistent color based on username string (hash-based)
const getColorFromUsername = (username: string): string => {
  if (!username) return "bg-gray-500";
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-orange-500",
    "bg-teal-500",
    "bg-cyan-500",
  ];
  // Simple hash from username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function ViewEnquiryPage() {
  const params = useParams();
  const router = useRouter();
  const enquiryId = parseInt(params.id as string, 10);

  const {
    data: enquiryResponse,
    isLoading,
    error,
  } = useGetSingleEnquiryQuery(enquiryId);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading enquiry...</p>
        </div>
      </div>
    );
  }

  if (error || !enquiryResponse?.data) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Enquiry Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The enquiry you&apos;re looking for doesn&apos;t exist or has been
            deleted.
          </p>
          <Button as="link" href="/enquiries" variant="primary" size="md">
            Back to Enquiries
          </Button>
        </div>
      </div>
    );
  }

  const enquiry = enquiryResponse.data;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/enquiries">
            <Button variant="secondary" size="sm" className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>

          <h1 className="text-2xl font-bold">Enquiry Details</h1>
        </div>
        <Link href={`/enquiries/${enquiry.id}/edit`}>
          <Button variant="primary" size="md" className="flex items-center">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Basic Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">First Name</label>
              <p className="font-medium">{enquiry.firstName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Last Name</label>
              <p className="font-medium">{enquiry.lastName || "-"}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600 flex items-center gap-1">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <p className="font-medium">{enquiry.email || "-"}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600 flex items-center gap-1">
                <Phone className="w-4 h-4" />
                Phone
              </label>
              <p className="font-medium">{enquiry.phone}</p>
            </div>
          </div>
        </div>

        {/* CV Document */}
        {enquiry.cvDocument && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              CV Document
            </h2>
            <a
              href={enquiry.cvDocument}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              View CV Document
            </a>
          </div>
        )}

        {/* Assignment */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Assignment</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Created By</label>
              <p className="font-medium">{enquiry.createdBy || "-"}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Assigned To</label>
              <p className="font-medium">
                {enquiry.assignedTo
                  ? `${enquiry.assignedTo.firstName} ${enquiry.assignedTo.lastName}`
                  : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Follow-up Remarks */}
        {(enquiry.firstFollowUpRemarks ||
          enquiry.secondFollowUpRemarks ||
          enquiry.thirdFollowUpRemarks) && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Follow-up Remarks</h2>
            <div className="space-y-4">
              {enquiry.firstFollowUpRemarks && (
                <div>
                  <label className="text-sm text-gray-600">
                    First Follow-up
                  </label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {enquiry.firstFollowUpRemarks}
                  </p>
                </div>
              )}
              {enquiry.secondFollowUpRemarks && (
                <div>
                  <label className="text-sm text-gray-600">
                    Second Follow-up
                  </label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {enquiry.secondFollowUpRemarks}
                  </p>
                </div>
              )}
              {enquiry.thirdFollowUpRemarks && (
                <div>
                  <label className="text-sm text-gray-600">
                    Third Follow-up
                  </label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {enquiry.thirdFollowUpRemarks}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next Step */}
        {enquiry.remarks && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Next Step
            </h2>
            {(() => {
              const parsed = parseRemarks(enquiry.remarks);
              if (!parsed) return null;
              return (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <p className="text-gray-800 whitespace-pre-wrap mb-3">
                    {parsed.text}
                  </p>
                  {parsed.user && (
                    <div className="flex items-center gap-2 pt-3 border-t border-blue-200">
                      <div
                        className={`w-8 h-8 rounded-full ${getColorFromUsername(
                          parsed.user
                        )} flex items-center justify-center text-white text-sm font-bold`}
                      >
                        {getInitials(parsed.user)}
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        {parsed.user}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Related Applications */}
        {enquiry.applications && enquiry.applications.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Related Applications</h2>
            <div className="space-y-2">
              {enquiry.applications.map((app) => (
                <Link
                  key={app.id}
                  href={`/applications/${app.id}`}
                  className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{app.applicationRef}</p>
                      <p className="text-sm text-gray-600">
                        {app.intendedProgram}
                      </p>
                    </div>
                    {app.applicationStatus && (
                      <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm">
                        {app.applicationStatus.status}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t">
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              const enquiryData = encodeURIComponent(
                JSON.stringify({
                  enquiryId: enquiry.id,
                  firstName: enquiry.firstName,
                  lastName: enquiry.lastName || "",
                  email: enquiry.email || "",
                  phone: enquiry.phone,
                  countryId: enquiry.countryId,
                })
              );
              router.push(`/applications/new?enquiry=${enquiryData}`);
            }}
            className="flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            Create Application
          </Button>
        </div>

        {/* Metadata */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Created: {new Date(enquiry.createdAt).toLocaleString()}</span>
            {enquiry.updatedAt !== enquiry.createdAt && (
              <>
                <span>•</span>
                <span>
                  Updated: {new Date(enquiry.updatedAt).toLocaleString()}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
