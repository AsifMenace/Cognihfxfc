import React, { useState } from "react";
import { Calendar as CalendarIcon, Star } from "lucide-react";

type CalendarProps = {
  bookedDates: string[];
  onDateSelect?: (date: string) => void;
};

const Calendar: React.FC<CalendarProps> = ({ bookedDates, onDateSelect }) => {
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const FootballEmoji = () => (
    <span
      role="img"
      aria-label="football"
      className="absolute bottom-1 right-1 text-yellow-400 text-lg select-none"
      style={{ lineHeight: 1 }}
    >
      Football
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
    <div className="mb-6 max-w-md mx-auto p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={handlePrevMonth}
          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold transition-all shadow-md"
          aria-label="Previous month"
        >
          &lt;
        </button>
        <h3 className="text-xl font-black flex items-center space-x-2 text-yellow-400">
          <CalendarIcon size={22} />
          <span>
            {monthName} {currentYear}
          </span>
        </h3>
        <button
          onClick={handleNextMonth}
          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold transition-all shadow-md"
          aria-label="Next month"
        >
          &gt;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm select-none">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((wd) => (
          <div key={wd} className="font-black text-yellow-500 py-1">
            {wd}
          </div>
        ))}

        {/* Empty slots */}
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

          let dayBgClass = "hover:bg-slate-700 hover:text-white";
          if (isToday) {
            dayBgClass =
              "bg-gradient-to-br from-red-600 to-red-700 text-white font-black";
          } else if (booked) {
            dayBgClass =
              "bg-gradient-to-br from-blue-600 to-blue-700 text-white font-black";
          }

          return (
            <div
              key={day}
              onClick={() => onDateSelect && onDateSelect(isoDate)}
              className={`rounded-lg cursor-pointer p-1 flex items-center justify-center space-x-1 transition-all ${dayBgClass}`}
              title={booked ? "Booking Scheduled" : isToday ? "Today" : ""}
            >
              <span className={isToday ? "font-black" : ""}>{day}</span>
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
