import React, { useEffect, useState } from "react";
import { Sun, Moon, MapPin, Clock } from "lucide-react";

type Booking = {
  id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  session: "morning" | "night";
  field_number: number;
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

export default function UpcomingBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    fetch("/.netlify/functions/getUpcomingBookings")
      .then((res) => res.json())
      .then(setBookings)
      .catch(console.error);
  }, []);

  return (
    <div className="mt-10 max-w-2xl mx-auto rounded-xl shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Upcoming Field Bookings
      </h2>
      <div className="space-y-4">
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
            // set time on local date
            date.setHours(hour, minute, second, 0);
            return date;
          }

          const start = buildDate(b.booking_date, startTime);
          const end = buildDate(b.booking_date, endTime);

          const duration = getDuration(b.start_time, b.end_time);

          return (
            <div
              key={b.id}
              className={`flex items-center p-4 rounded-lg shadow transition ${
                isMorning
                  ? "bg-yellow-50 border-l-4 border-yellow-400"
                  : "bg-blue-100 border-l-4 border-blue-500"
              }`}
            >
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
