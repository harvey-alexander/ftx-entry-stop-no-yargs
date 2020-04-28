const CCXT = require('ccxt');
const FTXWS = require('ftx-api-ws')
require('dotenv').config()

const ftxccxt = new CCXT.ftx({
  apiKey: process.env.API_KEY,
  secret: process.env.API_SECRET,

})

let entryOrderTimestamp = Date.now() - 100000
console.log(entryOrderTimestamp)



ftxccxt.fetchOrders('BSV-PERP', since = undefined, 1)
  .then(res => {
    let ot = res[0].timestamp
    console.log(ot)
    ftxccxt.fetchOHLCV('BTC-PERP', timeframe = '1m', since = ot, limit = 1000, params = {})
      .then(res => console.log(res))
  }
  )

