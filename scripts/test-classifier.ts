
import "dotenv/config";
import { classifyTicket } from "../lib/ai/classify-ticket";

async function main() {
  const result = await classifyTicket(
    "Payment system down",
    "Our customers cannot make any payments. This has been happening for two hours and we're losing sales."
  );

  console.log("AI Classification:");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Classification failed:", error);
  process.exitCode = 1;
});
