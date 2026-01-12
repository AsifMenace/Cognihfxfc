const fetch = require("node-fetch");

exports.handler = async (event, context) => {
  try {
    // 🆕 YOUR 15 CLUBS WITH FotMob IDs
    const trackedClubs = [
      // La Liga
      { shortName: "RMA", fotmobId: 8633, fullName: "Real Madrid" }, // [web:269]
      { shortName: "BAR", fotmobId: 8634, fullName: "Barcelona" }, // [web:274]
      { shortName: "ATM", fotmobId: 8650, fullName: "Atlético Madrid" },

      // EPL
      { shortName: "MUN", fotmobId: 10260, fullName: "Manchester United" }, // [web:275]
      { shortName: "MCI", fotmobId: 9825, fullName: "Manchester City" },
      { shortName: "LIV", fotmobId: 8650, fullName: "Liverpool" }, // [web:276]
      { shortName: "ARS", fotmobId: 9824, fullName: "Arsenal" },
      { shortName: "CHE", fotmobId: 9826, fullName: "Chelsea" },

      // Bundesliga
      { shortName: "BAY", fotmobId: 9823, fullName: "Bayern Munich" }, // [web:277]
      { shortName: "DOR", fotmobId: 9827, fullName: "Borussia Dortmund" },

      // Others
      { shortName: "PSG", fotmobId: 9847, fullName: "PSG" }, // [web:278]
      { shortName: "ACM", fotmobId: 8564, fullName: "AC Milan" }, // [web:279]
      { shortName: "JUV", fotmobId: 8565, fullName: "Juventus" },
      { shortName: "INT", fotmobId: 8566, fullName: "Inter Milan" },
    ];

    const fixtures = [];
    const now = new Date();

    for (const club of trackedClubs) {
      try {
        // FotMob team fixtures endpoint (unofficial wrapper pattern)
        const fixturesRes = await fetch(
          `https://www.fotmob.com/api/teamsApi/teamFixtures?teamId=${club.fotmobId}&timeZone=America/New_York&comingMatches=true&tab=coming&ccode3=USA`
        );
        const fixturesData = await fixturesRes.json();

        // Process last match + next match (next 3 days)
        const matches = fixturesData.matches || [];

        // Last finished match (anytime)
        const lastMatch = matches.find(
          (m) => m.status === "finished" || m.status === "FT"
        );
        if (lastMatch) {
          fixtures.push({
            clubShort: club.shortName,
            type: "last",
            home:
              lastMatch.homeTeam.shortName ||
              lastMatch.homeTeam.name.slice(0, 3),
            away:
              lastMatch.awayTeam.shortName ||
              lastMatch.awayTeam.name.slice(0, 3),
            league: lastMatch.league.shortName || "LL",
            score: `${lastMatch.homeScore}-${lastMatch.awayScore}`,
            status: "FT",
            fotmobUrl: `https://www.fotmob.com/match/${lastMatch.id}`,
            timestamp: lastMatch.finishedTimestamp,
          });
        }

        // Next match (next 3 days)
        const nextMatch = matches.find(
          (m) =>
            !m.finished &&
            new Date(m.kickoffTimestamp) > now &&
            new Date(m.kickoffTimestamp) <
              new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
        );
        if (nextMatch) {
          fixtures.push({
            clubShort: club.shortName,
            type: "next",
            home:
              nextMatch.homeTeam.shortName ||
              nextMatch.homeTeam.name.slice(0, 3),
            away:
              nextMatch.awayTeam.shortName ||
              nextMatch.awayTeam.name.slice(0, 3),
            league: nextMatch.league.shortName || "LL",
            score: "vs",
            status: "Scheduled",
            fotmobUrl: `https://www.fotmob.com/match/${nextMatch.id}`,
            timestamp: nextMatch.kickoffTimestamp,
            kickoffLocal: new Date(nextMatch.kickoffTimestamp).toLocaleString(
              "en-US",
              {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }
            ),
          });
        }
      } catch (clubError) {
        console.error(`Error fetching ${club.shortName}:`, clubError);
      }
    }

    // Sort: last matches first, then upcoming by time
    fixtures.sort((a, b) => {
      if (a.type === "last" && b.type === "next") return -1;
      if (a.type === "next" && b.type === "last") return 1;
      return new Date(a.timestamp) - new Date(b.timestamp);
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(fixtures.slice(0, 20)), // Max 20 fixtures
    };
  } catch (error) {
    console.error("Global fixtures error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch fixtures" }),
    };
  }
};
