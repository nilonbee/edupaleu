// components/steps/StudentSelection.tsx
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setStudent } from "@/state/applicationSlice";
import { useGetStudentsQuery } from "@/state/api";
import { FormInputB } from "@/app/(components)/FormInputB";
import { Student } from "@/types/applications";

export const StudentSelection: React.FC = () => {
  const { setValue } = useFormContext();
  const dispatch = useAppDispatch();
  const { data: students, isLoading, error } = useGetStudentsQuery();
  const { student } = useAppSelector((state) => state.application); // Add this

  useEffect(() => {
    if (student?.id) {
      setValue("studentId", student.id.toString());
    }
  }, [student, setValue]);

  const handleStudentSelect = (studentId: string) => {
    const student = students?.find((s) => s.id === parseInt(studentId));
    if (student) {
      const completeStudent: Student = {
        ...student,
        dateOfBirth: "",
        gender: "MALE",
        hasEnglishTest: false,
      };
      dispatch(setStudent(completeStudent));

      Object.entries(completeStudent).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          setValue(key, value);
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Student Selection
      </h2>
      <p className="text-gray-600 mb-6">
        Select an existing student or continue to create a new one.
      </p>

      <FormInputB
        label="Select Existing Student"
        name="studentId"
        type="select"
        options={
          students?.map((s) => ({
            value: s.id.toString(),
            label: `${s.firstName} ${s.lastName} (${s.studentId})`,
          })) || []
        }
        className="mb-6"
        onChange={(value: string) => handleStudentSelect(value)}
      />

      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="mx-4 text-gray-500 text-sm">OR</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      <div className="text-center">
        <p className="text-gray-600 mb-4">
          Can&apos;t find your student? Continue to fill the student details
          manually.
        </p>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">
            Error loading students. Please try again.
          </p>
        </div>
      )}
    </div>
  );
};
