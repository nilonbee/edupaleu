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
} from "lucide-react";
import Link from "next/link";

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

        {/* Remarks */}
        {enquiry.remarks && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Remarks</h2>
            <p className="p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
              {enquiry.remarks}
            </p>
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
