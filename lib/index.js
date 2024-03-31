const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const userRoutes = require("./routes/userRoutes");
const apiRoutes = require("./routes/apiRoutes");
const port = 3006;

const { createClient } = require("@supabase/supabase-js");

app.use(cors());
app.use(bodyParser.json());

// Initialize the Supabase clients
const ET = createClient(
  "https://vtciatzxvkkgtutukoil.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0Y2lhdHp4dmtrZ3R1dHVrb2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDE5NTc2MTUsImV4cCI6MjAxNzUzMzYxNX0.WXXhafW7nm_aHs0f-RebsqhCLnxesbT9c9G1uQOAFsw",
);
const MW = createClient(
  "https://ymlflryrqmphiaprtgje.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbGZscnlycW1waGlhcHJ0Z2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk3OTMwNDksImV4cCI6MjAyNTM2OTA0OX0.U7q3cX0NwVfaagNbSvwOJOz0z6DnCvV29nRN5iQ3yBw",
);

// This function fetches new data from the ET database and inserts it into the MW database

const handleInserts = async (payload) => {
	// Get the inserted row
	const row = payload.new;
	console.log(payload);
	// Insert the row into the MW database
	const { error } = await MW.from(payload.table).insert(row);

	if (error) {
		console.error("Error inserting row:", error);
	}
};

const setupDbSubscription = () => {
	ET.channel("sync").on("postgres_changes", { event: "*", schema: "public" }, handleInserts).subscribe();
};

setupDbSubscription();

// Schedule the syncData function to run every minute

app.use("/user", userRoutes);

app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to my server!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
