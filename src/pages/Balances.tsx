// src/pages/Balances.tsx - MOBILE-FIRST ✅
import { useState, useEffect } from "react";

interface Player {
  player: string;
  coreStatus: string;
  startingBalance: number;
  deposit2: number;
  gamesAttended: number;
  totalAmountConsumed: number;
  runningBalance: number;
}

interface Totals {
  totalRunningBalance: string;
  playerCount: number;
  corePlayers: number;
}

interface BalancesData {
  players: Player[];
  totals: Totals;
  summary: Summary;
}

interface Summary {
  coreFundsCollected?: number;
  totalBookingCosts?: number;
  totalFundsRemaining?: number;
  nonCoreCashReceived?: number;
  actualFundsRemaining?: number;
  coreFundsToExhaust?: number;
}

export default function Balances() {
  const [data, setData] = useState<BalancesData>({
    players: [],
    totals: { playerCount: 0, corePlayers: 0, totalRunningBalance: "0" },
    summary: {
      coreFundsCollected: 0,
      totalBookingCosts: 0,
      totalFundsRemaining: 0,
      nonCoreCashReceived: 0,
      actualFundsRemaining: 0,
      coreFundsToExhaust: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    fetch("/.netlify/functions/getBalances")
      .then((res) => res.json())
      .then((result: BalancesData & { summary: Summary }) => setData(result))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading balances...</p>
      </div>
    );
  }

  // Flip signs for display (negative → positive)
  const displayPlayers = data.players.map((player) => {
    // Determine balance status and color based on raw runningBalance
    let balanceStatus: "owed" | "low" | "almost-finished" | "deposited";

    if (player.runningBalance > 0) {
      balanceStatus = "owed"; // RED
    } else if (player.runningBalance >= -20 && player.runningBalance <= 0) {
      balanceStatus = "almost-finished"; // ORANGE
    } else if (player.runningBalance >= -30 && player.runningBalance < -20) {
      balanceStatus = "low"; // YELLOW
    } else {
      balanceStatus = "deposited"; // GREEN
    }

    return {
      ...player,
      startingBalance: Math.abs(player.startingBalance),
      deposit2: Math.abs(player.deposit2),
      totalAmountConsumed: Math.abs(player.totalAmountConsumed),
      runningBalance: Math.abs(player.runningBalance) * -1, // Flip for balance logic
      isBalancePositive: player.runningBalance > 0,
      balanceStatus,
    };
  });

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen">
      {/* Dark Yellow Header */}
      <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-wide mb-8 bg-gradient-to-r bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 drop-shadow-2xl">
        PLAYER{" "}
        <span className="text-transparent text-white drop-shadow-2xl">
          BALANCES
        </span>
      </h1>

      {/* Dark Table Container */}
      <div className="bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/50 overflow-hidden border border-gray-700/50">
        <div className="p-6 bg-gradient-to-r from-gray-700/30 to-gray-800/50 border-b border-yellow-500/20">
          <h2 className="text-xl font-black text-white mb-1 tracking-wide">
            Account Details 💰
          </h2>
          <p className="text-sm text-gray-400 font-medium">
            Swipe horizontally to view all columns
          </p>
        </div>

        <div className="overflow-x-auto pb-4 -mx-1 sm:-mx-2">
          <table className="w-full min-w-[650px] table-auto">
            <thead className="bg-gradient-to-r from-gray-700/50 to-gray-800/70 sticky top-0 backdrop-blur-md border-b border-gray-600">
              <tr>
                <th className="sticky left-0 z-10 px-6 py-4 text-left text-xs font-black text-gray-200 uppercase tracking-wider min-w-[120px] bg-gradient-to-r from-gray-700/50 to-gray-800/70">
                  Player
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-200 uppercase tracking-wider min-w-[90px]">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-200 uppercase tracking-wider min-w-[100px]">
                  Initial Deposit
                </th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-200 uppercase tracking-wider min-w-[100px]">
                  Second Deposit
                </th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-200 uppercase tracking-wider min-w-[80px]">
                  Games Played
                </th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-200 uppercase tracking-wider min-w-[100px]">
                  Total Deposit
                </th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-200 uppercase tracking-wider min-w-[110px]">
                  Amount Consumed
                </th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-200 uppercase tracking-wider min-w-[100px]">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {displayPlayers.map((player, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-700/50 transition-all duration-200"
                >
                  <td className="sticky left-0 z-10 px-6 py-5 font-black text-lg text-white min-w-[120px] bg-gray-800/90">
                    {player.player}
                  </td>
                  <td className="px-6 py-5 min-w-[90px]">
                    <span
                      className={`inline-flex px-3 py-1.5 rounded-full text-sm font-bold shadow-lg ${
                        player.coreStatus.includes("Core")
                          ? "bg-gradient-to-r from-emerald-500/90 to-teal-500/90 text-white shadow-emerald-500/50"
                          : "bg-gradient-to-r from-gray-600/90 to-gray-700/90 text-gray-200 shadow-gray-500/50"
                      }`}
                    >
                      {player.coreStatus}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right text-lg font-bold text-gray-300 min-w-[100px]">
                    ${player.startingBalance.toFixed(2)}
                  </td>
                  <td className="px-6 py-5 text-right text-lg font-bold text-gray-300 min-w-[100px]">
                    ${player.deposit2.toFixed(2)}
                  </td>
                  <td className="px-6 py-5 text-right text-xl font-black text-yellow-400 min-w-[80px]">
                    {player.gamesAttended}
                  </td>
                  <td className="px-6 py-5 text-right text-lg font-bold text-green-300 min-w-[100px]">
                    ${(player.startingBalance + player.deposit2).toFixed(2)}
                  </td>
                  <td className="px-6 py-5 text-right text-lg font-bold text-red-300 min-w-[110px]">
                    ${player.totalAmountConsumed.toFixed(2)}
                  </td>
                  <td
                    className={`px-6 py-5 text-right text-xl font-black min-w-[100px] shadow-lg px-4 py-2 rounded-xl mx-2 inline-block ${
                      player.balanceStatus === "owed"
                        ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-red-500/50"
                        : player.balanceStatus === "low"
                          ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-yellow-500/50"
                          : player.balanceStatus === "almost-finished"
                            ? "bg-gradient-to-r from-orange-500 to-yellow-600 text-white shadow-orange-500/50"
                            : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/50"
                    }`}
                  >
                    {player.balanceStatus === "owed" ? "-" : ""}$
                    {Math.abs(player.runningBalance).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Section - Bottom of Table */}
      <div className="mt-8">
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="px-8 py-3 bg-gradient-to-r from-yellow-500/90 to-amber-500/90 text-black font-black text-lg rounded-xl shadow-xl hover:shadow-yellow-500/25 hover:scale-105 transition-all border border-yellow-400/50"
          >
            {showSummary ? "↑ Hide Summary" : "↓ Show Summary Details"}
          </button>
        </div>

        {showSummary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl">
            {[
              {
                label: "Core Funds Collected (A)",
                value: data.summary.coreFundsCollected,
              },
              {
                label: "Total Booking Costs (B)",
                value: data.summary.totalBookingCosts,
                color: "blue-400",
              },
              {
                label: "Funds After Booking (C) (A - B)",
                value: data.summary.totalFundsRemaining,
              },
              {
                label: "Non-Core Cash Received (D)",
                value: data.summary.nonCoreCashReceived,
                color: "lime-400",
              },
              {
                label: "Actual Funds Remaining (C + D)",
                value: data.summary.actualFundsRemaining,
              },
              // {
              //   label: "Deposits To Exhaust / Refund (E)",
              //   value: data.summary.coreFundsToExhaust,
              // },
            ].map(({ label, value, color = "emerald-400" }) => {
              const isPositive = (value ?? 0) >= 0;
              const textColor =
                color === "blue-400"
                  ? "text-blue-400"
                  : color === "lime-400"
                    ? "text-lime-400"
                    : isPositive
                      ? "text-emerald-400"
                      : "text-red-400";

              return (
                <div
                  key={label}
                  className="rounded-2xl border border-gray-700 bg-gray-900/70 p-4 shadow-md"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {label}
                  </p>
                  <p className={`mt-2 text-2xl font-black ${textColor}`}>
                    {(() => {
                      const num = value ?? 0;
                      const sign = num < 0 ? "-" : "";
                      const absValue = Math.abs(num).toFixed(2);
                      return `${sign}$${absValue}`;
                    })()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Dark Empty State */}
      {displayPlayers.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl text-gray-600 mb-6">📊</div>
          <p className="text-2xl font-black text-gray-400 mb-2">
            No Players Found
          </p>
          <p className="text-gray-500">Check back later for balance updates</p>
        </div>
      )}
    </div>
  );
}
