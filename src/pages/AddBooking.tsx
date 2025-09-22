import React, { useState } from "react";

export default function AddBooking() {
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [session, setSession] = useState<"morning" | "night">("morning");
  const [fieldNumber, setFieldNumber] = useState<number | "">("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!bookingDate || !startTime || !endTime || !fieldNumber) {
      setMessage("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/.netlify/functions/addBooking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          session,
          field_number: fieldNumber,
        }),
      });

      if (res.ok) {
        setMessage("Booking added successfully!");
        setBookingDate("");
        setStartTime("");
        setEndTime("");
        setSession("morning");
        setFieldNumber("");
      } else {
        const error = await res.json();
        setMessage(error.error || "Failed to add booking");
      }
    } catch (err) {
      setMessage("Network error or server not responding");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow my-8">
      <h1 className="text-xl font-bold mb-4">Add Field Booking</h1>
      {message && (
        <div
          className={`mb-4 p-2 rounded ${
            message.includes("successfully")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          Booking Date:
          <input
            type="date"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            className="w-full p-2 border rounded mt-1"
            required
          />
        </label>

        <label className="block">
          Start Time:
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full p-2 border rounded mt-1"
            required
          />
        </label>

        <label className="block">
          End Time:
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full p-2 border rounded mt-1"
            required
          />
        </label>

        <label className="block">
          Session:
          <select
            value={session}
            onChange={(e) => setSession(e.target.value as "morning" | "night")}
            className="w-full p-2 border rounded mt-1"
          >
            <option value="morning">Morning</option>
            <option value="night">Night</option>
          </select>
        </label>

        <label className="block">
          Field Number:
          <input
            type="number"
            min={1}
            value={fieldNumber}
            onChange={(e) =>
              setFieldNumber(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
            className="w-full p-2 border rounded mt-1"
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Booking"}
        </button>
      </form>
    </div>
  );
}
