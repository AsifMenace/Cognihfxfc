import React, { useEffect, useState } from "react";

type Player = {
  id: number;
  name: string;
  photo?: string;
};

type VoteResult = {
  in: Player[];
  out: Player[];
  inCount: number;
  outCount: number;
};

type BookingInfo = {
  id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
};

// Helper to build local Date object from date string and time string
function buildDate(dateStr: string, timeStr: string): Date {
  // Parse to local year, month, day numbers
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const [hour, minute, second = 0] = timeStr.split(":").map(Number);
  date.setHours(hour, minute, second, 0);
  return date;
}

// Format time like 16:00:00 -> "4pm" or "4:30pm"
function formatTime(timeStr: string): string {
  const [hour, minute] = timeStr.split(":").map(Number);
  const suffix = hour >= 12 ? "pm" : "am";
  const hour12 = ((hour + 11) % 12) + 1;
  return minute === 0
    ? `${hour12}${suffix}`
    : `${hour12}:${minute.toString().padStart(2, "0")}${suffix}`;
}

export default function BookingVotingWidget() {
  // change this constant to update the maximum IN slots in one place
  const MAX_IN_SLOTS = 14;
  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [voteResult, setVoteResult] = useState<VoteResult>({
    in: [],
    out: [],
    inCount: 0,
    outCount: 0,
  });
  const [lastVote, setLastVote] = useState<{
    playerId: number;
    vote: "in" | "out";
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activePlayerId, setActivePlayerId] = useState<number | null>(null);

  // Fetch next upcoming booking on mount
  useEffect(() => {
    async function fetchNextBooking() {
      try {
        const res = await fetch("/.netlify/functions/getUpcomingBookings");
        const bookings = await res.json();
        if (bookings.length > 0) {
          // Find the most recent future booking (including today)
          const now = new Date();
          const nowDateStr = now.toISOString().split("T")[0];
          // Filter bookings for today or future
          interface Booking {
            id: number;
            booking_date: string;
            start_time: string;
            end_time: string;
          }
          const futureBookings = (bookings as Booking[]).filter(
            (b: Booking) => {
              // Compare booking_date (YYYY-MM-DD) with today
              return b.booking_date >= nowDateStr;
            }
          );
          // If there are future bookings, pick the earliest one
          const booking =
            futureBookings.length > 0 ? futureBookings[0] : bookings[0];
          setBookingInfo({
            id: booking.id,
            booking_date: booking.booking_date,
            start_time: booking.start_time,
            end_time: booking.end_time,
          });
        } else {
          setBookingInfo(null);
        }
      } catch (err) {
        console.error("Failed fetching next booking", err);
        setBookingInfo(null);
      }
    }
    fetchNextBooking();
  }, []);

  // Fetch players and vote results whenever bookingInfo changes
  useEffect(() => {
    if (!bookingInfo) return;

    async function fetchPlayers() {
      try {
        const res = await fetch("/.netlify/functions/getPlayers");
        if (!res.ok) throw new Error("Failed to fetch players");
        const data: Player[] = await res.json();
        setPlayers(data);
      } catch (err) {
        console.error(err);
      }
    }

    async function fetchVoteResults() {
      try {
        const res = await fetch(
          `/.netlify/functions/getPollResults?bookingId=${bookingInfo!.id}`
        );
        if (!res.ok) throw new Error("Failed to fetch vote results");
        const data = await res.json();
        setVoteResult({
          in: data.inPlayers || [],
          out: data.outPlayers || [],
          inCount: data.inCount || 0,
          outCount: data.outCount || 0,
        });
      } catch (err) {
        console.error(err);
      }
    }

    fetchPlayers();
    fetchVoteResults();
    setSelectedPlayerId("");
    setError(null);
  }, [bookingInfo]);

  // derived helpers for button states
  const selectedId =
    typeof selectedPlayerId === "number" ? selectedPlayerId : null;
  const isSelectedIn =
    selectedId !== null && voteResult.in.some((p) => p.id === selectedId);
  const isSelectedOut =
    selectedId !== null && voteResult.out.some((p) => p.id === selectedId);
  const inSlotsFull = voteResult.inCount >= MAX_IN_SLOTS;
  const remainingSlots = Math.max(0, MAX_IN_SLOTS - voteResult.inCount);

  const handleVote = async (vote: "in" | "out") => {
    if (!bookingInfo) {
      setError("No upcoming booking available for voting.");
      return;
    }
    setError(null);
    if (!selectedPlayerId) {
      setError("Please select your name.");
      return;
    }
    // Prevent adding more than MAX_IN_SLOTS "IN" votes
    if (vote === "in" && voteResult.inCount >= MAX_IN_SLOTS) {
      setError("Slots are full");
      return;
    }

    const selectedId =
      typeof selectedPlayerId === "number" ? selectedPlayerId : null;
    // Prevent same player from being added twice to same list
    if (
      vote === "in" &&
      selectedId !== null &&
      voteResult.in.some((p) => p.id === selectedId)
    ) {
      setError("Player is already marked IN");
      return;
    }
    if (
      vote === "out" &&
      selectedId !== null &&
      voteResult.out.some((p) => p.id === selectedId)
    ) {
      setError("Player is already marked OUT");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/pollVote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingInfo.id,
          player_id: selectedPlayerId,
          vote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit vote");
        setLoading(false);
        return;
      }
      setVoteResult({
        in: data.inPlayers || voteResult.in,
        out: data.outPlayers || voteResult.out,
        inCount: data.inCount || voteResult.inCount,
        outCount: data.outCount || voteResult.outCount,
      });
      // store last vote for a transient confirmation message
      setLastVote({ playerId: Number(selectedPlayerId), vote });
    } catch (err) {
      setError("Network or server error");
    }
    setLoading(false);
  };

  if (bookingInfo === null) {
    return (
      <div className="p-6 bg-white rounded shadow text-center font-semibold">
        No upcoming booking found for voting.
      </div>
    );
  }

  // Build dates for display to fix timezone issues
  const startDate = buildDate(bookingInfo.booking_date, bookingInfo.start_time);

  return (
    <div className="max-w-md mx-auto bg-white rounded shadow p-6">
      <h3 className="text-xl font-bold mb-1 text-center">
        {`Vote Your Availability (MAX ${MAX_IN_SLOTS})`}
      </h3>
      <p className="flex justify-center items-center space-x-2 text-gray-600 mb-4">
        <span className="flex items-center space-x-1">
          {/* Calendar icon can be inserted here */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 inline-block"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z"
            />
          </svg>
          <span>
            {startDate.toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </span>
        <span className="flex items-center space-x-1">
          {/* Clock icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 inline-block"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            {formatTime(bookingInfo.start_time)} to{" "}
            {formatTime(bookingInfo.end_time)}
          </span>
        </span>
      </p>

      <label htmlFor="player-select" className="block mb-1 font-medium">
        Select Your Name
      </label>
      <select
        id="player-select"
        aria-label="Select Player Name"
        value={selectedPlayerId}
        onChange={(e) => {
          setSelectedPlayerId(Number(e.target.value));
          setError(null);
          setLastVote(null);
        }}
        className="w-full mb-4 border rounded px-3 py-2"
      >
        <option value="">-- Select Player --</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <div className="flex justify-center space-x-4 mb-3">
        <button
          disabled={!selectedPlayerId || isSelectedIn || loading || inSlotsFull}
          onClick={() => handleVote("in")}
          className={`px-5 py-2 rounded font-semibold text-white ${
            isSelectedIn || inSlotsFull
              ? "bg-green-500 opacity-50 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          IN
        </button>
        <button
          disabled={!selectedPlayerId || isSelectedOut || loading}
          onClick={() => handleVote("out")}
          className={`px-5 py-2 rounded font-semibold text-white ${
            isSelectedOut
              ? "bg-red-500 opacity-50 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          OUT
        </button>
      </div>

      {/* show remaining slots or full message */}
      {inSlotsFull ? (
        <p className="text-center text-red-600 font-semibold mb-3">
          Slots are full
        </p>
      ) : (
        <p className="text-center text-slate-600 mb-3">{`${remainingSlots} slots left`}</p>
      )}

      {error && <p className="text-center text-red-600 mb-3">{error}</p>}
      {lastVote && !error && (
        <p className="text-center text-green-600 font-semibold mb-3">
          {`Recorded ${lastVote.vote.toUpperCase()} for `}
          <span className="font-bold">
            {players.find((p) => p.id === lastVote.playerId)?.name || "Player"}
          </span>
          .
        </p>
      )}

      <hr className="my-4" />

      <div>
        <h4 className="font-semibold mb-2">IN ({voteResult.inCount})</h4>
        <div className="flex overflow-x-auto whitespace-nowrap space-x-2 mb-4">
          {voteResult.in.map((player) => (
            <div
              key={player.id}
              className="flex flex-col items-center min-w-max"
            >
              <button
                type="button"
                className="focus:outline-none"
                onClick={() => {
                  setActivePlayerId(player.id);
                  setTimeout(() => setActivePlayerId(null), 1800); // Hide after 1.8s
                }}
                aria-label={`Show name for ${player.name}`}
              >
                {player.photo ? (
                  <img
                    src={player.photo}
                    alt={player.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-green-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold border-2 border-green-500">
                    {player.name[0]}
                  </div>
                )}
              </button>
              {activePlayerId === player.id && (
                <span className="mt-1 px-2 py-1 text-xs rounded bg-gray-900 text-white z-10 shadow transition">
                  {player.name}
                </span>
              )}
            </div>
          ))}
        </div>

        <h4 className="font-semibold mb-2">OUT ({voteResult.outCount})</h4>
        <div className="flex overflow-x-auto whitespace-nowrap space-x-2 mb-4">
          {voteResult.out.map((player) => (
            <div
              key={player.id}
              className="flex flex-col items-center min-w-max"
            >
              <button
                type="button"
                className="focus:outline-none"
                onClick={() => {
                  setActivePlayerId(player.id);
                  setTimeout(() => setActivePlayerId(null), 1800);
                }}
                aria-label={`Show name for ${player.name}`}
              >
                {player.photo ? (
                  <img
                    src={player.photo}
                    alt={player.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-red-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold border-2 border-red-500">
                    {player.name[0]}
                  </div>
                )}
              </button>
              {activePlayerId === player.id && (
                <span className="mt-1 px-2 py-1 text-xs rounded bg-gray-900 text-white z-10 shadow transition">
                  {player.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
