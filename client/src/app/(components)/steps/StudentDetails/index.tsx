// components/steps/StudentDetails.tsx
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useAppSelector } from "@/app/redux";
import { FormInputB } from "@/app/(components)/FormInputB";
import { logger } from "@/utils/logger";

export const StudentDetails: React.FC = () => {
  const { watch, setValue } = useFormContext();
  const { student, fromEnquiry } = useAppSelector((state) => state.application);

  const genderOptions = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" },
  ];

  // Pre-populate form fields from Redux state
  useEffect(() => {
    if (student) {
      logger.log("Pre-populating form with student data:", student);

      // Basic information
      setValue("firstName", student.firstName || "");
      setValue("lastName", student.lastName || "");
      setValue("dateOfBirth", student.dateOfBirth || "");
      setValue("gender", student.gender || "");
      setValue("email", student.email || "");
      setValue("phone", student.phone || "");
      setValue("nationality", student.nationality || "");
      setValue("passportNumber", student.passportNumber || "");

      // Address information
      setValue("address", student.address || "");
      setValue("city", student.city || "");
      setValue("state", student.state || "");
      setValue("zipCode", student.zipCode || "");
    }
  }, [student, setValue]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Student Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <FormInputB
          label="First Name"
          name="firstName"
          required
          disabled={fromEnquiry}
        />
        <FormInputB label="Last Name" name="lastName" />
        <FormInputB label="Date of Birth" name="dateOfBirth" type="date" />
        <FormInputB
          label="Gender"
          name="gender"
          type="select"
          options={genderOptions}
        />
        <FormInputB label="Email" name="email" type="email" required />
        <FormInputB label="Phone" name="phone" type="tel" />
        <FormInputB label="Nationality" name="nationality" />
        <FormInputB label="Passport Number" name="passportNumber" />
        <FormInputB label="Passport Expiry" name="passportExpiry" type="date" />
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Address Information
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <FormInputB label="Address" name="address" type="textarea" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInputB label="City" name="city" />
            <FormInputB label="State" name="state" />
            <FormInputB label="ZIP Code" name="zipCode" />
          </div>
        </div>
      </div>
    </div>
  );
};
