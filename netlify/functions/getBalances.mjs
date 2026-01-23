// netlify/functions/getBalances.mjs - FINAL PRODUCTION VERSION
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
    const rows = await sheet.getRows();

    const players = rows
      .map((row) => {
        const raw = row._rawData || [];
        return {
          player: (raw[0] || "").trim(),
          coreStatus: (raw[1] || "").trim(),
          startingBalance:
            parseFloat((raw[2] || "0").replace(/[$,]/g, "")) || 0,
          deposit2: parseFloat((raw[3] || "0").replace(/[$,]/g, "")) || 0,
          gamesAttended: parseInt(raw[4] || "0") || 0,
          totalAmountConsumed:
            parseFloat((raw[5] || "0").replace(/[$,]/g, "")) || 0,
          runningBalance: parseFloat((raw[6] || "0").replace(/[$,]/g, "")) || 0,
        };
      })
      .filter((p) => p.player);

    const totals = {
      totalRunningBalance: players
        .reduce((sum, p) => sum + p.runningBalance, 0)
        .toFixed(2),
      playerCount: players.length,
      corePlayers: players.filter((p) =>
        p.coreStatus.toLowerCase().includes("core")
      ).length,
    };

    const summarySheet = doc.sheetsByTitle["Summary"];
    const summaryRows = await summarySheet.getRows();

    const summary = {};
    const dataRows = summaryRows.filter((row) => row._rawData?.[1]?.trim());
    console.log("Data rows found:", dataRows.length);

    if (dataRows.length >= 5) {
      // Row 0: Total funds collected
      summary.coreFundsCollected =
        parseFloat((dataRows[0]._rawData[1] || "0").replace(/[$,]/g, "")) || 0;

      // Row 0: Total Booking Costs Covered → 5540.94
      summary.totalBookingCosts =
        parseFloat((dataRows[1]._rawData[1] || "0").replace(/[$,]/g, "")) || 0;

      // Row 1: Total Funds Remaining → -$1029.28
      summary.totalFundsRemaining =
        parseFloat((dataRows[2]._rawData[1] || "0").replace(/[$,]/g, "")) || 0;

      // Row 2: Total Non-Core Cash → $1339.96
      summary.nonCoreCashReceived =
        parseFloat((dataRows[3]._rawData[1] || "0").replace(/[$,]/g, "")) || 0;

      // Row 3: Actual Funds remaining → $310.68
      summary.actualFundsRemaining =
        parseFloat((dataRows[4]._rawData[1] || "0").replace(/[$,]/g, "")) || 0;

      // Row 4: Core Funds To Be Exhausted → -$660.84
      summary.coreFundsToExhaust =
        parseFloat((dataRows[5]._rawData[1] || "0").replace(/[$,]/g, "")) || 0;
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ players, summary, totals }, null, 2),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
