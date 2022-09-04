"use strict";

const { MongoClient } = require("mongodb");

const url = process.env["DB"];
const dbName = "proxychecker";

const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const dbQuery = async (cb) => {
  await client.connect();

  const db = client.db(dbName);

  return await cb(db);
};

module.exports = { client, dbQuery };
