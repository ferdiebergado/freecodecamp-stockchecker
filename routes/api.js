"use strict";
const { MongoClient } = require("mongodb");
const fetch = require("node-fetch");
const crypto = require("crypto");

const api = "https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/";
const url = process.env["DB"];
const dbName = "stockchecker";

const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

function md5sum(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}

function getIp(request) {
  return request.headers["x-forwarded-for"] || request.socket.remoteAddress;
}

module.exports = function (app) {
  app.route("/api/stock-prices").get(async function (req, res, next) {
    try {
      const { stock, like } = req.query;

      const uri = api + stock + "/quote";

      const response = await fetch(uri);
      const data = await response.json();

      await client.connect();

      const db = client.db(dbName);
      const stocksCollection = db.collection("stocks");
      const ipsCollection = db.collection("ips");

      let findResult = await stocksCollection.findOne({ stock });

      let likes = 0;

      if (!findResult) {
        await stocksCollection.insertOne({ stock, likes });
        findResult = await stocksCollection.findOne({ stock });
      }

      if (like) {
        const ip = md5sum(getIp(req));

        const ipExists = await ipsCollection.findOne({ ip });

        if (!ipExists) {
          likes = findResult.likes + 1;

          await stocksCollection.updateOne(
            {
              stock,
            },
            { $set: { likes } }
          );

          await ipsCollection.insertOne({ ip });
        } else {
          likes = findResult.likes;
        }
      } else {
        likes = findResult.likes;
      }

      const stockData = {
        stock,
        price: data.latestPrice,
        likes,
      };

      res.json({ stockData });
    } catch (error) {
      next(error);
    } finally {
      client.close();
    }
  });
};
