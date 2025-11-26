// app/application/new/page.tsx
import React from "react";
import WizardForm from "@/app/(components)/WizardForm";
import Link from "next/link";

const EditApplicationPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-4">
        <Link
          href="/application"
          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 mb-4"
        >
          ← Back to Applications
        </Link>

        <WizardForm
          onComplete={() => {
            // Optional: redirect after completion
            window.location.href = "/applications";
          }}
        />
      </div>
    </div>
  );
};

export default EditApplicationPage;
