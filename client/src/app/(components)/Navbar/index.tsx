"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsDarkMode, setIsSidebarCollapsed } from "@/state";
import { clearUser } from "@/state/authSlice";
import { api, useLogoutMutation, useGetCurrentUserQuery } from "@/state/api";
import { useRouter } from "next/navigation";
import { Menu, Moon, Settings, Sun, Power } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { logger } from "@/utils/logger";

const Navbar = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [logout] = useLogoutMutation();
  const user = useAppSelector((state) => state.auth.user);
  const { data: userResponse } = useGetCurrentUserQuery();
  const currentUser = userResponse?.user || user;
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
  // Get profile picture URL or use fallback
  const profilePictureUrl = currentUser?.displayPicture && currentUser.displayPicture !== 'null' && currentUser.displayPicture !== null
    ? currentUser.displayPicture
    : "https://ik.imagekit.io/nilonbee/edupaleu/Png.png";
  const userInitials =
    currentUser?.firstName?.[0]?.toUpperCase() ||
    currentUser?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <div className="flex justify-between items-center w-full mb-7 bg-white dark:bg-[#0B1B36] rounded-lg p-4 border border-gray-200 dark:border-gray-800/50 shadow-sm">
      {/* LEFT SIDE */}
      <div className="flex items-center gap-5">
        <button
          className="px-3 py-3 bg-gray-100 dark:bg-white/10 rounded-full hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
          onClick={toggleSidebar}
        >
          <Menu className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
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
              <Sun
                className="cursor-pointer text-gray-600 dark:text-gray-300"
                size={20}
              />
            ) : (
              <Moon
                className="cursor-pointer text-gray-600 dark:text-gray-300"
                size={20}
              />
            )}
          </button>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex justify-between items-center gap-5">
          <div>
            <button
              onClick={toggleDarkMode}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
              title={
                isDarkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDarkMode ? (
                <Sun
                  className="cursor-pointer text-gray-600 dark:text-gray-300"
                  size={24}
                />
              ) : (
                <Moon
                  className="cursor-pointer text-gray-600 dark:text-gray-300"
                  size={24}
                />
              )}
            </button>
          </div>
          <hr className="w-0 h-7 border border-solid border-l border-gray-300 dark:border-gray-700 mx-3" />
          <Link
            href="/settings"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            {currentUser?.displayPicture && currentUser.displayPicture !== 'null' && currentUser.displayPicture !== null ? (
              <Image
                src={profilePictureUrl}
                alt="Profile"
                width={50}
                height={50}
                className="rounded-full h-12 w-12 object-cover ring-2 ring-gray-200 dark:ring-gray-700"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary-500 flex items-center justify-center text-white text-lg font-bold ring-2 ring-gray-200 dark:ring-gray-700">
                {userInitials}
              </div>
            )}
            <span className="font-semibold text-gray-700 dark:text-white">
              {currentUser?.name || "User"}
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors group"
            title="Logout"
          >
            <Power
              className="cursor-pointer text-gray-600 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors"
              size={20}
            />
          </button>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center gap-2">
          <Link href="/settings">
            <Settings
              className="cursor-pointer text-gray-600 dark:text-gray-300"
              size={20}
            />
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
            title="Logout"
          >
            <Power
              className="cursor-pointer text-gray-600 dark:text-gray-300"
              size={18}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
