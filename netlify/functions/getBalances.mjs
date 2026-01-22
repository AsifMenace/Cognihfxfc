import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

export async function handler(event) {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const doc = new GoogleSpreadsheet(
      "1T0jNJizEZVW-XwCnEWhvPW84uMS6E2mHnjm6MNH60Qk",
      serviceAccountAuth
    );

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle["SummaryForApp"];
    const rows = await sheet.getRows({ offset: 1 }); // Skip header row

    console.log("Found rows:", rows.length); // Debug

    const players = rows
      .map((row) => {
        const playerData = {
          player: row.Player || row.get("Player") || "",
          coreStatus: row.Core_NonCore || row.get("Core_NonCore") || "",
          startingBalance: parseFloat(row.Starting_Balance || 0),
          deposit2: parseFloat(row.Deposit_2 || 0),
          gamesAttended: parseInt(row.Games_Attended || 0),
          totalAmountConsumed: parseFloat(row.Total_Amount_Consumed || 0),
          runningBalance: parseFloat(row.Running_Balance || 0),
        };
        console.log(
          "Player:",
          playerData.player,
          "Balance:",
          playerData.runningBalance
        ); // Debug
        return playerData;
      })
      .filter((p) => p.player && p.player.trim());

    const totals = {
      totalRunningBalance: players.reduce(
        (sum, p) => sum + (isNaN(p.runningBalance) ? 0 : p.runningBalance),
        0
      ),
      playerCount: players.length,
    };

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ players, totals }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
