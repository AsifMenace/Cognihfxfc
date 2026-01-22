// netlify/functions/getBalances.mjs __
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
    const sheet = doc.sheetsByIndex[0]; // or by title if you prefer
    const rows = await sheet.getRows();

    const players = rows
      .map((row) => ({
        player: row.Player || "",
        coreStatus: row["Core/non Core"] || "",
        startingBalance: parseFloat(row["Starting Balance"] || 0),
        deposit2: parseFloat(row["Deposit #2(For dec/jan)"] || 0),
        gamesAttended: parseInt(row["Games Attended"] || 0),
        totalUsedFromSumUsed: parseFloat(row["Total used from Sum Used"] || 0),
        runningBalance: parseFloat(row["Running Balance"] || 0),
      }))
      .filter((p) => p.player);

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
