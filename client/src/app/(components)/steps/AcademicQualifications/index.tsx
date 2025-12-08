// components/steps/AcademicQualifications.tsx
import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import {
  addAcademicQualification,
  updateAcademicQualification,
  removeAcademicQualification,
} from "@/state/applicationSlice";
import { AcademicQualification } from "@/types/applications";
import { showToast } from "@/utils/toast";
import { logger } from "@/utils/logger";

export const AcademicQualifications: React.FC = () => {
  const dispatch = useAppDispatch();
  const academicQualifications = useAppSelector(
    (state) => state.application.academicQualifications || []
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Force re-render when qualifications change
  const [renderKey, setRenderKey] = useState(0);

  // Form state - managing locally instead of using form context
  const [formData, setFormData] = useState<Partial<AcademicQualification>>({
    name: "",
    educationLevel: "OTHER",
    institutionName: "",
    programName: "",
    startDate: "",
    endDate: "",
    grade: "",
    gpa: undefined,
    isCompleted: true,
  });

  // Load form data when editing a specific qualification
  useEffect(() => {
    if (editingIndex !== null && academicQualifications[editingIndex]) {
      const qual = academicQualifications[editingIndex];
      setFormData({
        id: qual.id, // Preserve ID when editing
        name: qual.name || "",
        educationLevel: qual.educationLevel || "OTHER",
        institutionName: qual.institutionName || "",
        programName: qual.programName || "",
        startDate: qual.startDate || "",
        endDate: qual.endDate || "",
        grade: qual.grade || "",
        gpa: qual.gpa,
        isCompleted: qual.isCompleted !== undefined ? qual.isCompleted : true,
        documentPath: qual.documentPath,
      });
    } else if (editingIndex === null) {
      // Reset form when not editing
      resetForm();
    }
  }, [editingIndex, academicQualifications]);

  // Debug: Log when component mounts or qualifications change to verify data flow
  useEffect(() => {
    logger.log("Academic Qualifications component state:", {
      qualificationsCount: academicQualifications?.length || 0,
      hasQualifications:
        academicQualifications && academicQualifications.length > 0,
      qualifications: academicQualifications,
      editingIndex,
      renderKey,
    });

    // Force re-render when qualifications change
    if (academicQualifications && academicQualifications.length > 0) {
      setRenderKey((prev) => prev + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicQualifications, editingIndex]);

  const educationLevelOptions = [
    { value: "OL", label: "Ordinary Level (OL)" },
    { value: "AL", label: "Advanced Level (AL)" },
    { value: "BACHELORS", label: "Bachelors Degree" },
    { value: "MASTERS", label: "Masters Degree" },
    { value: "PHD", label: "PhD" },
    { value: "OTHER", label: "Other" },
  ];

  const resetForm = () => {
    setFormData({
      id: undefined,
      name: "",
      educationLevel: "OTHER",
      institutionName: "",
      programName: "",
      startDate: "",
      endDate: "",
      grade: "",
      gpa: undefined,
      isCompleted: true,
      documentPath: undefined,
    });
    setEditingIndex(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (name === "isCompleted") {
      setFormData((prev) => ({
        ...prev,
        isCompleted: (e.target as HTMLSelectElement).value === "true",
      }));
    } else if (name === "gpa") {
      const numValue = value === "" ? undefined : parseFloat(value);
      setFormData((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name || formData.name.trim() === "") {
      showToast.error("Qualification name is required");
      return false;
    }
    if (!formData.educationLevel) {
      showToast.error("Education level is required");
      return false;
    }
    if (!formData.institutionName || formData.institutionName.trim() === "") {
      showToast.error("Institution name is required");
      return false;
    }
    if (!formData.startDate) {
      showToast.error("Start date is required");
      return false;
    }

    // Validate date range
    if (formData.endDate && formData.startDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        showToast.error("End date must be after start date");
        return false;
      }
    }

    // Validate GPA if provided
    if (
      formData.gpa !== undefined &&
      (formData.gpa < 0 || formData.gpa > 4.0)
    ) {
      showToast.error("GPA must be between 0 and 4.0");
      return false;
    }

    return true;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!validateForm()) {
      return;
    }

    // Preserve ID when editing, don't include it when adding new
    // Use formData.id if available (from editing), otherwise use existing qualification's ID
    const existingQual =
      editingIndex !== null ? academicQualifications[editingIndex] : null;
    const qualificationId =
      formData.id !== undefined
        ? formData.id
        : existingQual?.id !== undefined
        ? existingQual.id
        : undefined;

    const qualification: AcademicQualification = {
      ...(qualificationId !== undefined && qualificationId !== null
        ? { id: qualificationId }
        : {}),
      name: formData.name!.trim(),
      educationLevel:
        formData.educationLevel as AcademicQualification["educationLevel"],
      institutionName: formData.institutionName!.trim(),
      programName: formData.programName?.trim() || undefined,
      startDate: formData.startDate!,
      endDate: formData.endDate?.trim() || undefined,
      grade: formData.grade?.trim() || undefined,
      gpa: formData.gpa,
      isCompleted:
        formData.isCompleted !== undefined ? formData.isCompleted : true,
      documentPath:
        formData.documentPath || existingQual?.documentPath || undefined,
    };

    if (editingIndex !== null) {
      dispatch(
        updateAcademicQualification({
          index: editingIndex,
          qualification,
        })
      );
      showToast.success("Qualification updated successfully");
      logger.log("Updated qualification (with ID preservation):", {
        editingIndex,
        existingId: existingQual?.id,
        newQualification: qualification,
      });
    } else {
      dispatch(addAcademicQualification(qualification));
      showToast.success("Qualification added successfully");
      logger.log("Added new qualification:", qualification);
    }

    resetForm();
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
  };

  const handleDelete = (index: number) => {
    if (window.confirm("Are you sure you want to delete this qualification?")) {
      dispatch(removeAcademicQualification(index));
      if (editingIndex === index) {
        resetForm();
      }
      showToast.success("Qualification deleted");
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
        🎓 Academic Qualifications
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Add your academic qualifications. You can add multiple qualifications.
      </p>

      {/* Qualification Form */}
      <div className="bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-gray-900 p-6 rounded-lg mb-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          {/* Using div instead of form to prevent nested form submission issues */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Qualification Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Bachelor of Science"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Education Level <span className="text-red-500">*</span>
              </label>
              <select
                name="educationLevel"
                value={formData.educationLevel}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              >
                {educationLevelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Institution Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="institutionName"
                value={formData.institutionName}
                onChange={handleInputChange}
                placeholder="e.g., University of Colombo"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Program Name
              </label>
              <input
                type="text"
                name="programName"
                value={formData.programName}
                onChange={handleInputChange}
                placeholder="e.g., Computer Science"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Grade
              </label>
              <input
                type="text"
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
                placeholder="e.g., First Class"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                GPA (0-4.0)
              </label>
              <input
                type="number"
                name="gpa"
                value={formData.gpa || ""}
                onChange={handleInputChange}
                placeholder="e.g., 3.5"
                min="0"
                max="4.0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              name="isCompleted"
              value={formData.isCompleted ? "true" : "false"}
              onChange={handleInputChange}
              className="w-full md:w-1/2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="true">Completed</option>
              <option value="false">In Progress</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit();
              }}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
            >
              {editingIndex !== null
                ? "Update Qualification"
                : "Add Qualification"}
            </button>
            {editingIndex !== null && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancel();
                }}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List of Added Qualifications */}
      {academicQualifications && academicQualifications.length > 0 ? (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Added Qualifications ({academicQualifications.length})
            </h3>
            <span className="text-sm text-green-600 dark:text-green-400 font-medium px-3 py-1 bg-green-50 dark:bg-green-900/30 rounded-full">
              ✓ {academicQualifications.length} qualification
              {academicQualifications.length !== 1 ? "s" : ""} saved
            </span>
          </div>
          <div className="space-y-4">
            {academicQualifications.map((qual, index) => (
              <div
                key={`qual-${qual.id || index}-${renderKey}`}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">
                        {qual.name}
                      </h4>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {qual.educationLevel}
                      </span>
                      {qual.isCompleted && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          ✓ Completed
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span className="font-medium">Institution:</span>{" "}
                      {qual.institutionName}
                    </p>
                    {qual.programName && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span className="font-medium">Program:</span>{" "}
                        {qual.programName}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span className="font-medium">Period:</span>{" "}
                      {qual.startDate}
                      {qual.endDate && ` - ${qual.endDate}`}
                      {!qual.endDate && !qual.isCompleted && " (Ongoing)"}
                    </p>
                    {qual.grade && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span className="font-medium">Grade:</span> {qual.grade}
                      </p>
                    )}
                    {qual.gpa !== undefined && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">GPA:</span> {qual.gpa}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEdit(index);
                      }}
                      className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(index);
                      }}
                      className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-6xl mb-4">🎓</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
            No academic qualifications added yet.
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Add your first qualification using the form above.
          </p>
        </div>
      )}
    </div>
  );
};
