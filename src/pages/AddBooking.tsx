import React, { useState } from "react";
import { getAdminHeaders } from "../utils/auth";

export default function AddBooking() {
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const session: "morning" | "night" = startTime && parseInt(startTime.split(":")[0]) >= 18 ? "night" : "morning";
  const [fieldNumber, setFieldNumber] = useState<number | "">("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!bookingDate || !startTime || !endTime || !fieldNumber) {
      setMessage({ text: "Please fill in all fields", ok: false });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/.netlify/functions/addBooking", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          session,
          field_number: fieldNumber,
        }),
      });

      if (res.ok) {
        setMessage({ text: "Booking added successfully!", ok: true });
        setBookingDate("");
        setStartTime("");
        setEndTime("");
        setFieldNumber("");
      } else {
        const error = await res.json();
        setMessage({ text: error.error || "Failed to add booking", ok: false });
      }
    } catch {
      setMessage({ text: "Network error or server not responding", ok: false });
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-500 focus:outline-none";
  const labelCls = "block mb-1 text-sm font-bold text-gray-300";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black py-8">
      <div className="container mx-auto px-4 max-w-lg">
        <h1 className="text-3xl font-black text-yellow-400 text-center mb-8">ADD FIELD BOOKING</h1>
        <form
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 md:p-8 space-y-5 shadow-2xl"
        >
          {message && (
            <p className={`text-sm font-medium ${message.ok ? "text-green-400" : "text-red-400"}`}>
              {message.text}
            </p>
          )}

          <div>
            <label className={labelCls}>Booking Date</label>
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              required
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Field Number</label>
            <input
              type="number"
              min={1}
              placeholder="e.g. 1"
              value={fieldNumber}
              onChange={(e) => setFieldNumber(e.target.value === "" ? "" : Number(e.target.value))}
              required
              className={inputCls}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black rounded-lg hover:scale-105 transition-all disabled:opacity-50"
          >
            {loading ? "ADDING..." : "ADD BOOKING"}
          </button>
        </form>
      </div>
    </div>
  );
}
