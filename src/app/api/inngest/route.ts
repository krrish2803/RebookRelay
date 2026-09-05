import { serve } from 'inngest/next';
import { inngest, cascadeWorkflow, automatedCalendarSync } from '@/lib/inngest';

// This exposes the Inngest API endpoint so the Inngest Cloud can trigger our serverless functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    cascadeWorkflow, // We register our cascade orchestrator here!
    automatedCalendarSync, // The 15-minute CRON job
  ],
  // In development, skip signature validation so local testing and the Inngest Dev Server work without errors.
  // In production, Inngest Cloud enforces cryptographic x-inngest-signature validation.
  skipSignatureValidation: process.env.NODE_ENV === 'development',
});
