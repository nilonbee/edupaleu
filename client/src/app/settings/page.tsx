"use client";

import React, { useState } from "react";
import Header from "@/app/(components)/Header";
import { useAppSelector, useAppDispatch } from "@/app/redux";
import { setIsDarkMode } from "@/state";
import { useGetCurrentUserQuery } from "@/state/api";
import { User, Mail, Phone, Calendar, Globe, Bell, Moon, Sun, Shield, CreditCard, HelpCircle, Settings as SettingsIcon } from "lucide-react";
import Image from "next/image";

type UserSetting = {
  label: string;
  value: string | boolean;
  type: "text" | "toggle" | "readonly";
  icon?: React.ReactNode;
  description?: string;
};

const Settings = () => {
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const { data: user } = useGetCurrentUserQuery();

  const userSettings: UserSetting[] = [
    { 
      label: "Full Name", 
      value: user?.name || "Loading...", 
      type: "readonly",
      icon: <User className="w-4 h-4" />,
      description: "Your full name as registered"
    },
    { 
      label: "Email Address", 
      value: user?.email || "Loading...", 
      type: "readonly",
      icon: <Mail className="w-4 h-4" />,
      description: "Primary email address for account"
    },
    { 
      label: "Role", 
      value: user?.role || "User", 
      type: "readonly",
      icon: <Shield className="w-4 h-4" />,
      description: "Your account role and permissions"
    },
  ];

  const preferenceSettings: UserSetting[] = [
    { 
      label: "Dark Mode", 
      value: isDarkMode, 
      type: "toggle",
      icon: isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />,
      description: "Toggle between light and dark theme"
    },
    { 
      label: "Email Notifications", 
      value: true, 
      type: "toggle",
      icon: <Bell className="w-4 h-4" />,
      description: "Receive email notifications for important updates"
    },
    { 
      label: "Language", 
      value: "English", 
      type: "text",
      icon: <Globe className="w-4 h-4" />,
      description: "Interface language preference"
    },
  ];

  const handleToggleChange = (label: string) => {
    if (label === "Dark Mode") {
      dispatch(setIsDarkMode(!isDarkMode));
    }
  };

  const SettingRow = ({ setting, index }: { setting: UserSetting; index: number }) => (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 px-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <div className="flex items-start gap-3 flex-1 mb-3 sm:mb-0">
          {setting.icon && (
            <div className="text-gray-500 dark:text-gray-400 mt-0.5">
              {setting.icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {setting.label}
            </div>
            {setting.description && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {setting.description}
              </div>
            )}
          </div>
        </div>
        <div className="sm:ml-4 sm:text-right">
          {setting.type === "toggle" ? (
            <label className="inline-flex relative items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={setting.value as boolean}
                onChange={() => handleToggleChange(setting.label)}
              />
              <div
                className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-focus:ring-blue-400 peer-focus:ring-4 
                transition peer-checked:after:translate-x-full peer-checked:after:border-white 
                after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
                after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all
                peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"
              ></div>
            </label>
          ) : setting.type === "readonly" ? (
            <div className="text-gray-700 dark:text-gray-300 font-medium">
              {setting.value as string}
            </div>
          ) : (
            <input
              type="text"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
              value={setting.value as string}
              onChange={(e) => {
                // Handle text changes if needed
              }}
            />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      <Header name="Settings & Profile" />
      
      {/* Profile Card */}
      <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative">
              <Image
                src="https://ik.imagekit.io/nilonbee/edupaleu/Png.png"
                alt="Profile"
                width={80}
                height={80}
                className="rounded-full ring-4 ring-white/50 shadow-lg object-cover"
              />
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-white mb-1">
                {user?.name || "User"}
              </h2>
              <p className="text-blue-100 mb-2">{user?.email || "user@example.com"}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
                  {user?.role || "User"}
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Information
          </h3>
          <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {userSettings.map((setting, index) => (
              <SettingRow key={index} setting={setting} index={index} />
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div className="px-6 pb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Preferences
          </h3>
          <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {preferenceSettings.map((setting, index) => (
              <SettingRow key={`pref-${index}`} setting={setting} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Billing</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Manage your subscription and billing information
          </p>
          <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
            View Billing →
          </button>
        </div>

        <div className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <HelpCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Support</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Get help and contact our support team
          </p>
          <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
            Contact Support →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
