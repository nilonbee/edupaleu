// app/application/new/NewApplicationClient.tsx
"use client";

import React, { useEffect } from "react";
import WizardForm from "@/app/(components)/WizardForm";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch } from "@/app/redux";
import { resetApplication, loadApplicationData } from "@/state/applicationSlice";
import { clearAllSessionFiles } from "@/utils/getFileFromSessionStorage";
import { APPLICATION_CONSTANTS } from "@/utils/constants";
import { Student } from "@/types/applications";
import Button from "@/app/(components)/Button";

const NewApplicationPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const enquiryParam = searchParams.get("enquiry");

  useEffect(() => {
    // Start with a clean slate so previous form data does not leak
    dispatch(resetApplication());
    clearAllSessionFiles();
    localStorage.removeItem(APPLICATION_CONSTANTS.STORAGE_KEYS.APPLICATION_WIZARD);

    // If enquiry data is provided, pre-populate the form
    if (enquiryParam) {
      try {
        const enquiryData = JSON.parse(decodeURIComponent(enquiryParam));
        
        // Pre-populate student data from enquiry
        if (enquiryData.firstName) {
          const studentData: Partial<Student> = {
            firstName: enquiryData.firstName,
            lastName: enquiryData.lastName || '',
            email: enquiryData.email || '',
            phone: enquiryData.phone || '',
          };

          dispatch(loadApplicationData({
            student: studentData as Student,
            academicQualifications: [],
            documents: [],
            intendedPrograms: [],
            fromEnquiry: true,
            enquiryId: enquiryData.enquiryId,
            destinationCountryId: enquiryData.countryId,
          }));
        }
      } catch (error) {
        console.error("Failed to parse enquiry data:", error);
      }
    }
  }, [dispatch, enquiryParam]);

  return (
    <>
      <div className="mb-4">
        <Link href="/applications">
          <Button variant="secondary" size="sm" className="flex items-center">
            ← Back
          </Button>
        </Link>
      </div>

      <WizardForm
        onComplete={() => {
          router.push("/applications");
        }}
      />
    </>
  );
};

export default NewApplicationPage;
