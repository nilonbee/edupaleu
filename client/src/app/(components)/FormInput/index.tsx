import { UseFormRegister, FieldError } from "react-hook-form";

interface FormInputProps {
  id: string;
  name: string;
  type: string;
  placeholder: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
  autoComplete?: string;
}

export function FormInput({
  id,
  name,
  type,
  placeholder,
  register,
  error,
  required = false,
  autoComplete,
}: FormInputProps) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        className={`appearance-none relative block w-full px-3 py-3 border placeholder-gray-500 text-gray-900 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
          error ? "border-red-400" : "border-gray-300"
        }`}
        placeholder={placeholder}
        {...register(name, { required })}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error.message || "This field is required"}
        </p>
      )}
    </div>
  );
}
