import React, { useState } from "react";
import { Calendar as CalendarIcon, Star } from "lucide-react";

type CalendarProps = {
  bookedDates: string[]; // "YYYY-MM-DD" format booked dates
  onDateSelect?: (date: string) => void; // New prop
};

const Calendar: React.FC<CalendarProps> = ({ bookedDates, onDateSelect }) => {
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const FootballEmoji = () => (
    <span
      role="img"
      aria-label="football"
      className="absolute bottom-1 right-1 text-yellow-400 text-lg select-none"
      style={{ lineHeight: 1 }}
    >
      ⚽
    </span>
  );

  const formatDate = (day: number) =>
    `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;

  const isBooked = (date: string) => bookedDates.includes(date);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const monthName = new Date(currentYear, currentMonth).toLocaleString(
    "default",
    {
      month: "long",
    }
  );

  return (
    <div className="mb-6 max-w-md mx-auto p-4 bg-white rounded shadow">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={handlePrevMonth}
          className="px-2 py-1 rounded hover:bg-gray-200"
          aria-label="Previous month"
        >
          &lt;
        </button>
        <h3 className="text-xl font-semibold flex items-center space-x-2">
          <CalendarIcon />
          <span>
            {monthName} {currentYear}
          </span>
        </h3>
        <button
          onClick={handleNextMonth}
          className="px-2 py-1 rounded hover:bg-gray-200"
          aria-label="Next month"
        >
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm select-none">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((wd) => (
          <div key={wd} className="font-bold text-gray-500">
            {wd}
          </div>
        ))}
        {/* Empty slots for first day offset */}
        {Array(new Date(currentYear, currentMonth, 1).getDay())
          .fill(null)
          .map((_, idx) => (
            <div key={"empty" + idx} />
          ))}
        {/* Days */}
        {daysArray.map((day) => {
          const isoDate = formatDate(day);
          const booked = isBooked(isoDate);
          const isToday = isoDate === todayISO;
          let dayBgClass = "hover:bg-gray-100";
          if (isToday) {
            dayBgClass = "bg-red-600 text-white font-semibold";
          } else if (booked) {
            dayBgClass = "bg-blue-500 text-white font-semibold";
          }
          return (
            <div
              key={day}
              onClick={() => onDateSelect && onDateSelect(isoDate)} // notify parent
              className={`rounded cursor-default p-1 flex items-center justify-center space-x-1 ${dayBgClass}`}
              title={booked ? "Booking Scheduled" : isToday ? "Today" : ""}
            >
              <span className={isToday ? "font-bold" : undefined}>{day}</span>
              {booked && (
                <Star
                  className="w-4 h-4 text-yellow-300 flex-shrink-0"
                  fill="currentColor"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
