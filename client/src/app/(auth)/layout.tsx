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
          "url(https://ik.imagekit.io/nilonbee/edupaleu/background/backdrop.png?updatedAt=1764747813053)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-blue-950/5"></div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
