const express = require("express");

const {
  getClients,
  createClient
} = require("../controllers/client.controller");
const {
  authenticate
} = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authenticate, getClients);

router.post("/", authenticate, createClient);

module.exports = router;
