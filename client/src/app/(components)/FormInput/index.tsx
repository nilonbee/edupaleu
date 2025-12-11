import { UseFormRegister, FieldError } from "react-hook-form";
import { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";

interface FormInputProps {
  id: string;
  name: string;
  type: string;
  placeholder: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
  autoComplete?: string;
  validate?: (value: any) => string | boolean | undefined;
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
  validate,
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          autoComplete={autoComplete}
          className={`appearance-none relative block w-full px-3 py-3 border placeholder-gray-500 text-gray-900 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            error ? "border-red-400" : "border-gray-300"
          } ${isPassword ? "pr-10" : ""}`}
          placeholder={placeholder}
          {...register(name, { required, validate })}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="toggle password visibility"
          >
            {showPassword ? (
              <VisibilityOff className="w-5 h-5" />
            ) : (
              <Visibility className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error.message || "This field is required"}
        </p>
      )}
    </div>
  );
}
