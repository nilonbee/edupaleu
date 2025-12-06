"use client";
import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import WizardForm from "@/app/(components)/WizardForm";
import {
  useGetApplicationQuery,
  ApplicationResponseData,
} from "@/state/applicationApi";
import { useAppDispatch } from "@/app/redux";
import {
  loadApplicationData,
  resetApplication,
} from "@/state/applicationSlice";
import {
  Student,
  University,
  AcademicQualification,
  ApplicationDocument,
  IntendedProgram,
} from "@/types/applications";
import { fetchS3Documents } from "@/utils/fetchS3Document";
import { logger } from "@/utils/logger";
import { CardSkeleton } from "@/app/(components)/LoadingSkeleton";
import { clearAllSessionFiles } from "@/utils/getFileFromSessionStorage";
import { APPLICATION_CONSTANTS } from "@/utils/constants";

const EditApplicationPage = () => {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const applicationId = params?.id ? parseInt(params.id as string) : null;

  const {
    data: application,
    isLoading,
    error,
  } = useGetApplicationQuery(applicationId!, {
    skip: !applicationId,
  });

  useEffect(() => {
    // Ensure no stale draft data bleeds into edit flow
    dispatch(resetApplication());
    clearAllSessionFiles();
    localStorage.removeItem(
      APPLICATION_CONSTANTS.STORAGE_KEYS.APPLICATION_WIZARD
    );
  }, [dispatch]);

  useEffect(() => {
    const loadApplication = async () => {
      if (application && application.data) {
        const appData = application.data; // Now properly typed

        // Fetch S3 documents and store in sessionStorage
        const documentsToFetch = (appData.documents || [])
          .filter((doc) => doc.filePath && !doc.filePath.startsWith("file_"))
          .map((doc) => ({
            url: doc.filePath,
            fileName: doc.fileName,
            documentType: doc.documentType,
          }));

        let fetchedDocuments: Array<{
          documentType: string;
          fileId: string | null;
          fileName: string;
        }> = [];
        if (documentsToFetch.length > 0) {
          try {
            fetchedDocuments = await fetchS3Documents(documentsToFetch);
          } catch (error) {
            logger.error("Error fetching S3 documents:", error);
          }
        }

        // Create a map of documentType to fileId (filter out null fileIds)
        const fileIdMap = new Map<string, string>(
          fetchedDocuments
            .filter((d) => d.fileId !== null)
            .map((d) => [d.documentType, d.fileId as string])
        );

        // Fetch marriage certificate if exists
        // Note: marriageCertificatePath is stored in student table but not always included in response
        let marriageCert: ApplicationDocument | undefined = undefined;
        const studentForMarriageCert = appData.student as any;
        const marriageCertPath =
          studentForMarriageCert?.marriageCertificatePath;
        if (marriageCertPath) {
          try {
            const { fetchS3Document } = await import("@/utils/fetchS3Document");
            const fileId = await fetchS3Document(
              marriageCertPath,
              "marriage-certificate.pdf",
              "MARRIAGE_CERTIFICATE"
            );
            marriageCert = {
              documentType: "MARRIAGE_CERTIFICATE",
              fileName: "marriage-certificate.pdf",
              filePath: marriageCertPath,
              url: marriageCertPath,
              fileId: fileId || undefined,
            } as ApplicationDocument;
          } catch (error) {
            logger.error("Error fetching marriage certificate:", error);
            marriageCert = {
              documentType: "MARRIAGE_CERTIFICATE",
              fileName: "marriage-certificate.pdf",
              filePath: marriageCertPath,
              url: marriageCertPath,
            } as ApplicationDocument;
          }
        }

        // Transform academic qualifications - now at application level
        const sourceQualifications = appData.academicQualifications || [];

        // Convert dates from DateTime to string format (YYYY-MM-DD)
        const formatDate = (date: any): string => {
          if (!date) return "";
          try {
            const d = new Date(date);
            return d.toISOString().split("T")[0];
          } catch {
            return typeof date === "string" ? date : "";
          }
        };

        const transformedQualifications: AcademicQualification[] =
          sourceQualifications.map((qual) => {
            const transformed: AcademicQualification = {
              name: qual.name || "",
              educationLevel: (qual.educationLevel || "OTHER") as
                | "OL"
                | "AL"
                | "BACHELORS"
                | "MASTERS"
                | "PHD"
                | "OTHER",
              institutionName: qual.institutionName || "",
              programName: qual.programName || undefined,
              startDate: formatDate(qual.startDate),
              endDate: qual.endDate ? formatDate(qual.endDate) : undefined,
              grade: qual.grade || undefined,
              gpa: qual.gpa ? parseFloat(qual.gpa.toString()) : undefined,
              isCompleted:
                qual.isCompleted !== undefined
                  ? Boolean(qual.isCompleted)
                  : true,
              documentPath: qual.documentPath || undefined,
            };
            // Only include id if it exists (for existing qualifications)
            if (qual.id !== undefined && qual.id !== null) {
              transformed.id = qual.id;
            }
            return transformed;
          });

        // Transform the API response to match the form state structure
        // Note: Backend returns minimal student data in response, need to fetch full student if needed
        // For now, we'll need to get additional student fields from the full student record
        // But for edit flow, we'll work with what we have
        const apiStudent = appData.student;
        // Reuse studentForMarriageCert which is already defined above
        const fullStudentData = studentForMarriageCert; // Full student may have more fields

        const formStudent: Student = {
          id: apiStudent.id,
          studentId: fullStudentData.studentId || "",
          firstName: apiStudent.firstName,
          lastName: apiStudent.lastName,
          dateOfBirth: fullStudentData.dateOfBirth
            ? typeof fullStudentData.dateOfBirth === "string"
              ? fullStudentData.dateOfBirth
              : new Date(fullStudentData.dateOfBirth)
                  .toISOString()
                  .split("T")[0]
            : "",
          gender:
            (fullStudentData.gender?.toUpperCase() as
              | "MALE"
              | "FEMALE"
              | "OTHER") || "OTHER",
          email: apiStudent.email,
          phone: fullStudentData.phone,
          nationality: fullStudentData.nationality,
          passportNumber: fullStudentData.passportNumber,
          displayPicture: fullStudentData.displayPicture,
          passportExpiry: fullStudentData.passportExpiry
            ? typeof fullStudentData.passportExpiry === "string"
              ? fullStudentData.passportExpiry
              : new Date(fullStudentData.passportExpiry)
                  .toISOString()
                  .split("T")[0]
            : undefined,
          address: fullStudentData.address,
          city: fullStudentData.city,
          state: fullStudentData.state,
          zipCode: fullStudentData.zipCode,
          emergencyContactName: fullStudentData.emergencyContactName,
          emergencyContactPhone: fullStudentData.emergencyContactPhone,
          hasEnglishTest: fullStudentData.hasEnglishTest || false,
          englishTestType: fullStudentData.englishTestType,
          englishTestScore: fullStudentData.englishTestScore,
          englishTestDate: fullStudentData.englishTestDate
            ? typeof fullStudentData.englishTestDate === "string"
              ? fullStudentData.englishTestDate
              : new Date(fullStudentData.englishTestDate)
                  .toISOString()
                  .split("T")[0]
            : undefined,
        };

        const formData = {
          student: formStudent,
          university: {
            id: appData.university.id,
            name: appData.university.name,
            countryId: appData.university.country?.code
              ? parseInt(appData.university.country.code)
              : (appData.university as any).countryId || 0,
            website: appData.university.website,
            ranking: appData.university.ranking,
            tuitionFeeRange:
              (appData.university as any).tuition_fee_range ||
              (appData.university as any).tuitionFeeRange,
          } as University,
          academicQualifications: transformedQualifications,
          documents: (appData.documents || []).map((doc) => {
            const fileId = fileIdMap.get(doc.documentType);
            return {
              documentType: doc.documentType,
              fileName: doc.fileName,
              filePath: doc.filePath,
              fileSize: doc.fileSize,
              url: doc.filePath, // S3 URL
              fileId: fileId, // fileId from sessionStorage if fetched
            } as ApplicationDocument;
          }),
          maritalStatus: (fullStudentData?.maritalStatus || "SINGLE") as
            | "SINGLE"
            | "MARRIED"
            | "DIVORCED"
            | "WIDOWED",
          marriageCertificate: marriageCert,
          intendedPrograms: (appData.intendedPrograms || []).map((prog) => ({
            country: prog.country,
            programme: prog.programme,
            university: prog.university,
          })) as IntendedProgram[],
        };

        dispatch(loadApplicationData(formData));
      }
    };

    loadApplication();
  }, [application, dispatch]);

  if (!applicationId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-red-600 mb-4">Invalid application ID</p>
          <Link
            href="/applications"
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-orange-600 rounded shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-150"
          >
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-red-600 mb-4">Error loading application</p>
          <Link
            href="/applications"
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-orange-600 rounded shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-150"
          >
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-4">
        <Link
          href="/applications"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-150 mx-4 mb-4"
        >
          ← Back to Applications
        </Link>

        <WizardForm
          applicationId={applicationId.toString()}
          onComplete={() => {
            router.push("/applications");
          }}
        />
      </div>
    </div>
  );
};

export default EditApplicationPage;
