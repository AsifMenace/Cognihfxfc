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
  onDateSelect?: (date: string) => void;
};

function getDuration(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= startMin) endMin += 1440;
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
  const bookedDates = bookings.map((b) => b.booking_date.split("T")[0]);

  useEffect(() => {
    fetch("/.netlify/functions/getUpcomingBookings")
      .then((res) => res.json())
      .then(setBookings)
      .catch(console.error);
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
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedDate]);

  return (
    <>
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
              className={`flex-shrink-0 w-80 relative flex items-center p-4 rounded-lg shadow-lg transition-all ${
                isMorning
                  ? "bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border-l-4 border-yellow-500"
                  : "bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-l-4 border-blue-500"
              }`}
            >
              {isAdmin && (
                <button
                  onClick={() => handleDelete(b.id)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-red-600/80 hover:bg-red-500 text-white transition-all"
                  aria-label="Delete booking"
                >
                  <X size={16} />
                </button>
              )}

              <div className="mr-3">
                {isMorning ? (
                  <Sun size={32} className="text-yellow-400" />
                ) : (
                  <Moon size={32} className="text-blue-400" />
                )}
              </div>

              <div className="flex-1 text-white">
                <div className="font-bold text-lg">
                  {start.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </div>

                <div className="flex items-center text-gray-300 mt-1 space-x-2">
                  <Clock size={16} className="text-yellow-400" />
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
                  <span className="ml-2 px-2 py-1 rounded-full text-xs font-bold bg-green-600/30 text-green-300">
                    {duration}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-gray-300 mt-1">
                  <MapPin size={16} className="text-yellow-400" />
                  <span>Field {b.field_number}</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                      isMorning
                        ? "bg-yellow-600/30 text-yellow-300"
                        : "bg-blue-600/30 text-blue-300"
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
          <div className="text-center text-gray-400 w-full py-8">
            No upcoming bookings found.
          </div>
        )}
      </div>
    </>
  );
}
