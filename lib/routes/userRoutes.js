const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const testController = require("../controllers/testController");
router.get("/", userController.viewAccount);
router.get("/getMaps", userController.getMapping);

router.post("/postMap", userController.postMapping);

router.post("/uploadEncounter", testController.uploadEncounter);
router.post("/generateKey", testController.generateApiKey);
router.post("/requestApproval", testController.requestApproval);
router.post("/getRequests", testController.getPatientRequests);
router.post("/updateRequestStatus", testController.updateRequest);

router.post("/newUser", testController.newUser);
router.post("/login", testController.logIn);
router.post("/getKeys", testController.getApiKeysForUser);

router.post("/newMapping", testController.newMapping);

router.post("/mapTable", testController.mapTable);
router.post("/mapColumn", testController.mapColumn);

router.post("/mapForClient", testController.mapForClient);
module.exports = router;
