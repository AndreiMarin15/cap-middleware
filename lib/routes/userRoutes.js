const express = require("express");
const router = express.Router();
const cors = require("cors");
const app = express();

const userController = require("../controllers/userController");
const testController = require("../controllers/testController");
const api = require("../controllers/api");

app.use(cors());
router.get("/", userController.viewAccount);
router.get("/getMaps", userController.getMapping);

router.get("/getAllAPIKeys", testController.allApiKeys);

router.post("/postMap", userController.postMapping);

router.post("/uploadEncounter", testController.uploadEncounter);
router.post("/generateKey", testController.generateApiKey);
router.post("/requestApproval", testController.requestApproval);
router.post("/getRequests", testController.getPatientRequests);
router.post("/updateRequestStatus", testController.updateRequest);

router.post("/newUser", testController.newUser);
router.post("/login", testController.logIn);
router.post("/getKeys", testController.getApiKeysForUser);

router.get("/getKeys", testController.getApiKeysForUser);

router.post("/newMapping", testController.newMapping);

router.post("/mapTable", testController.mapTable);
router.post("/mapColumn", testController.mapColumn);

router.post("/mapForClient", testController.mapForClient);

router.post("/insertFhirData", api.insertFhirData);
router.post("/getFhirData", api.getFhirData);
module.exports = router;
