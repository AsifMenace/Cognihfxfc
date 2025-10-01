import React, { useRef, useEffect, useState } from "react";
import { Sun, Moon, MapPin, Clock, X } from "lucide-react";
import Calendar from "../components/Calendar";

type Booking = {
  id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  session: "morning" | "night";
  field_number: number;
};

type UpcomingBookingsProps = {
  isAdmin: boolean;
  selectedDate?: string;
  onDateSelect?: (date: string) => void; // Add this here
};

function getDuration(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= startMin) endMin += 1440; // handle overnight
  const diff = endMin - startMin;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (mins === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${hours} hour${hours > 1 ? "s" : ""} ${mins} minutes`;
}

export default function UpcomingBookings({
  isAdmin,
  selectedDate,
  onDateSelect,
}: UpcomingBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  console.log("UpcomingBookings isAdmin:", isAdmin);
  const bookedDates = bookings.map((b) => {
    const [year, month, day] = b.booking_date.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString("en-CA"); // "YYYY-MM-DD" in local TZ
  });

  useEffect(() => {
    console.log("UpcomingBookings useEffect triggered");
    fetch("/.netlify/functions/getUpcomingBookings")
      .then((res) => res.json())
      .then((data) => {
        console.log("asif Fetched bookings:", data); // Added log
        setBookings(data);
      })
      .catch((error) => {
        console.error("Error fetching bookings:", error);
      });
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this booking?"))
      return;

    try {
      const res = await fetch(`/.netlify/functions/deleteBooking?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBookings((prev) => prev.filter((b) => b.id !== id));
      } else {
        alert("Failed to delete booking");
      }
    } catch {
      alert("Network or server error on delete");
    }
  };
  const bookingsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedDate) return;
    const targetEl = document.getElementById(`booking-${selectedDate}`);
    if (targetEl && bookingsContainerRef.current) {
      targetEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest", // prevents vertical scroll jump
        inline: "center",
      });
    }
  }, [selectedDate]);

  return (
    <div className="mt-10 max-w-2xl mx-auto rounded-xl shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Upcoming Field Bookings
      </h2>
      <div className="space-y-4">
        <Calendar bookedDates={bookedDates} onDateSelect={onDateSelect} />
      </div>
      <div
        ref={bookingsContainerRef}
        className="flex overflow-x-auto space-x-4 py-2"
      >
        {bookings.map((b) => {
          const isMorning = b.session === "morning";
          const startTime =
            b.start_time.length === 5 ? `${b.start_time}:00` : b.start_time;
          const endTime =
            b.end_time.length === 5 ? `${b.end_time}:00` : b.end_time;

          function buildDate(dateStr: string, timeStr: string) {
            // parse date portion as local year, month, day
            const [year, month, day] = dateStr
              .split("T")[0]
              .split("-")
              .map(Number);
            const date = new Date(year, month - 1, day);
            const [hour, minute, second = 0] = timeStr.split(":").map(Number);
            date.setHours(hour, minute, second, 0);
            return date;
          }

          const start = buildDate(b.booking_date, startTime);
          const end = buildDate(b.booking_date, endTime);

          const duration = getDuration(b.start_time, b.end_time);

          return (
            <div
              key={b.id}
              id={`booking-${b.booking_date.split("T")[0]}`}
              className={`flex-shrink-0 w-80 relative flex items-center p-4 rounded-lg shadow transition ${
                isMorning
                  ? "bg-yellow-50 border-l-4 border-yellow-400"
                  : "bg-blue-100 border-l-4 border-blue-500"
              }`}
            >
              {isAdmin && (
                <button
                  onClick={() => handleDelete(b.id)}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-100 text-red-600"
                  aria-label="Delete booking"
                >
                  <X size={16} />
                </button>
              )}

              <div className="mr-3">
                {isMorning ? (
                  <Sun size={32} className="text-yellow-500" />
                ) : (
                  <Moon size={32} className="text-blue-700" />
                )}
              </div>

              <div className="flex-1">
                <div className="font-semibold text-lg">
                  {start.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="flex items-center text-gray-700 mt-1 space-x-2">
                  <Clock size={16} />
                  <span>
                    {start.toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}{" "}
                    -{" "}
                    {end.toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                  <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    {duration}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-gray-700 mt-1">
                  <MapPin size={16} />
                  <span>Field {b.field_number}</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                      isMorning
                        ? "bg-yellow-200 text-yellow-800"
                        : "bg-blue-300 text-blue-900"
                    }`}
                  >
                    {isMorning ? "Morning" : "Night"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {bookings.length === 0 && (
          <div className="text-center text-gray-400">
            No upcoming bookings found.
          </div>
        )}
      </div>
    </div>
  );
}
