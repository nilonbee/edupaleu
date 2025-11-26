import React from "react";
import { useFormContext } from "react-hook-form";

interface FormInputBProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  className?: string;
  onChange?: (value: string) => void;
}

export const FormInputB: React.FC<FormInputBProps> = ({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  options,
  className = "",
  onChange,
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const renderInput = () => {
    const commonProps = {
      ...register(name, {
        required: required ? `${label} is required` : false,
      }),
      id: name,
      placeholder,
      onChange: handleInputChange,
      style: { color: "black" }, // Move style to commonProps
      className: `w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        error ? "border-red-500" : "border-gray-300"
      }`,
    };

    switch (type) {
      case "select":
        return (
          <select
            {...commonProps}
            style={{ color: "black", backgroundColor: "white" }}
          >
            <option value="">Select {label}</option>
            {options?.map((option) => (
              <option
                key={option.value}
                value={option.value}
                style={{ color: "black", backgroundColor: "white" }}
              >
                {option.label}
              </option>
            ))}
          </select>
        );

      case "textarea":
        return <textarea {...commonProps} rows={3} />;

      case "checkbox":
        return (
          <input
            type="checkbox"
            {...commonProps}
            onChange={(e) => {
              if (onChange) {
                onChange(e.target.checked.toString());
              }
            }}
            className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
              error ? "border-red-500" : ""
            }`}
          />
        );

      default:
        return <input type={type} {...commonProps} />;
    }
  };

  return (
    <div className={`mb-4 ${className}`}>
      {type !== "checkbox" ? (
        <>
          <label
            htmlFor={name}
            style={{ color: "black" }}
            className="block text-sm font-medium mb-1"
          >
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {renderInput()}
        </>
      ) : (
        <div className="flex items-center">
          {renderInput()}
          <label
            htmlFor={name}
            style={{ color: "black" }}
            className="ml-2 block text-sm"
          >
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        </div>
      )}

      {error && (
        <p style={{ color: "black" }} className="mt-1 text-sm text-red-600">
          {error.message as string}
        </p>
      )}
    </div>
  );
};
