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
module.exports = router;
