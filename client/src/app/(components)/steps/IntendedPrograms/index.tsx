// components/steps/IntendedPrograms.tsx
import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import {
  addIntendedProgram,
  updateIntendedProgram,
  removeIntendedProgram,
} from "@/state/applicationSlice";
import { FormInputB } from "@/app/(components)/FormInputB";
import { logger } from "@/utils/logger";
import { showToast } from "@/utils/toast";

export const IntendedPrograms: React.FC = () => {
  const { setValue, getValues, watch } = useFormContext();
  const dispatch = useAppDispatch();
  const { intendedPrograms } = useAppSelector((state) => state.application);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const countryOptions = [
    { value: "USA", label: "United States" },
    { value: "UK", label: "United Kingdom" },
    { value: "CANADA", label: "Canada" },
    { value: "AUSTRALIA", label: "Australia" },
    { value: "GERMANY", label: "Germany" },
    { value: "FRANCE", label: "France" },
    { value: "JAPAN", label: "Japan" },
    { value: "SOUTH_KOREA", label: "South Korea" },
    { value: "OTHER", label: "Other" },
  ];

  const handleAddOrUpdateProgram = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission

    // Get current form values
    const formData = getValues();

    const programData = {
      country: formData.programCountry || "",
      programme: formData.programProgramme || "",
      university: formData.programUniversity || "",
    };

    // Validate required fields
    if (
      !programData.country ||
      !programData.programme ||
      !programData.university
    ) {
      showToast.error(
        "Please fill all required fields: Country, Programme, and University"
      );
      return;
    }

    logger.log("Adding/Updating program:", programData);

    if (editingIndex !== null) {
      dispatch(
        updateIntendedProgram({
          index: editingIndex,
          program: programData,
        })
      );
      setEditingIndex(null);
      logger.log("Updated program at index:", editingIndex);
    } else {
      dispatch(addIntendedProgram(programData));
      logger.log("Added new program");
    }

    // Reset the form fields
    resetProgramForm();
  };

  const resetProgramForm = () => {
    setValue("programCountry", "");
    setValue("programProgramme", "");
    setValue("programUniversity", "");
  };

  const handleEdit = (index: number) => {
    const program = intendedPrograms[index];
    setValue("programCountry", program.country);
    setValue("programProgramme", program.programme);
    setValue("programUniversity", program.university);
    setEditingIndex(index);
    logger.log("Editing program:", program);
  };

  const handleDelete = (index: number) => {
    dispatch(removeIntendedProgram(index));
    if (editingIndex === index) {
      setEditingIndex(null);
      resetProgramForm();
    }
    logger.log("Deleted program at index:", index);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    setEditingIndex(null);
    resetProgramForm();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Intended Programs
      </h2>
      <p className="text-gray-600 mb-6">
        Add up to 4 programs you intend to apply for. You can specify different
        countries, programs, and universities.
      </p>

      {intendedPrograms.length < 4 && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInputB
              label="Country"
              name="programCountry"
              type="select"
              options={countryOptions}
              placeholder="Select Country"
            />
            <FormInputB
              label="Programme"
              name="programProgramme"
              placeholder="e.g., Computer Science"
            />
            <FormInputB
              label="University"
              name="programUniversity"
              placeholder="e.g., University of Toronto"
            />
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={handleAddOrUpdateProgram}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {editingIndex !== null ? "Update Program" : "Add Program"}
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
      )}

      {/* List of Added Programs */}
      {intendedPrograms.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Added Programs ({intendedPrograms.length}/4)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {intendedPrograms.map((program, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-white"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {program.programme}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {program.university}
                    </p>
                    <p className="text-sm text-gray-600">{program.country}</p>
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

      {intendedPrograms.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No programs added yet. Please add at least one intended program.
        </div>
      )}

      {intendedPrograms.length >= 4 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-700 text-sm">
            You have reached the maximum of 4 programs. You can edit or remove
            existing programs if needed.
          </p>
        </div>
      )}

      {/* Debug info - remove in production */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs">
        <h4 className="font-semibold mb-2">Debug Info:</h4>
        <p>Programs in Redux: {intendedPrograms.length}</p>
        <p>Editing Index: {editingIndex !== null ? editingIndex : "None"}</p>
        <pre>{JSON.stringify(intendedPrograms, null, 2)}</pre>
      </div>
    </div>
  );
};
