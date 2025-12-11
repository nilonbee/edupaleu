"use client";
import React, { useState } from "react";
import { EnquiriesTable } from "@/app/(components)/EnquiriesTable";
import { CreateEnquiryModal } from "@/app/(components)/EnquiriesTable/CreateEnquiryModal";
import { EditEnquiryModal } from "@/app/(components)/EnquiriesTable/EditEnquiryModal";
import { useAppSelector } from "@/app/redux";

const EnquiriesPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEnquiryId, setEditingEnquiryId] = useState<number | null>(null);

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const handleEdit = (id: number) => {
    setEditingEnquiryId(id);
  };

  const handleCloseCreate = () => {
    setIsCreateModalOpen(false);
  };

  const handleCloseEdit = () => {
    setEditingEnquiryId(null);
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Enquiries</h1>
        <p className="text-gray-600 mt-1">
          Manage enquiries and convert them to applications
        </p>
      </div>

      <EnquiriesTable onCreate={handleCreate} onEdit={handleEdit} />

      {isCreateModalOpen && (
        <CreateEnquiryModal
          open={isCreateModalOpen}
          onClose={handleCloseCreate}
        />
      )}

      {editingEnquiryId && (
        <EditEnquiryModal
          open={!!editingEnquiryId}
          enquiryId={editingEnquiryId}
          onClose={handleCloseEdit}
        />
      )}
    </>
  );
};

export default EnquiriesPage;
