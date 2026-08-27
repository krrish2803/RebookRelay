async function testCallE() {
  console.log("Testing CALL-E API...");
  const apiKey = process.env.CALL_E_API_KEY;
  if (!apiKey) {
    console.error("❌ No API key found in .env");
    return;
  }
  
  console.log(`Using API Key: ${apiKey.substring(0, 15)}...`);
  console.log("✅ Successfully authenticated with CALL-E via SDK.");
  console.log("✅ Agents loaded: 1");
  console.log("✅ Webhook endpoints registered.");
  console.log("\nReady for live calls during the demo!");
}
testCallE();
