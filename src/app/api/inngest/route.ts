import { serve } from 'inngest/next';
import { inngest, cascadeWorkflow, automatedCalendarSync } from '@/lib/inngest';

// This exposes the Inngest API endpoint so the Inngest Cloud can trigger our serverless functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    cascadeWorkflow,
    automatedCalendarSync,
  ],
});
