"use strict";

const { MongoClient } = require("mongodb");

const url = process.env["DB"];

const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const dbQuery = async (cb) => {
  await client.connect();

  const db = client.db();

  return await cb(db);
};

module.exports = { client, dbQuery };
