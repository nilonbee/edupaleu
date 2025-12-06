"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsDarkMode, setIsSidebarCollapsed } from "@/state";
import { clearUser } from "@/state/authSlice";
import { api, useLogoutMutation } from "@/state/api";
import { useRouter } from "next/navigation";
import { Bell, Menu, Moon, Settings, Sun, Power } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { logger } from "@/utils/logger";

const Navbar = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [logout] = useLogoutMutation();
  const user = useAppSelector((state) => state.auth.user);
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  const toggleSidebar = () => {
    dispatch(setIsSidebarCollapsed(!isSidebarCollapsed));
  };

  const toggleDarkMode = () => {
    dispatch(setIsDarkMode(!isDarkMode));
  };

  const handleLogout = async () => {
    logger.log("Logging out... Current user:", user);

    try {
      await logout().unwrap();
      logger.log("Backend logout successful");
    } catch (error) {
      logger.warn("Backend logout failed, but clearing frontend anyway");
    }
    dispatch(api.util.resetApiState());
  };
  return (
    <div className="flex justify-between items-center w-full mb-7 bg-gradient-to-r from-white/80 via-blue-50/30 to-indigo-50/30 dark:from-gray-800/80 dark:via-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700 shadow-sm">
      {/* LEFT SIDE */}
      <div className="flex justify-between items-center gap-5">
        <button
          className="px-3 py-3 bg-gray-100 rounded-full hover:bg-blue-100"
          onClick={toggleSidebar}
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="relative">
          <input
            type="search"
            placeholder="Start type to search groups & products"
            className="pl-10 pr-4 py-2 w-50 md:w-60 border-2 border-gray-300 bg-white rounded-lg focus:outline-none focus:border-blue-500"
          />

          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-non">
            <Bell className="text-gray-500" size={20} />
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex justify-between items-center gap-3 sm:gap-5">
        {/* Mobile Dark Mode Toggle */}
        <div className="md:hidden">
          <button 
            onClick={toggleDarkMode}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <Sun className="cursor-pointer text-gray-600 dark:text-gray-300" size={20} />
            ) : (
              <Moon className="cursor-pointer text-gray-600 dark:text-gray-300" size={20} />
            )}
          </button>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex justify-between items-center gap-5">
          <div>
            <button 
              onClick={toggleDarkMode}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <Sun className="cursor-pointer text-gray-600 dark:text-gray-300" size={24} />
              ) : (
                <Moon className="cursor-pointer text-gray-600 dark:text-gray-300" size={24} />
              )}
            </button>
          </div>
          <div className="relative">
            <Bell className="cursor-pointer text-gray-600 dark:text-gray-300" size={24} />
            <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-[0.4rem] py-1 text-xs font-semibold leading-none text-red-100 bg-red-500 rounded-full">
              3
            </span>
          </div>
          <hr className="w-0 h-7 border border-solid border-l border-gray-300 dark:border-gray-600 mx-3" />
          <div className="flex items-center gap-3">
            <Image
              src="https://ik.imagekit.io/nilonbee/edupaleu/Png.png"
              alt="Profile"
              width={50}
              height={50}
              className="rounded-full h-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
            />
            <span className="font-semibold text-gray-700 dark:text-gray-200">{user?.name || "User"}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors group"
            title="Logout"
          >
            <Power className="cursor-pointer text-gray-600 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" size={20} />
          </button>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center gap-2">
          <div className="relative">
            <Bell className="cursor-pointer text-gray-600 dark:text-gray-300" size={20} />
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-red-500 rounded-full">
              3
            </span>
          </div>
          <Link href="/settings">
            <Settings className="cursor-pointer text-gray-600 dark:text-gray-300" size={20} />
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
            title="Logout"
          >
            <Power className="cursor-pointer text-gray-600 dark:text-gray-300" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
