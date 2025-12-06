// components/steps/ReviewSubmit.tsx
import { useMemo } from "react";
import { useAppSelector } from "@/app/redux";
import { useGetUniversitiesQuery } from "@/state/api";

export const ReviewSubmit: React.FC = () => {
  // Removed submission logic - handled by WizardForm

  const {
    student,
    selectedUniversity,
    academicQualifications,
    documents,
    maritalStatus,
    marriageCertificate,
    intendedPrograms,
  } = useAppSelector((state) => state.application);

  const { data: universities } = useGetUniversitiesQuery();

  const selectedUni = useMemo(() => {
    return universities?.find(
      (u) => u.id.toString() === selectedUniversity?.id?.toString()
    );
  }, [universities, selectedUniversity]);

  const documentTypeNames: { [key: string]: string } = {
    OL_CERTIFICATE: "OL Certificate",
    AL_CERTIFICATE: "AL Certificate",
    BACHELORS_CERTIFICATE: "Bachelors Certificate",
    MASTERS_CERTIFICATE: "Masters Certificate",
    LANGUAGE_PROFICIENCY: "Language Proficiency",
    PASSPORT: "Passport Copy",
    PHOTOGRAPH: "Photograph",
    CV: "Curriculum Vitae",
    RECOMMENDATION_LETTER: "Recommendation Letter",
    MARRIAGE_CERTIFICATE: "Marriage Certificate",
    OTHER: "Other Documents",
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get document count by type
  const getDocumentCount = (type: string) => {
    return documents.filter((doc) => doc.documentType === type).length;
  };

  // Group documents by type for better display
  const groupedDocuments = useMemo(() => {
    return documents.reduce((acc, doc) => {
      const typeName = documentTypeNames[doc.documentType] || doc.documentType;
      if (!acc[typeName]) {
        acc[typeName] = [];
      }
      acc[typeName].push(doc);
      return acc;
    }, {} as Record<string, typeof documents>);
  }, [documents]);

  // Check for missing required fields
  const missingFields = [];
  if (!student) missingFields.push("Student information");
  if (!selectedUniversity) missingFields.push("University selection");
  if (academicQualifications.length === 0)
    missingFields.push("Academic qualifications");
  if (intendedPrograms.length === 0) missingFields.push("Intended programs");

  // Check for required documents (based on your documentTypes array)
  const requiredDocuments = [
    "OL_CERTIFICATE",
    "AL_CERTIFICATE",
    "BACHELORS_CERTIFICATE",
    "PASSPORT",
    "PHOTOGRAPH",
    "CV",
  ];
  const missingDocuments = requiredDocuments.filter(
    (docType) => !documents.some((doc) => doc.documentType === docType)
  );

  if (missingDocuments.length > 0) {
    missingFields.push(
      `Missing documents: ${missingDocuments
        .map((doc) => documentTypeNames[doc] || doc)
        .join(", ")}`
    );
  }

  // Check marriage certificate for married applicants
  if (maritalStatus === "MARRIED" && !marriageCertificate) {
    missingFields.push("Marriage certificate");
  }

  const isFormValid = missingFields.length === 0;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Review & Submit</h2>
      <p className="text-gray-600 mb-6">
        Please review all the information before submitting your application.
      </p>

      {!isFormValid && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold mb-2">
            Missing Required Information
          </h3>
          <ul className="text-red-700 text-sm list-disc list-inside space-y-1">
            {missingFields.map((field, index) => (
              <li key={index}>{field}</li>
            ))}
          </ul>
          <p className="text-red-600 text-sm mt-2">
            Please go back and complete all required fields before submitting.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Student Information */}
        <section className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Student Information
          </h3>
          {student ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <strong className="text-gray-700">Full Name:</strong>
                  <p>
                    {student.firstName} {student.lastName}
                  </p>
                </div>
                <div>
                  <strong className="text-gray-700">Email:</strong>
                  <p>{student.email}</p>
                </div>
                <div>
                  <strong className="text-gray-700">Phone:</strong>
                  <p>{student.phone || "Not provided"}</p>
                </div>
                <div>
                  <strong className="text-gray-700">Student ID:</strong>
                  <p>{student.studentId}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <strong className="text-gray-700">Nationality:</strong>
                  <p>{student.nationality || "Not provided"}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-red-600">No student information provided</p>
          )}
        </section>

        {/* University Selection */}
        <section className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Selected University
          </h3>
          {selectedUni ? (
            <div className="space-y-2">
              <div>
                <strong className="text-gray-700">University:</strong>
                <p className="font-medium">{selectedUni.name}</p>
              </div>
              {selectedUni.country && (
                <div>
                  <strong className="text-gray-700">Country:</strong>
                  <p>
                    {selectedUni.country?.name ||
                      selectedUni.country?.code ||
                      "Not provided"}
                  </p>
                </div>
              )}
              {selectedUni.ranking && (
                <div>
                  <strong className="text-gray-700">Ranking:</strong>
                  <p>{selectedUni.ranking}</p>
                </div>
              )}
              {selectedUni.website && (
                <div>
                  <strong className="text-gray-700">Website:</strong>
                  <a
                    href={selectedUni.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {selectedUni.website}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <p className="text-red-600">
              {selectedUniversity
                ? "University not found"
                : "No university selected"}
            </p>
          )}
        </section>

        {/* Academic Qualifications */}
        <section className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Academic Qualifications ({academicQualifications.length})
          </h3>
          {academicQualifications.length > 0 ? (
            <div className="space-y-4">
              {academicQualifications.map((qual, index) => (
                <div
                  key={index}
                  className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {qual.name} - {qual.educationLevel}
                      </p>
                      <p className="text-sm text-gray-600">
                        {qual.institutionName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {qual.startDate
                          ? new Date(qual.startDate).toLocaleDateString()
                          : "N/A"}{" "}
                        -{" "}
                        {qual.endDate
                          ? new Date(qual.endDate).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        Grade: {qual.grade}{" "}
                        {qual.gpa ? `(GPA: ${qual.gpa})` : ""}
                      </p>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          qual.isCompleted
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {qual.isCompleted ? "Completed" : "In Progress"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-red-600">No academic qualifications added</p>
          )}
        </section>

        {/* Documents */}
        <section className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Documents ({documents.length} uploaded)
          </h3>
          {documents.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedDocuments).map(([docType, docs]) => (
                <div
                  key={docType}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <h4 className="font-medium text-gray-700 mb-2">{docType}</h4>
                  <div className="space-y-2">
                    {docs.map((doc, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <div>
                          <p className="font-medium">{doc.fileName}</p>
                          <p className="text-sm text-gray-600">
                            {formatFileSize(doc.fileSize || 0)} •{" "}
                            {doc.fileType?.split("/")[1]?.toUpperCase() ||
                              "Unknown"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            Ready
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Total files size */}
              <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">
                    Total Files Size:
                  </span>
                  <span className="font-bold">
                    {formatFileSize(
                      documents.reduce(
                        (sum, doc) => sum + (doc.fileSize || 0),
                        0
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-red-600">No documents uploaded</p>
          )}
        </section>

        {/* Marital Status */}
        <section className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Marital Status
          </h3>
          <div className="space-y-4">
            <div>
              <strong className="text-gray-700">Status:</strong>
              <span
                className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                  maritalStatus === "SINGLE"
                    ? "bg-blue-100 text-blue-800"
                    : maritalStatus === "MARRIED"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {maritalStatus}
              </span>
            </div>

            {maritalStatus === "MARRIED" && marriageCertificate && (
              <div className="p-4 bg-green-50 rounded border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">
                  Marriage Certificate
                </h4>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {marriageCertificate.fileName}
                    </p>
                    <p className="text-sm text-green-600">
                      {formatFileSize(marriageCertificate.fileSize || 0)}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Uploaded
                  </span>
                </div>
              </div>
            )}

            {(maritalStatus === "DIVORCED" || maritalStatus === "WIDOWED") && (
              <div className="p-4 bg-blue-50 rounded border border-blue-200">
                <p className="text-blue-700 text-sm">
                  Please consult with your education consultant about any
                  additional required documents.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Intended Programs */}
        <section className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Intended Programs ({intendedPrograms.length})
          </h3>
          {intendedPrograms.length > 0 ? (
            <div className="space-y-4">
              {intendedPrograms.map((program, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <strong className="text-gray-700">Country:</strong>
                      <p className="font-medium">{program.country}</p>
                    </div>
                    <div>
                      <strong className="text-gray-700">University:</strong>
                      <p>{program.university}</p>
                    </div>
                    <div>
                      <strong className="text-gray-700">Program:</strong>
                      <p>{program.programme}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-red-600">No intended programs added</p>
          )}
        </section>

        {/* Submission Summary */}
        <section className="border border-gray-200 rounded-lg p-6 bg-blue-50">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Application Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded border">
              <div className="text-2xl font-bold text-blue-600">
                {academicQualifications.length}
              </div>
              <div className="text-sm text-gray-600">Qualifications</div>
            </div>
            <div className="text-center p-4 bg-white rounded border">
              <div className="text-2xl font-bold text-blue-600">
                {documents.length}
              </div>
              <div className="text-sm text-gray-600">Documents</div>
            </div>
            <div className="text-center p-4 bg-white rounded border">
              <div className="text-2xl font-bold text-blue-600">
                {intendedPrograms.length}
              </div>
              <div className="text-sm text-gray-600">Programs</div>
            </div>
            <div className="text-center p-4 bg-white rounded border">
              <div className="text-2xl font-bold text-blue-600">
                {isFormValid ? "Ready" : "Incomplete"}
              </div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
          </div>

          {/* Submission Button */}
          {/* <div className="mt-6 pt-6 border-t border-gray-300">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                {isFormValid ? (
                  <p className="text-green-600">
                    ✅ All required information is complete. You can now submit
                    your application.
                  </p>
                ) : (
                  <p className="text-red-600">
                    ⚠️ Please complete all required fields before submitting.
                  </p>
                )}
              </div>
              <button
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isFormValid
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                disabled={!isFormValid}
                onClick={handleSubmit}
              >
                Submit Application
              </button>
            </div>
          </div> */}
        </section>
      </div>
    </div>
  );
};
