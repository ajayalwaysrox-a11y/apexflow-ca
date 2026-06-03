const express = require("express");

const {
  getCredentials,
  saveCredentials,
} = require("../controllers/credential.controller");
const {
  authenticate
} = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/:clientId", authenticate, getCredentials);

router.put("/:clientId", authenticate, saveCredentials);

module.exports = router;