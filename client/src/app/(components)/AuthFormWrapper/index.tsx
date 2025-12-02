interface AuthFormWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AuthFormWrapper({
  title,
  subtitle,
  children,
}: AuthFormWrapperProps) {
  return (
    <div className="mx-auto sm:max-w-md w-[80%]">
      <div className="bg-white/20 backdrop-blur-md py-16 px-4 shadow-2xl rounded-2xl sm:px-10 border-2 border-white/30">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
