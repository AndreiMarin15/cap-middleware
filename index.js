const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const userRoutes = require("./routes/userRoutes");
const setupDbSubscription = require("./lib/middleware/dbSetup");
const port = 3006;

app.use(cors());
app.use(bodyParser.json());

// middleware and routes...

// setup database subscription
setupDbSubscription();

app.use("/user", userRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to my server!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
