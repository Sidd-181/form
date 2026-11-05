"use strict";

require("dotenv/config");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const auth = require("./routes/auth").default;
const forms = require("./routes/forms").default;
const publicRoutes = require("./routes/public").default;
const settings = require("./routes/settings").default;
const { errorHandler } = require("./middleware");
const { connectToDatabase } = require("./database");

const app = express();
const { CLIENT_ORIGIN = "http://localhost:5173" } = process.env;

function getConfigurationError() {
    if (!process.env.MONGODB_URI?.trim())
        return "MONGODB_URI is required";
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length < 32)
        return "JWT_SECRET must be at least 32 characters";
    return null;
}

app.use(helmet(), cors({ origin: CLIENT_ORIGIN.split(",") }), express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
});

app.use("/api/auth", rateLimit({ windowMs: 15 * 60_000, limit: 30 }));
app.use("/api/settings", rateLimit({ windowMs: 15 * 60_000, limit: 60 }));
app.use("/api/public", rateLimit({ windowMs: 60_000, limit: 60 }));

app.use("/api", async (_req, res, next) => {
    const configurationError = getConfigurationError();
    if (configurationError) {
        console.error(`Invalid server configuration: ${configurationError}`);
        res.status(500).json({
            error: "Server configuration error",
            details: configurationError
        });
        return;
    }

    try {
        await connectToDatabase();
        next();
    }
    catch (error) {
        console.error("MongoDB connection failed:", error.message);
        res.status(503).json({ error: "Database unavailable" });
    }
});

app.use("/api/auth", auth);
app.use("/api/forms", forms);
app.use("/api/settings", settings);
app.use("/api/public", publicRoutes);
app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
});
app.use(errorHandler);

module.exports = app;
module.exports.getConfigurationError = getConfigurationError;
