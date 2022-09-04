const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");
const { dbQuery, client } = require("../db");

chai.use(chaiHttp);

suite("Functional Tests", function () {
  const BASE_URL = "/api/stock-prices";

  async function clearDb() {
    return dbQuery(async (db) => {
      const stocksCollection = db.collection("stocks");

      await stocksCollection.deleteMany({});
    });
  }

  describe("GET /api/stock-prices", function () {
    this.timeout(10000);

    before(async function () {
      await clearDb();
    });

    after(async function () {
      await client.close();
    });

    describe("Viewing one stock: GET request to /api/stock-prices/?stock=GOOG", function () {
      it("should return the data for the specified stock symbol", async () => {
        const stockSymbol = "GOOG";
        const url = BASE_URL + "?stock=" + stockSymbol;

        const res = await chai.request(server).get(url);

        assert.isObject(res.body.stockData);
        assert.equal(res.body.stockData.stock, stockSymbol);
        assert.equal(res.body.stockData.likes, 0);
      });
    });

    describe("Viewing one stock and liking it: GET request to /api/stock-prices/?stock=GOOG&like=true", function () {
      it("should return the data for the specified stock symbol with likes incremented", async () => {
        const stockSymbol = "GOOG";
        const url = BASE_URL + "?stock=" + stockSymbol + "&like=true";

        const res = await chai.request(server).get(url);

        assert.isObject(res.body.stockData);
        assert.equal(res.body.stockData.stock, stockSymbol);
        assert.equal(res.body.stockData.likes, 1);
      });
    });

    describe("Viewing the same stock and liking it again: GET request to /api/stock-prices/?stock=GOOG&like=true", function () {
      it("should return the data for the specified stock symbol with likes NOT changed", async () => {
        const stockSymbol = "GOOG";
        const url = BASE_URL + "?stock=" + stockSymbol + "&like=true";

        const res = await chai.request(server).get(url);

        assert.isObject(res.body.stockData);
        assert.equal(res.body.stockData.stock, stockSymbol);
        assert.equal(res.body.stockData.likes, 1);
      });
    });

    describe("Viewing two stocks : GET request to /api/stock-prices/?stock=GOOG&stock=MSFT", function () {
      it("should return the data for both the stock symbols", async () => {
        const stockSymbol = "GOOG";
        const stockSymbol2 = "MSFT";
        const url =
          BASE_URL + "?stock=" + stockSymbol + "&stock=" + stockSymbol2;

        const res = await chai.request(server).get(url);

        assert.isArray(res.body.stockData);
        assert.equal(res.body.stockData[0].stock, stockSymbol);
        assert.equal(res.body.stockData[0].rel_likes, 1);
        assert.equal(res.body.stockData[1].stock, stockSymbol2);
        assert.equal(res.body.stockData[1].rel_likes, -1);
      });
    });

    describe("Viewing two stocks and liking them: GET request to /api/stock-prices/?stock=GOOG&stock=MSFT&like=true", function () {
      it("should return the data for both the stock symbols with rel_likes updated", async () => {
        const stockSymbol = "GOOG";
        const stockSymbol2 = "MSFT";
        const url =
          BASE_URL +
          "?stock=" +
          stockSymbol +
          "&stock=" +
          stockSymbol2 +
          "&like=true";

        const res = await chai.request(server).get(url);

        assert.isArray(res.body.stockData);
        assert.equal(res.body.stockData[0].stock, stockSymbol);
        assert.equal(res.body.stockData[0].rel_likes, 0);
        assert.equal(res.body.stockData[1].stock, stockSymbol2);
        assert.equal(res.body.stockData[1].rel_likes, 0);
      });
    });
  });
});
