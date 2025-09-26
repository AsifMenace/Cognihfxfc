import React, { useEffect, useState } from "react";
import { Calendar, Clock } from "lucide-react"; // Using lucide-react icon library

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

// Formatting function for time string "16:00:00" → "4pm"
function formatTime(timeStr: string): string {
  const [hour, minute] = timeStr.split(":").map(Number);
  const suffix = hour >= 12 ? "pm" : "am";
  const hour12 = ((hour + 11) % 12) + 1; // Convert to 12-hour format
  return `${hour12}${
    minute > 0 ? `:${minute.toString().padStart(2, "0")}` : ""
  }${suffix}`;
}

export default function BookingVotingWidget() {
  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | "">("");
  const [voteStatus, setVoteStatus] = useState<"in" | "out" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voteResult, setVoteResult] = useState<VoteResult>({
    in: [],
    out: [],
    inCount: 0,
    outCount: 0,
  });
  const [loading, setLoading] = useState(false);

  // Get next upcoming booking on mount
  useEffect(() => {
    async function fetchNextBooking() {
      try {
        const res = await fetch("/.netlify/functions/getUpcomingBookings");
        const bookings = await res.json();
        if (bookings.length > 0) {
          const booking = bookings[0];
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

  // Fetch players and vote results when bookingInfo changes
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
    setVoteStatus(null);
    setError(null);
  }, [bookingInfo]);

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
    if (voteStatus === vote) {
      setError(`You have already voted '${vote.toUpperCase()}'.`);
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
      setVoteStatus(vote);
      setVoteResult({
        in: data.inPlayers || voteResult.in,
        out: data.outPlayers || voteResult.out,
        inCount: data.inCount || voteResult.inCount,
        outCount: data.outCount || voteResult.outCount,
      });
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

  return (
    <div className="max-w-md mx-auto bg-white rounded shadow p-6">
      <h3 className="text-xl font-bold mb-1 text-center">
        Vote Your Availability
      </h3>
      {/* <p className="text-center text-gray-600 mb-4">
        For booking on{" "}
        {new Date(bookingInfo.booking_date).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}{" "}
        from {bookingInfo.start_time} to {bookingInfo.end_time}
      </p> */}

      <p className="flex justify-center items-center space-x-3 text-gray-600 mb-4">
        <Calendar className="w-5 h-5" />
        <span>
          {new Date(bookingInfo.booking_date).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
        <Clock className="w-5 h-5" />
        <span>
          {formatTime(bookingInfo.start_time)} to{" "}
          {formatTime(bookingInfo.end_time)}
        </span>
      </p>

      <label htmlFor="player-select" className="block mb-1 font-medium">
        Select Your Name
      </label>
      <select
        id="player-select"
        aria-label="Select Player Name"
        value={selectedPlayerId}
        onChange={(e) => setSelectedPlayerId(Number(e.target.value))}
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
          disabled={!selectedPlayerId || voteStatus === "in" || loading}
          onClick={() => handleVote("in")}
          className={`px-5 py-2 rounded font-semibold text-white ${
            voteStatus === "in"
              ? "bg-green-500 opacity-50 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          IN
        </button>
        <button
          disabled={!selectedPlayerId || voteStatus === "out" || loading}
          onClick={() => handleVote("out")}
          className={`px-5 py-2 rounded font-semibold text-white ${
            voteStatus === "out"
              ? "bg-red-500 opacity-50 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          OUT
        </button>
      </div>

      {error && <p className="text-center text-red-600 mb-3">{error}</p>}
      {voteStatus && !error && (
        <p className="text-center text-green-600 font-semibold mb-3">
          Your vote has been recorded as{" "}
          <span className="uppercase">{voteStatus}</span>.
        </p>
      )}

      <hr className="my-4" />

      <div>
        <h4 className="font-semibold mb-2">IN ({voteResult.inCount})</h4>
        <div className="flex overflow-x-auto space-x-2 mb-4">
          {voteResult.in.map((player) => (
            <img
              key={player.id}
              src={player.photo || ""}
              alt={player.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-green-500"
              title={player.name}
              referrerPolicy="no-referrer"
            />
          ))}
        </div>

        <h4 className="font-semibold mb-2">OUT ({voteResult.outCount})</h4>
        <div className="flex overflow-x-auto space-x-2">
          {voteResult.out.map((player) => (
            <img
              key={player.id}
              src={player.photo || ""}
              alt={player.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-red-500"
              title={player.name}
              referrerPolicy="no-referrer"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
