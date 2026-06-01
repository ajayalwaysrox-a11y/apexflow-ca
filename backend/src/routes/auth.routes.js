const express = require("express");

const router = express.Router();

router.post("/login", (req, res) => {
  return res.json({
    success: true,
    message: "Login endpoint created"
  });
});

module.exports = router;
