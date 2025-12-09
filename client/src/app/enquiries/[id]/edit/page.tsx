"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { EditEnquiryModal } from "@/app/(components)/EnquiriesTable/EditEnquiryModal";

export default function EditEnquiryPage() {
  const params = useParams();
  const router = useRouter();
  const enquiryId = parseInt(params.id as string, 10);

  const handleClose = () => {
    router.push(`/enquiries/${enquiryId}`);
  };

  return (
    <EditEnquiryModal
      open={true}
      enquiryId={enquiryId}
      onClose={handleClose}
    />
  );
}

