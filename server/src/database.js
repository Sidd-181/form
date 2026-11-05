"use strict";

const mongoose = require("mongoose");

const cache = globalThis.__formforgeMongoConnection ??= { promise: null };

function connectToDatabase() {
    const uri = process.env.MONGODB_URI;
    if (!uri?.trim())
        return Promise.reject(new Error("MONGODB_URI is required"));
    if (mongoose.connection.readyState === 1)
        return Promise.resolve(mongoose);
    if (!cache.promise) {
        cache.promise = mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
            .then(connection => {
                cache.promise = null;
                return connection;
            })
            .catch(error => {
                cache.promise = null;
                throw error;
            });
    }
    return cache.promise;
}

module.exports = { connectToDatabase };
