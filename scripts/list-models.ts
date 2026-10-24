
import "dotenv/config";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function main() {
  const response = await groq.models.list();

  console.log("Available GroqCloud models:");

  for (const model of response.data) {
    console.log(model.id);
  }
}

main().catch(console.error);
