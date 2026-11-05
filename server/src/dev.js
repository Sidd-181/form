"use strict";

require("dotenv/config");

const app = require("./app");
const { connectToDatabase } = require("./database");

async function startServer() {
    const configurationError = app.getConfigurationError();
    if (configurationError)
        throw new Error(configurationError);

    await connectToDatabase();
    const port = Number(process.env.PORT ?? 4000);
    if (!Number.isInteger(port) || port < 1 || port > 65535)
        throw new Error("PORT must be a valid port number");

    return app.listen(port, () => console.log(`API listening on :${port}`));
}

if (require.main === module) {
    startServer().catch(error => {
        console.error("Unable to start API server:", error.message);
        process.exitCode = 1;
    });
}

module.exports = { startServer };
