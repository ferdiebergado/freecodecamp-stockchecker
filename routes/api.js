"use strict";

const fetch = require("node-fetch");
const crypto = require("crypto");
const { dbQuery } = require("../db");

const api = "https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/";

function md5sum(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}

function getIp(request) {
  return request.headers["x-forwarded-for"] || request.socket.remoteAddress;
}

async function fetchStockData(stock, like, ip) {
  const uri = api + stock + "/quote";

  const response = await fetch(uri);
  const { latestPrice } = await response.json();

  return dbQuery(async (db) => {
    const stocksCollection = db.collection("stocks");

    let findResult = await stocksCollection.findOne({ stock });

    if (!findResult) {
      await stocksCollection.insertOne({ stock, like_ips: [] });
    }

    if (like) {
      await stocksCollection.updateOne(
        {
          stock,
        },
        { $addToSet: { like_ips: ip } }
      );
    }

    findResult = await stocksCollection.findOne({ stock });

    const likes = findResult.like_ips.length;

    const stockData = {
      stock,
      price: latestPrice,
      likes,
    };

    return stockData;
  });
}

module.exports = function (app) {
  app.route("/api/stock-prices").get(async function (req, res, next) {
    try {
      const { stock, like } = req.query;
      const ip = md5sum(getIp(req));

      let stockData;

      if (Array.isArray(stock)) {
        const stocks = await Promise.all(
          stock.map(async (s) => await fetchStockData(s, like, ip))
        );

        stockData = [
          {
            stock: stocks[0].stock,
            price: stocks[0].price,
            rel_likes: stocks[0].likes - stocks[1].likes,
          },
          {
            stock: stocks[1].stock,
            price: stocks[1].price,
            rel_likes: stocks[1].likes - stocks[0].likes,
          },
        ];
      } else {
        stockData = await fetchStockData(stock, like, ip);
      }

      res.json({ stockData });
    } catch (error) {
      next(error);
    }
  });
};
