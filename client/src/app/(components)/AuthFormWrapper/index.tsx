import Image from "next/image";

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
        <div>
          <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 mb-8">
            <div className="flex justify-center">
              <Image
                src="https://ik.imagekit.io/nilonbee/edupaleu/Png.png"
                alt="edupal-logo"
                width={200}
                height={200}
                className="rounded w-36 md:w-72"
              />
            </div>
          </div>
        </div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
