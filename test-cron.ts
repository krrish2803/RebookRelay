import { syncGoogleCalendarEvents } from './src/lib/calendar-sync';
import prisma from './src/lib/prisma';

async function testSync() {
  console.log("Starting Calendar Sync Test...");
  try {
    const firstClinic = await prisma.clinic.findFirst();
    
    if (!firstClinic) {
      console.log("❌ No clinic found in the database. Please sign up through the UI first.");
      return;
    }

    console.log(`✅ Found Clinic: ${firstClinic.name} (${firstClinic.id})`);
    
    // Run the sync
    const result = await syncGoogleCalendarEvents(firstClinic.id);
    
    console.log("\n🎉 SYNC COMPLETED SUCCESSFULLY!");
    console.log("--------------------------------");
    console.log(`Events Synced: ${result.syncedCount}`);
    console.log(`No-Shows Detected: ${result.noShowsDetected}`);
    console.log(`Cascades Initiated: ${result.cascadesInitiated}`);
    console.log("--------------------------------");
    
  } catch (error) {
    console.error("❌ Test Failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testSync();
