// components/steps/StudentDetails.tsx
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useAppSelector } from "@/app/redux";
import { FormInputB } from "@/app/(components)/FormInputB";
import { logger } from "@/utils/logger";
import { useGetCountriesQuery } from "@/state/enquiryApi";

export const StudentDetails: React.FC = () => {
  const { watch, setValue } = useFormContext();
  const { student, fromEnquiry } = useAppSelector((state) => state.application);
  const destinationCountryId = useAppSelector(
    (state: any) => state.application.destinationCountryId
  );
  const { data: countriesResponse } = useGetCountriesQuery();
  const countries = countriesResponse?.data || [];

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
      setValue("givenEmail", student.givenEmail || "");
      setValue("phone", student.phone || "");
      setValue("secondPhone", student.secondPhone || "");
      setValue("nationality", student.nationality || "");
      setValue("passportNumber", student.passportNumber || "");

      // Address information
      setValue("address", student.address || "");
      setValue("city", student.city || "");
      setValue("state", student.state || "");
      setValue("zipCode", student.zipCode || "");
    }
  }, [student, setValue]);

  // Pre-populate destination country from Redux state (from enquiry or edit mode)
  useEffect(() => {
    if (destinationCountryId) {
      setValue("destinationCountryId", destinationCountryId.toString());
    }
  }, [destinationCountryId, setValue]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Student Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <FormInputB label="First Name" name="firstName" required />
        <FormInputB label="Last Name" name="lastName" />
        <FormInputB label="Date of Birth" name="dateOfBirth" type="date" />
        <FormInputB
          label="Gender"
          name="gender"
          type="select"
          options={genderOptions}
        />
        <FormInputB label="Email" name="email" type="email" required />
        <FormInputB label="Given Email" name="givenEmail" type="email" />
        <FormInputB
          label="Phone"
          name="phone"
          type="tel"
          disabled={fromEnquiry}
        />
        <FormInputB label="Second Phone" name="secondPhone" type="tel" />
        <FormInputB label="Nationality" name="nationality" />
        <FormInputB label="Passport Number" name="passportNumber" />
        <FormInputB label="Passport Expiry" name="passportExpiry" type="date" />
        <FormInputB
          label="Destination Country"
          name="destinationCountryId"
          type="select"
          required
          options={countries.map((country) => ({
            value: country.id.toString(),
            label: country.name,
          }))}
          placeholder="Select Destination Country"
        />
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
