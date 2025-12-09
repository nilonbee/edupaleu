// app/applications/page.tsx
"use client";
import React from "react";
import { ApplicationsTable } from "@/app/(components)/ApplicationsTable";
import Button from "@/app/(components)/Button";
import { Plus } from "lucide-react";

const ApplicationsPage = () => {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Applications</h1>

        <Button
          as="link"
          href="/applications/new"
          variant="primary"
          size="md"
          className="flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Start New Application
        </Button>
      </div>

      <ApplicationsTable />
    </>
  );
};

export default ApplicationsPage;
