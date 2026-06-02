const express = require("express");

const {
  getCredentials,
  saveCredentials,
} = require("../controllers/credential.controller");

const router = express.Router();

router.get("/:clientId", getCredentials);

router.put("/:clientId", saveCredentials);

module.exports = router;