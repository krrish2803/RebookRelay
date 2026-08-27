async function makeRealCallE() {
  console.log("Making a REAL request to CALL-E API to register on your dashboard...");
  
  const apiKey = process.env.CALL_E_API_KEY;
  if (!apiKey) {
    console.error("Missing CALL_E_API_KEY");
    return;
  }

  try {
    const response = await fetch("https://api.heycall-e.com/v1/calls", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        phone_number: "+15551234567", // Dummy number
        task: "Call and confirm the appointment for tomorrow.",
      })
    });

    const data = await response.json();
    console.log("Status Code:", response.status);
    console.log("Response Body:", data);
    
    if (response.ok) {
      console.log("✅ Successfully sent a request to the REAL CALL-E API!");
    } else {
      console.log("⚠️ Received an error from CALL-E, but the request WAS received by their servers (so it should show in logs).");
    }

  } catch (err) {
    console.error("Network error hitting CALL-E API:", err);
  }
}

makeRealCallE();
