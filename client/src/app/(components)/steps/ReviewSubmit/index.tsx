// components/steps/ReviewSubmit.tsx
import React from "react";
import { useAppSelector } from "@/app/redux";
import { useGetUniversitiesQuery } from "@/state/api";

export const ReviewSubmit: React.FC = () => {
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

  const selectedUni = universities?.find((u) => u.id === selectedUniversity);

  const getDocumentCount = (type: string) => {
    return documents.filter((doc) => doc.documentType === type).length;
  };

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

  const missingFields = [];
  if (!student) missingFields.push("Student information");
  if (!selectedUniversity) missingFields.push("University selection");
  if (academicQualifications.length === 0)
    missingFields.push("Academic qualifications");
  if (intendedPrograms.length === 0) missingFields.push("Intended programs");

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
              <div>
                <p>
                  <strong>Name:</strong> {student.firstName} {student.lastName}
                </p>
                <p>
                  <strong>Email:</strong> {student.email}
                </p>
                <p>
                  <strong>Phone:</strong> {student.phone || "Not provided"}
                </p>
                <p>
                  <strong>Date of Birth:</strong> {student.dateOfBirth}
                </p>
              </div>
              <div>
                <p>
                  <strong>Gender:</strong> {student.gender}
                </p>
                <p>
                  <strong>Nationality:</strong>{" "}
                  {student.nationality || "Not provided"}
                </p>
                <p>
                  <strong>Passport:</strong>{" "}
                  {student.passportNumber || "Not provided"}
                </p>
                {student.hasEnglishTest && (
                  <p>
                    <strong>English Test:</strong> {student.englishTestType} -{" "}
                    {student.englishTestScore}
                  </p>
                )}
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
            <div>
              <p>
                <strong>University:</strong> {selectedUni.name}
              </p>
              {selectedUni.ranking && (
                <p>
                  <strong>Ranking:</strong> {selectedUni.ranking}
                </p>
              )}
              {selectedUni.website && (
                <p>
                  <strong>Website:</strong> {selectedUni.website}
                </p>
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

        {/* Rest of your sections remain the same */}
        {/* ... */}
      </div>
    </div>
  );
};
