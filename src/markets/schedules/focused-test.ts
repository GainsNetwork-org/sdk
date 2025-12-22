import { DateTime, IANAZone } from "luxon";
import { isOpenAt } from "./checkers";
import { TradFiMarket } from "./index";

const ET = IANAZone.create("America/New_York");

// Helper function to create a Date object with ET timezone
function createDateET(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  return DateTime.fromObject(
    { year, month, day, hour, minute },
    { zone: ET }
  ).toJSDate();
}

// Test case definition
interface TestCase {
  description: string;
  date: Date;
}

// Define test cases for the specific dates and times requested
const testCases: TestCase[] = [
  {
    description: "December 24, 2025 at 11:30 AM ET (Christmas Eve morning)",
    date: createDateET(2025, 12, 24, 11, 30),
  },
  {
    description: "December 24, 2025 at 12:30 PM ET (Christmas Eve noon)",
    date: createDateET(2025, 12, 24, 12, 30),
  },
  {
    description: "December 24, 2025 at 1:30 PM ET (Christmas Eve afternoon)",
    date: createDateET(2025, 12, 24, 13, 30),
  },
  {
    description: "December 25, 2025 at 1:00 PM ET (Christmas Day)",
    date: createDateET(2025, 12, 25, 13, 0),
  },
  {
    description: "December 31, 2025 at 1:00 PM ET (New Year's Eve)",
    date: createDateET(2025, 12, 31, 13, 0),
  },
  {
    description: "January 1, 2026 at 1:00 PM ET (New Year's Day)",
    date: createDateET(2026, 1, 1, 13, 0),
  },
];

// Run the tests
function runTests() {
  console.log("=".repeat(80));
  console.log("MARKET HOURS TEST RESULTS - FOCUSED TEST");
  console.log("=".repeat(80));
  
  for (const testCase of testCases) {
    console.log(`\nTest: ${testCase.description}`);
    console.log(`Date: ${testCase.date.toLocaleString("en-US", { timeZone: "America/New_York" })} ET`);
    console.log("-".repeat(50));
    
    const markets: TradFiMarket[] = ["forex", "stocks", "indices", "commodities"];
    
    for (const market of markets) {
      const isOpen = isOpenAt(market, testCase.date);
      console.log(
        `${market.padEnd(12)} | Status: ${isOpen ? "OPEN" : "CLOSED"}`
      );
    }
  }
  
  console.log("\n" + "=".repeat(80));
}

// Run the tests
runTests();
