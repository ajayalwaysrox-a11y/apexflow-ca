require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const clientRoutes = require("./routes/client.routes");
const credentialRoutes = require("./routes/credential.routes");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/credentials", credentialRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);

app.get("/", (req, res) => {
  res.json({
    application: "ApexFlow",
    version: "1.0.0",
    status: "Running"
  });
});

module.exports = app;