import React, { useEffect, useState } from "react";

function getTimeLeft(target: Date) {
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, expired: false };
}

const CountdownTimer: React.FC<{ kickOff: Date }> = ({ kickOff }) => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(kickOff));

  useEffect(() => {
    if (timeLeft.expired) return;
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(kickOff));
    }, 1000);

    return () => clearInterval(interval);
  }, [kickOff, timeLeft.expired]);

  if (timeLeft.expired)
    return (
      <span className="font-bold text-red-600 text-lg">
        Kickoff in progress or finished
      </span>
    );

  return (
    <div className="flex justify-center items-center gap-4 text-xl md:text-2xl font-bold mb-4">
      <div>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded">
          {timeLeft.days}
        </span>{" "}
        <span className="text-slate-700">days</span>
      </div>
      <div>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded">
          {timeLeft.hours}
        </span>{" "}
        <span className="text-slate-700">hrs</span>
      </div>
      <div>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded">
          {timeLeft.minutes}
        </span>{" "}
        <span className="text-slate-700">min</span>
      </div>
      <div>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded">
          {timeLeft.seconds}
        </span>{" "}
        <span className="text-slate-700">sec</span>
      </div>
    </div>
  );
};

export default CountdownTimer;
