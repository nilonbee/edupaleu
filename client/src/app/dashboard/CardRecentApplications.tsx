import { useGetApplicationsQuery } from "@/state/applicationApi";
import { FileText, Calendar, User } from "lucide-react";
import React from "react";
import Image from "next/image";

export const CardRecentApplications = () => {
  // Fetch only recent applications (limit to 5 for dashboard)
  const { data: applicationsResponse, isLoading } = useGetApplicationsQuery({
    limit: 5,
    sort_by: 'updatedAt',
    order: 'desc',
  });

  // Extract applications array from response (handles both array and response object formats)
  const applications = React.useMemo(() => {
    if (!applicationsResponse) return [];
    
    // Handle both old array format and new response format
    if (Array.isArray(applicationsResponse)) {
      return applicationsResponse;
    }
    
    if ('data' in applicationsResponse && Array.isArray(applicationsResponse.data)) {
      return applicationsResponse.data;
    }
    
    return [];
  }, [applicationsResponse]);

  // Function to get status color
  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      accepted: "bg-green-100 text-green-600",
      submitted: "bg-blue-100 text-blue-600",
      under_review: "bg-yellow-100 text-yellow-600",
      rejected: "bg-red-100 text-red-600",
      draft: "bg-gray-100 text-gray-600",
      waitlisted: "bg-cyan-100 text-cyan-600",
      visa_applied: "bg-purple-100 text-purple-600",
      enrolled: "bg-emerald-100 text-emerald-600",
      additional_docs_required: "bg-amber-100 text-amber-600",
    };
    return statusColors[status] || "bg-gray-100 text-gray-600";
  };

  // Function to format status text
  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="row-span-3 xl:row-span-6 bg-white shadow-md rounded-2xl flex flex-col h-full">
      {isLoading ? (
        <div className="m-5">Loading...</div>
      ) : (
        <>
          <div className="flex-shrink-0">
            <h3 className="text-lg font-semibold px-7 pt-5 pb-2">
              Recent Applications
            </h3>
            <hr />
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {applications.length === 0 ? (
              <div className="text-center text-gray-500 py-8 px-5">
                No recent applications
              </div>
            ) : (
              applications.map((application) => (
              <div
                key={application.id}
                className="flex items-center justify-between gap-3 px-5 py-4 border-b hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Student Avatar */}
                  <div className="relative flex-shrink-0">
                    <Image
                      src={`${application.student.displayPicture}`}
                      alt={`${application.student.firstName} ${application.student.lastName}`}
                      width={48}
                      height={48}
                      className="rounded-lg w-12 h-12 border flex-shrink-0"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                      <FileText className="w-3 h-3 text-blue-500" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    {/* Student Name and Program */}
                    <div className="font-semibold text-gray-800 truncate">
                      {application.student.firstName}{" "}
                      {application.student.lastName}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {application.intendedProgram}
                    </div>

                    {/* University and Intake */}
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <span className="truncate flex-1 min-w-0">
                        {application.university.name}
                      </span>
                      <span className="mx-2 flex-shrink-0">•</span>
                      <div className="flex items-center text-xs text-gray-500 flex-shrink-0">
                        <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="whitespace-nowrap">
                          {application.intakeMonth} {application.intakeYear}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status and Application Ref */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(
                      application.applicationStatus?.status || "draft"
                    )}`}
                  >
                    {formatStatus(
                      application.applicationStatus?.status || "draft"
                    )}
                  </span>
                  <div className="text-xs text-gray-500 flex items-center whitespace-nowrap">
                    <User className="w-3 h-3 mr-1" />
                    {application.applicationRef}
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
