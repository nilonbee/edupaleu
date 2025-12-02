// components/steps/StudentDetails.tsx
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useAppSelector } from "@/app/redux";
import { FormInputB } from "@/app/(components)/FormInputB";

export const StudentDetails: React.FC = () => {
  const { watch, setValue } = useFormContext();
  const { student } = useAppSelector((state) => state.application);

  const hasEnglishTest = watch("hasEnglishTest");
  const englishTestType = watch("englishTestType");

  const genderOptions = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" },
  ];

  const englishTestOptions = [
    { value: "none", label: "None" },
    { value: "IELTS", label: "IELTS" },
    { value: "TOEFL", label: "TOEFL" },
    { value: "PTE", label: "PTE" },
    { value: "DUOLINGO", label: "Duolingo" },
  ];

  // Pre-populate form fields from Redux state
  useEffect(() => {
    if (student) {
      console.log("Pre-populating form with student data:", student);

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

      // Emergency contact
      setValue("emergencyContactName", student.emergencyContactName || "");
      setValue("emergencyContactPhone", student.emergencyContactPhone || "");

      // English test information
      setValue("hasEnglishTest", student.hasEnglishTest || false);
      setValue("englishTestType", student.englishTestType || "none");
      setValue("englishTestScore", student.englishTestScore || "");
      setValue("englishTestDate", student.englishTestDate || "");
    }
  }, [student, setValue]);

  // Handle checkbox change manually to ensure proper updates
  const handleCheckboxChange = (value: string) => {
    const isChecked = value === "true";
    setValue("hasEnglishTest", isChecked);

    // If unchecking, clear the English test fields
    if (!isChecked) {
      setValue("englishTestType", "none");
      setValue("englishTestScore", "");
      setValue("englishTestDate", "");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Student Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <FormInputB label="First Name" name="firstName" required />
        <FormInputB label="Last Name" name="lastName" required />
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
