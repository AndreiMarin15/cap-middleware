const express = require("express");
const router = express.Router();
const cors = require("cors");
const app = express();

const api = require("../controllers/api");

app.use(cors());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  next();
});

router.get("/", api.visitMiddleware);
router.post("/insertFhirData", api.insertFhirData);
router.post("/insertEncounterData", api.insertEncounterData);
router.post("/getFhirData", api.getFhirData);
router.post("/addVitals", api.addVitals);

router.post("/consoleData", api.consoleData);

module.exports = router;
