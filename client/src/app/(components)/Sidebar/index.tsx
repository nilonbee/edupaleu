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
        className={`cursor-pointer flex items-center ${
          isCollapsed ? "justify-center py-4" : "justify-start px-8 py-4"
        } gap-3 transition-all duration-200 ${
          isActive
            ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-l-4 border-cyan-400 text-cyan-100 shadow-lg shadow-cyan-500/10"
            : "text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-600/30"
        }`}
      >
        <Icon
          className={`w-6 h-6 transition-colors ${
            isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-cyan-300"
          }`}
        />

        <span
          className={`${
            isCollapsed ? "hidden" : "block"
          } font-medium transition-colors ${
            isActive ? "text-white" : "text-slate-300"
          }`}
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

  const toggleSidebar = () => {
    dispatch(setIsSidebarCollapsed(!isSidebarCollapsed));
  };

  const sidebarClassNames = `fixed flex flex-col ${
    isSidebarCollapsed ? "w-0 md:w-16" : "w-72 md:w-64"
  } bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-900 transition-all duration-300 overflow-hidden h-full shadow-2xl shadow-slate-900/50 z-40 border-r border-slate-700/50`;

  return (
    <div className={sidebarClassNames}>
      {/* TOP LOGO */}
      <div
        className={`flex gap-3 justify-between md:justify-normal items-center pt-8 ${
          isSidebarCollapsed ? "px-5" : "px-8"
        }`}
      >
        <Image
          src="https://ik.imagekit.io/nilonbee/edupaleu/Png.png"
          alt="edupal-logo"
          width={100}
          height={100}
          className="rounded w-36 md:w-64"
        />

        <button
          className="md:hidden px-3 py-3 bg-slate-700/50 rounded-full hover:bg-slate-600/50 text-slate-300 hover:text-white transition-colors"
          onClick={toggleSidebar}
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* LINKS */}
      <div className="flex-grow mt-8">
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
        <SidebarLink
          href="/students"
          icon={User}
          label="Students"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/universities"
          icon={CircleDollarSign}
          label="Expenses"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/settings"
          icon={SlidersHorizontal}
          label="Settings"
          isCollapsed={isSidebarCollapsed}
        />
      </div>

      {/* FOOTER */}
      <div className={`${isSidebarCollapsed ? "hidden" : "block"} mb-10`}>
        <p className="text-center text-xs text-slate-500">&copy; 2024 Edstock</p>
      </div>
    </div>
  );
};

export default Sidebar;
