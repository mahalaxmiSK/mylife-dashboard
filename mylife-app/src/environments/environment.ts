/**
 * The publishable key is meant to be here.
 *
 * It ships inside the JavaScript on a public site, so it is readable by
 * anyone. That is fine, and is the design: row-level security decides what a
 * request may see, and a caller holding only this key is not authenticated and
 * gets nothing (REQ-SYNC-05). The service_role key would be a different matter
 * entirely and must never appear in this file.
 *
 * Same values in development and production, so there is no environment
 * replacement to keep in step.
 */
export const environment = {
  supabaseUrl: 'https://zegnqnrmvnghaznuyjjo.supabase.co',
  supabasePublishableKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplZ25xbnJtdm5naGF6bnV5ampvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0ODk4OTMsImV4cCI6MjA5NDA2NTg5M30.ewsM_6UoxBn-qaEvE_0Nc_2ajsRvroyNmcx_JdcREpU'
};
