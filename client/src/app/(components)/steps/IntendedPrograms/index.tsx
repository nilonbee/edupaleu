// components/steps/IntendedPrograms.tsx
import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import {
  addIntendedProgram,
  updateIntendedProgram,
  removeIntendedProgram,
  reorderIntendedPrograms,
} from "@/state/applicationSlice";
import { FormInputB } from "@/app/(components)/FormInputB";
import { logger } from "@/utils/logger";
import { showToast } from "@/utils/toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit, Trash2 } from "lucide-react";
import Button from "@/app/(components)/Button";

interface SortableProgramCardProps {
  program: {
    country: string;
    programme: string;
    university: string;
    priority?: number;
  };
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

const SortableProgramCard: React.FC<SortableProgramCardProps> = ({
  program,
  index,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `program-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors = [
    "bg-primary-500", // Priority 1
    "bg-primary-600", // Priority 2
    "bg-primary-700", // Priority 3
    "bg-primary-800", // Priority 4
  ];

  const priorityNumber = program.priority || index + 1;
  const priorityColor = priorityColors[priorityNumber - 1] || priorityColors[3];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border-2 rounded-lg p-4 bg-white shadow-md hover:shadow-lg transition-all ${
        isDragging ? "border-primary-400" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mt-1"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Priority Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`${priorityColor} text-white px-3 py-1 rounded-full text-xs font-bold`}
            >
              Priority {priorityNumber}
            </span>
          </div>

          {/* Program Details */}
          <h4 className="font-semibold text-gray-800 text-lg mb-1">
            {program.programme}
          </h4>
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium">University:</span>{" "}
            {program.university}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Country:</span> {program.country}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const IntendedPrograms: React.FC = () => {
  const { setValue, getValues, watch } = useFormContext();
  const dispatch = useAppDispatch();
  const { intendedPrograms } = useAppSelector((state) => state.application);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    e.preventDefault();

    const formData = getValues();

    const programData = {
      country: formData.programCountry || "",
      programme: formData.programProgramme || "",
      university: formData.programUniversity || "",
      priority: intendedPrograms.length + 1,
    };

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
          program: {
            ...programData,
            priority:
              intendedPrograms[editingIndex].priority || editingIndex + 1,
          },
        })
      );
      setEditingIndex(null);
      logger.log("Updated program at index:", editingIndex);
    } else {
      dispatch(addIntendedProgram(programData));
      logger.log("Added new program");
    }

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = intendedPrograms.findIndex(
        (_, idx) => `program-${idx}` === active.id
      );
      const newIndex = intendedPrograms.findIndex(
        (_, idx) => `program-${idx}` === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        dispatch(reorderIntendedPrograms({ oldIndex, newIndex }));
        logger.log("Reordered programs:", { oldIndex, newIndex });
        showToast.success("Program priority updated");
      }
    }
  };

  // Ensure programs have priorities
  const programsWithPriority = intendedPrograms.map((program, index) => ({
    ...program,
    priority: program.priority || index + 1,
  }));

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Intended Programs
      </h2>
      <p className="text-gray-600 mb-6">
        Add up to 4 programs you intend to apply for. Drag and drop to reorder
        and set priorities automatically.
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
            <Button
              type="button"
              onClick={handleAddOrUpdateProgram}
              variant="primary"
              size="md"
            >
              {editingIndex !== null ? "Update Program" : "Add Program"}
            </Button>
            {editingIndex !== null && (
              <Button
                type="button"
                onClick={handleCancelEdit}
                variant="secondary"
                size="md"
                className="ml-2"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Draggable Programs List */}
      {intendedPrograms.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Added Programs ({intendedPrograms.length}/4)
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Drag programs to reorder. Priority updates automatically (1 =
            highest priority).
          </p>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={programsWithPriority.map((_, index) => `program-${index}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {programsWithPriority.map((program, index) => (
                  <SortableProgramCard
                    key={`program-${index}`}
                    program={program}
                    index={index}
                    onEdit={() => handleEdit(index)}
                    onDelete={() => handleDelete(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
            You have reached the maximum of 4 programs. You can edit, reorder,
            or remove existing programs if needed.
          </p>
        </div>
      )}
    </div>
  );
};
