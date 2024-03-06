const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const userRoutes = require("./routes/userRoutes");

const port = 3006;

app.use(cors({ origin: "http://localhost:4200" }));
app.use(bodyParser.json());

app.use("/user", userRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to my server!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
