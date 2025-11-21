import { AlertState } from "@/types/auth";

interface AlertProps {
  alert: AlertState;
  onClose: () => void;
}

export function Alert({ alert, onClose }: AlertProps) {
  if (!alert.show) return null;

  const styles = {
    success: "bg-green-50 text-green-900 border-green-300",
    error: "bg-red-50 text-red-900 border-red-300",
  };

  return (
    <div className={`rounded-md border p-4 mb-4 ${styles[alert.type]}`}>
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium">{alert.text}</p>
        <button
          onClick={onClose}
          className="ml-4 inline-flex text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Close</span>
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
