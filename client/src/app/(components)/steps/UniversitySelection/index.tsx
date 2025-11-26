import React from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setSelectedUniversity } from "@/state/applicationSlice";
import { useGetUniversitiesQuery } from "@/state/applicationApi";
import { FormInputB } from "@/app/(components)/FormInputB";

export const UniversitySelection: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selectedUniversity } = useAppSelector((state) => state.application);
  const { data: universities, isLoading, error } = useGetUniversitiesQuery();
  const handleUniversitySelect = (value: any) => {
    dispatch(setSelectedUniversity(value));
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
        University Selection
      </h2>
      <p className="text-gray-600 mb-6">
        Select your preferred university from the list below.
      </p>

      <FormInputB
        label="Select University"
        name="universityId"
        type="select"
        options={
          universities?.map((u) => ({
            value: u.id.toString(),
            label: `${u.name} ${u.ranking ? `(Rank: ${u.ranking})` : ""}`,
          })) || []
        }
        onChange={handleUniversitySelect}
      />

      {selectedUniversity && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">
            {selectedUniversity}
          </h3>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">
            Error loading universities. Please try again.
          </p>
        </div>
      )}
    </div>
  );
};
