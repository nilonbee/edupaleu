// components/steps/AcademicQualifications.tsx
import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import {
  addAcademicQualification,
  updateAcademicQualification,
  removeAcademicQualification,
} from "@/state/applicationSlice";
import { FormInputB } from "@/app/(components)/FormInputB";

export const AcademicQualifications: React.FC = () => {
  const { setValue, getValues, watch } = useFormContext();
  const dispatch = useAppDispatch();
  const { academicQualifications } = useAppSelector(
    (state) => state.application
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Watch form values for the current qualification being edited/added
  const currentQualification = watch();

  const educationLevelOptions = [
    { value: "OL", label: "Ordinary Level (OL)" },
    { value: "AL", label: "Advanced Level (AL)" },
    { value: "BACHELORS", label: "Bachelors Degree" },
    { value: "MASTERS", label: "Masters Degree" },
    { value: "PHD", label: "PhD" },
    { value: "OTHER", label: "Other" },
  ];

  const handleAddOrUpdateQualification = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission

    // Get current form values
    const formData = getValues();

    const qualificationData = {
      name: formData.qualificationName || "",
      educationLevel: formData.qualificationEducationLevel as any,
      institutionName: formData.qualificationInstitutionName || "",
      programName: formData.qualificationProgramName || undefined,
      startDate: formData.qualificationStartDate || "",
      endDate: formData.qualificationEndDate || undefined,
      grade: formData.qualificationGrade || undefined,
      gpa: formData.qualificationGpa
        ? parseFloat(formData.qualificationGpa)
        : undefined,
      isCompleted: formData.qualificationIsCompleted === "true",
    };

    // Validate  fields
    if (
      !qualificationData.name ||
      !qualificationData.educationLevel ||
      !qualificationData.institutionName ||
      !qualificationData.startDate
    ) {
      alert(
        "Please fill all  fields: Name, Education Level, Institution Name, and Start Date"
      );
      return;
    }

    if (editingIndex !== null) {
      dispatch(
        updateAcademicQualification({
          index: editingIndex,
          qualification: qualificationData,
        })
      );
      setEditingIndex(null);
    } else {
      dispatch(addAcademicQualification(qualificationData));
    }

    // Reset the form fields
    resetQualificationForm();
  };

  const resetQualificationForm = () => {
    setValue("qualificationName", "");
    setValue("qualificationEducationLevel", "");
    setValue("qualificationInstitutionName", "");
    setValue("qualificationProgramName", "");
    setValue("qualificationStartDate", "");
    setValue("qualificationEndDate", "");
    setValue("qualificationGrade", "");
    setValue("qualificationGpa", "");
    setValue("qualificationIsCompleted", "true");
  };

  const handleEdit = (index: number) => {
    const qualification = academicQualifications[index];
    setValue("qualificationName", qualification.name);
    setValue("qualificationEducationLevel", qualification.educationLevel);
    setValue("qualificationInstitutionName", qualification.institutionName);
    setValue("qualificationProgramName", qualification.programName || "");
    setValue("qualificationStartDate", qualification.startDate);
    setValue("qualificationEndDate", qualification.endDate || "");
    setValue("qualificationGrade", qualification.grade || "");
    setValue("qualificationGpa", qualification.gpa?.toString() || "");
    setValue("qualificationIsCompleted", qualification.isCompleted.toString());
    setEditingIndex(index);
  };

  const handleDelete = (index: number) => {
    dispatch(removeAcademicQualification(index));
    if (editingIndex === index) {
      setEditingIndex(null);
      resetQualificationForm();
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    setEditingIndex(null);
    resetQualificationForm();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Academic Qualifications
      </h2>
      <p className="text-gray-600 mb-6">
        Add your academic qualifications. You can add multiple qualifications.
      </p>

      {/* Qualification Form - Part of the main form but handled separately */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <FormInputB
            label="Qualification Name"
            name="qualificationName"
            placeholder="e.g., Bachelor of Science"
          />
          <FormInputB
            label="Education Level"
            name="qualificationEducationLevel"
            type="select"
            options={educationLevelOptions}
          />
          <FormInputB
            label="Institution Name"
            name="qualificationInstitutionName"
            placeholder="e.g., University of Colombo"
          />
          <FormInputB
            label="Program Name"
            name="qualificationProgramName"
            placeholder="e.g., Computer Science"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <FormInputB
            label="Start Date"
            name="qualificationStartDate"
            type="date"
          />
          <FormInputB
            label="End Date"
            name="qualificationEndDate"
            type="date"
          />
          <FormInputB
            label="Grade"
            name="qualificationGrade"
            placeholder="e.g., First Class"
          />
          <FormInputB
            label="GPA"
            name="qualificationGpa"
            type="number"
            placeholder="e.g., 3.5"
          />
        </div>

        <FormInputB
          label="Is this qualification completed?"
          name="qualificationIsCompleted"
          type="select"
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />

        <div className="mt-4">
          <button
            type="button" // Important: type="button" to prevent form submission
            onClick={handleAddOrUpdateQualification}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {editingIndex !== null
              ? "Update Qualification"
              : "Add Qualification"}
          </button>
          {editingIndex !== null && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="ml-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* List of Added Qualifications */}
      {academicQualifications.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Added Qualifications ({academicQualifications.length})
          </h3>
          <div className="space-y-4">
            {academicQualifications.map((qual, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-white"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-800">{qual.name}</h4>
                    <p className="text-sm text-gray-600">
                      {qual.institutionName} - {qual.educationLevel}
                    </p>
                    <p className="text-sm text-gray-600">
                      {qual.startDate} {qual.endDate && ` - ${qual.endDate}`}
                    </p>
                    {qual.grade && (
                      <p className="text-sm text-gray-600">
                        Grade: {qual.grade}
                      </p>
                    )}
                    {qual.gpa && (
                      <p className="text-sm text-gray-600">GPA: {qual.gpa}</p>
                    )}
                    <p className="text-sm text-gray-600">
                      Status: {qual.isCompleted ? "Completed" : "In Progress"}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(index)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {academicQualifications.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No academic qualifications added yet.
        </div>
      )}
    </div>
  );
};
