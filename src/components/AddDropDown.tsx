import React, { useState } from "react";
import {
  UserPlus,
  CalendarPlus,
  ShieldPlus,
  Clock,
  BellIcon,
  Newspaper,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function AddDropdown({ isAdmin }: { isAdmin: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  if (!isAdmin) return null;

  // Helper to check active route
  const isActive = (path: string) => location.pathname === path;

  return (
    <div
      className="relative inline-block text-left"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Main ADD button */}
      <button
        type="button"
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
          isOpen
            ? "bg-blue-600 text-white"
            : "bg-gray-800 text-gray-200 hover:bg-gray-700"
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen ? "true" : "false"}
      >
        <span>Add</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute mt-2 bg-white rounded-md shadow-lg w-48 ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1">
            <Link
              to="/add-player"
              className={`flex items-center space-x-2 px-4 py-2 text-sm hover:bg-blue-600 hover:text-white ${
                isActive("/add-player")
                  ? "bg-blue-600 text-white"
                  : "text-gray-700"
              }`}
            >
              <UserPlus className="w-5 h-5" />
              <span>Add Player</span>
            </Link>

            <Link
              to="/add-match"
              className={`flex items-center space-x-2 px-4 py-2 text-sm hover:bg-green-600 hover:text-white ${
                isActive("/add-match")
                  ? "bg-green-600 text-white"
                  : "text-gray-700"
              }`}
            >
              <CalendarPlus className="w-5 h-5" />
              <span>Add Match</span>
            </Link>

            <Link
              to="/add-team"
              className={`flex items-center space-x-2 px-4 py-2 text-sm hover:bg-indigo-600 hover:text-white ${
                isActive("/add-team")
                  ? "bg-indigo-600 text-white"
                  : "text-gray-700"
              }`}
            >
              <ShieldPlus className="w-5 h-5" />
              <span>Add Team</span>
            </Link>

            <Link
              to="/add-booking"
              className={`flex items-center space-x-2 px-4 py-2 text-sm hover:bg-purple-600 hover:text-white ${
                isActive("/add-booking")
                  ? "bg-purple-600 text-white"
                  : "text-gray-700"
              }`}
            >
              <Clock className="w-5 h-5" />
              <span>Add Booking</span>
            </Link>

            <Link
              to="/add-notification"
              className={`flex items-center space-x-2 px-4 py-2 text-sm hover:bg-orange-600 hover:text-white ${
                isActive("/add-booking")
                  ? "bg-orange-600 text-white"
                  : "text-gray-700"
              }`}
            >
              <BellIcon className="w-5 h-5" />
              <span>Add Notification</span>
            </Link>
            <Link
              to="/add-news"
              className={`flex items-center space-x-2 px-4 py-2 text-sm hover:bg-cyan-600 hover:text-white ${
                isActive("/add-news")
                  ? "bg-cyan-600 text-white"
                  : "text-gray-700"
              }`}
            >
              <Newspaper className="w-5 h-5" />
              <span>Add News</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
