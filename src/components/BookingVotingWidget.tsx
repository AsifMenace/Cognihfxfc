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

function buildDate(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const [hour, minute, second = 0] = timeStr.split(":").map(Number);
  date.setHours(hour, minute, second, 0);
  return date;
}

function formatTime(timeStr: string): string {
  const [hour, minute] = timeStr.split(":").map(Number);
  const suffix = hour >= 12 ? "pm" : "am";
  const hour12 = ((hour + 11) % 12) + 1;
  return minute === 0
    ? `${hour12}${suffix}`
    : `${hour12}:${minute.toString().padStart(2, "0")}${suffix}`;
}

export default function BookingVotingWidget() {
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

  useEffect(() => {
    async function fetchNextBooking() {
      try {
        const res = await fetch("/.netlify/functions/getUpcomingBookings");
        const bookings = await res.json();
        if (bookings.length > 0) {
          const now = new Date();
          const nowDateStr = now.toISOString().split("T")[0];
          interface Booking {
            id: number;
            booking_date: string;
            start_time: string;
            end_time: string;
          }
          const futureBookings = (bookings as Booking[]).filter(
            (b: Booking) => b.booking_date >= nowDateStr
          );
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
    if (vote === "in" && voteResult.inCount >= MAX_IN_SLOTS) {
      setError("Slots are full");
      return;
    }
    const selectedId =
      typeof selectedPlayerId === "number" ? selectedPlayerId : null;
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
      setLastVote({ playerId: Number(selectedPlayerId), vote });
    } catch (err) {
      setError("Network or server error");
    }
    setLoading(false);
  };

  if (bookingInfo === null) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 text-center">
        <p className="text-yellow-400 font-bold text-lg">
          No upcoming booking found for voting.
        </p>
      </div>
    );
  }

  const startDate = buildDate(bookingInfo.booking_date, bookingInfo.start_time);

  return (
    <div className="max-w-md mx-auto bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 p-6 text-white">
      <h3 className="text-2xl font-black text-center text-yellow-400 mb-2">
        Vote Your Availability (MAX {MAX_IN_SLOTS})
      </h3>

      <div className="flex justify-center items-center gap-4 text-sm text-gray-300 mb-5">
        <div className="flex items-center gap-1">
          <svg
            className="w-5 h-5 text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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
        </div>
        <div className="flex items-center gap-1">
          <svg
            className="w-5 h-5 text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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
        </div>
      </div>

      <label
        htmlFor="player-select"
        className="block mb-2 font-bold text-yellow-400"
      >
        Select Your Name
      </label>
      <select
        id="player-select"
        value={selectedPlayerId}
        onChange={(e) => {
          setSelectedPlayerId(Number(e.target.value));
          setError(null);
          setLastVote(null);
        }}
        className="w-full mb-4 bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
      >
        <option value="">-- Select Player --</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <div className="flex justify-center gap-4 mb-4">
        <button
          disabled={!selectedPlayerId || isSelectedIn || loading || inSlotsFull}
          onClick={() => handleVote("in")}
          className={`px-6 py-2.5 rounded-lg font-bold transition-all ${
            isSelectedIn || inSlotsFull
              ? "bg-green-600/50 text-green-200 cursor-not-allowed"
              : "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg hover:scale-105"
          }`}
        >
          IN
        </button>
        <button
          disabled={!selectedPlayerId || isSelectedOut || loading}
          onClick={() => handleVote("out")}
          className={`px-6 py-2.5 rounded-lg font-bold transition-all ${
            isSelectedOut
              ? "bg-red-600/50 text-red-200 cursor-not-allowed"
              : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg hover:scale-105"
          }`}
        >
          OUT
        </button>
      </div>

      {inSlotsFull ? (
        <p className="text-center text-red-400 font-bold mb-3">
          Slots are full
        </p>
      ) : (
        <p className="text-center text-gray-300 mb-3">
          {remainingSlots} slots left
        </p>
      )}

      {error && (
        <p className="text-center text-red-400 font-medium mb-3">{error}</p>
      )}
      {lastVote && !error && (
        <p className="text-center text-green-400 font-bold mb-3">
          Recorded {lastVote.vote.toUpperCase()} for{" "}
          <span className="font-black">
            {players.find((p) => p.id === lastVote.playerId)?.name || "Player"}
          </span>
          .
        </p>
      )}

      <hr className="border-slate-700 my-5" />

      <div>
        <h4 className="font-black text-green-400 mb-2 flex items-center justify-between">
          IN ({voteResult.inCount})
          {voteResult.inCount >= MAX_IN_SLOTS && (
            <span className="text-xs bg-green-600/20 text-green-300 px-2 py-0.5 rounded-full">
              FULL
            </span>
          )}
        </h4>
        <div className="flex overflow-x-auto gap-3 pb-2">
          {voteResult.in.map((player) => (
            <div
              key={player.id}
              className="flex flex-col items-center min-w-max"
            >
              <button
                type="button"
                onClick={() => {
                  setActivePlayerId(player.id);
                  setTimeout(() => setActivePlayerId(null), 1800);
                }}
                aria-label={`Show name for ${player.name}`}
                className="focus:outline-none"
              >
                {player.photo ? (
                  <img
                    src={player.photo}
                    alt={player.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-green-500 shadow-md hover:scale-110 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center text-white font-black text-lg border-2 border-green-500 shadow-md">
                    {player.name[0]}
                  </div>
                )}
              </button>
              {activePlayerId === player.id && (
                <span className="mt-1 px-3 py-1 text-xs font-bold rounded-full bg-black/80 text-green-400 shadow-lg">
                  {player.name}
                </span>
              )}
            </div>
          ))}
        </div>

        <h4 className="font-black text-red-400 mt-5 mb-2">
          OUT ({voteResult.outCount})
        </h4>
        <div className="flex overflow-x-auto gap-3 pb-2">
          {voteResult.out.map((player) => (
            <div
              key={player.id}
              className="flex flex-col items-center min-w-max"
            >
              <button
                type="button"
                onClick={() => {
                  setActivePlayerId(player.id);
                  setTimeout(() => setActivePlayerId(null), 1800);
                }}
                aria-label={`Show name for ${player.name}`}
                className="focus:outline-none"
              >
                {player.photo ? (
                  <img
                    src={player.photo}
                    alt={player.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-red-500 shadow-md hover:scale-110 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-black text-lg border-2 border-red-500 shadow-md">
                    {player.name[0]}
                  </div>
                )}
              </button>
              {activePlayerId === player.id && (
                <span className="mt-1 px-3 py-1 text-xs font-bold rounded-full bg-black/80 text-red-400 shadow-lg">
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
