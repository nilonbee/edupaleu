"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsSidebarCollapsed } from "@/state";
import {
  Archive,
  CircleDollarSign,
  Clipboard,
  Layout,
  LucideIcon,
  Menu,
  SlidersHorizontal,
  User,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface SidebarLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isCollapsed: boolean;
}

const SidebarLink = ({
  href,
  icon: Icon,
  label,
  isCollapsed,
}: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive =
    pathname === href || (pathname === "/" && href === "/dashboard");

  return (
    <Link href={href}>
      <div
        className={`relative cursor-pointer flex items-center ${
          isCollapsed ? "justify-center py-3 mx-2" : "justify-start px-8 py-4"
        } gap-3 transition-all duration-200 rounded-lg ${
          isActive
            ? "bg-white/10 text-white font-semibold"
            : "text-[rgb(224,228,236)] hover:bg-white/5 hover:text-[#cdd5df]"
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-md" />
        )}
        <Icon
          className={`w-5 h-5 transition-colors ${
            isActive ? "text-white" : "text-[rgb(224,228,236)]"
          }`}
        />

        <span
          className={`${
            isCollapsed ? "hidden" : "block"
          } text-[15px] font-medium font-poppins transition-colors`}
          style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500 }}
        >
          {label}
        </span>
      </div>
    </Link>
  );
};

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const currentUser = useAppSelector((state) => state.auth.user);

  const toggleSidebar = () => {
    dispatch(setIsSidebarCollapsed(!isSidebarCollapsed));
  };

  const sidebarClassNames = `fixed flex flex-col ${
    isSidebarCollapsed ? "w-0 md:w-16" : "w-72 md:w-64 lg:w-72"
  } bg-[rgb(11,27,54)] transition-all duration-300 overflow-hidden h-full shadow-sm border-r border-gray-800/50 z-40`;

  // Add overlay for mobile when sidebar is open
  const overlayClassNames = `fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 ${
    isSidebarCollapsed
      ? "opacity-0 pointer-events-none md:opacity-0"
      : "opacity-100 md:opacity-0 md:pointer-events-none"
  }`;

  return (
    <>
      {/* Mobile Overlay */}
      {!isSidebarCollapsed && (
        <div
          className={overlayClassNames}
          onClick={toggleSidebar}
          aria-label="Close sidebar"
        />
      )}

      <div className={sidebarClassNames}>
        {/* TOP LOGO */}
        {!isSidebarCollapsed && (
          <div className="pt-6 pb-4 px-8 border-b border-gray-800/50 relative">
            {/* Mobile Close Button */}
            <button
              className="absolute top-4 right-4 md:hidden p-2 rounded-lg hover:bg-white/10 text-[rgb(224,228,236)] hover:text-white transition-colors z-20"
              onClick={toggleSidebar}
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative p-2 rounded-lg bg-gradient-to-br from-white/10 via-white/5 to-transparent w-full">
              <Image
                src="https://ik.imagekit.io/nilonbee/edupaleu/Png.png"
                alt="edupal-logo"
                width={100}
                height={100}
                className="rounded w-full relative z-10"
              />
            </div>
          </div>
        )}
        {isSidebarCollapsed && (
          <div className="flex items-center justify-center pt-6 pb-4 border-b border-gray-800/50">
            <button
              className="px-3 py-2 rounded-lg hover:bg-white/10 text-[rgb(224,228,236)] hover:text-white transition-colors"
              onClick={toggleSidebar}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* LINKS */}
        <div className="flex-grow mt-2 overflow-y-auto scrollbar-theme space-y-1">
          <SidebarLink
            href="/dashboard"
            icon={Layout}
            label="Dashboard"
            isCollapsed={isSidebarCollapsed}
          />
          <SidebarLink
            href="/enquiries"
            icon={Archive}
            label="Enquiries"
            isCollapsed={isSidebarCollapsed}
          />
          <SidebarLink
            href="/applications"
            icon={Clipboard}
            label="Applications"
            isCollapsed={isSidebarCollapsed}
          />
          {/* <SidebarLink
          href="/students"
          icon={User}
          label="Students"
          isCollapsed={isSidebarCollapsed}
        /> */}
          {/* <SidebarLink
          href="/universities"
          icon={CircleDollarSign}
          label="Expenses"
          isCollapsed={isSidebarCollapsed}
        /> */}
          {(currentUser?.role === "admin" || currentUser?.role === "agent") && (
            <SidebarLink
              href="/users"
              icon={Users}
              label="Users"
              isCollapsed={isSidebarCollapsed}
            />
          )}
          <SidebarLink
            href="/settings"
            icon={SlidersHorizontal}
            label="Settings"
            isCollapsed={isSidebarCollapsed}
          />
        </div>

        {/* FOOTER */}
        <div
          className={`${
            isSidebarCollapsed ? "hidden" : "block"
          } mb-6 px-6 pt-4 border-t border-gray-800/50`}
        >
          <div className="flex items-center gap-3 py-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
            <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-semibold">
              {currentUser?.firstName?.[0]?.toUpperCase() ||
                currentUser?.email?.[0]?.toUpperCase() ||
                "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-medium text-white truncate font-poppins"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {currentUser?.name || currentUser?.firstName || "User"}
              </div>
              <div
                className="text-xs text-[rgb(224,228,236)] truncate font-poppins"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {currentUser?.email || ""}
              </div>
            </div>
          </div>
          <p
            className="text-center text-xs text-[rgb(224,228,236)] mt-4 font-poppins"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            &copy; 2024 Edstock
          </p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
