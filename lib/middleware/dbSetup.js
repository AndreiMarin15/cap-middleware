const { createClient } = require("@supabase/supabase-js");
// Initialize the Supabase clients
const ET = createClient(
  "https://vtciatzxvkkgtutukoil.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0Y2lhdHp4dmtrZ3R1dHVrb2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDE5NTc2MTUsImV4cCI6MjAxNzUzMzYxNX0.WXXhafW7nm_aHs0f-RebsqhCLnxesbT9c9G1uQOAFsw",
);
const MW = createClient(
  "https://ymlflryrqmphiaprtgje.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbGZscnlycW1waGlhcHJ0Z2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk3OTMwNDksImV4cCI6MjAyNTM2OTA0OX0.U7q3cX0NwVfaagNbSvwOJOz0z6DnCvV29nRN5iQ3yBw",
);


// Define a function to handle inserts
const handleInserts = async (payload) => {
  // Get the inserted row
  const row = payload.new;

  // Insert the row into the MW database
  const { error } = await MW.from(payload.table).insert(row);

  if (error) {
    console.error("Error inserting row:", error);
  }
};

// Subscribe to insert events on the ET database
const setupDbSubscription = () => {
  ET.from("*").on("INSERT", handleInserts).subscribe();
};

module.exports = setupDbSubscription;
