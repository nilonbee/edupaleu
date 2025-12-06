// app/application/new/NewApplicationClient.tsx
"use client";

import React, { useEffect } from "react";
import WizardForm from "@/app/(components)/WizardForm";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/app/redux";
import { resetApplication } from "@/state/applicationSlice";
import { clearAllSessionFiles } from "@/utils/getFileFromSessionStorage";
import { APPLICATION_CONSTANTS } from "@/utils/constants";

const NewApplicationPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Start with a clean slate so previous form data does not leak
    dispatch(resetApplication());
    clearAllSessionFiles();
    localStorage.removeItem(APPLICATION_CONSTANTS.STORAGE_KEYS.APPLICATION_WIZARD);
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-4">
        <Link
          href="/applications"
          className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-gray-700 mx-4 mb-4"
        >
          ← Back
        </Link>

        <WizardForm
          onComplete={() => {
            router.push("/applications");
          }}
        />
      </div>
    </div>
  );
};

export default NewApplicationPage;
