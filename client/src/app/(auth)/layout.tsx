import Image from "next/image";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8"
      style={{
        backgroundImage:
          "url(https://ik.imagekit.io/nilonbee/edupaleu/background/small-town-snow.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/10"></div>

      {/* Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://ik.imagekit.io/nilonbee/edupaleu/Png.png"
            alt="edupal-logo"
            width={200}
            height={200}
            className="rounded w-32 md:w-64"
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
