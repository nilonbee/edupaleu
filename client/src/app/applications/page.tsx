// app/applications/page.tsx
"use client";
import React from "react";
import Link from "next/link";
import { ApplicationsTable } from "@/app/(components)/ApplicationsTable";

const ApplicationsPage = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Applications</h1>

        <Link
          href="/applications/new"
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Start New Application
        </Link>
      </div>

      <ApplicationsTable />
    </div>
  );
};

export default ApplicationsPage;
