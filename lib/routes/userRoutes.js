const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

router.get("/", userController.viewAccount);
router.get("/getMaps", userController.getMapping)

router.post("/postMap", userController.postMapping)

module.exports = router;
