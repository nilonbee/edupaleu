import type { Metadata } from "next";
import { Inter } from "next/font/google";
import DashboardWrapper from "@/app/(components)/DashboardWrapper";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Edupal - Study Abroad Management",
  description: "Study abroad application management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DashboardWrapper>{children}</DashboardWrapper>
      </body>
    </html>
  );
}
