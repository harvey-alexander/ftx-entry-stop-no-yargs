const CCXT = require('ccxt');
const FTXWS = require('ftx-api-ws')
require('dotenv').config()

const ftxccxt = new CCXT.ftx({
  apiKey: process.env.API_KEY,
  secret: process.env.API_SECRET,

})

const ftxWs = new FTXWS({
  apiKey: process.env.API_KEY,
  secret: process.env.API_SECRET,
})

async function o() {
  console.log('doin a get'
  )
  await ftxccxt.fetchOrders('BTC-PERP', since = undefined, 1)
    .then(res => console.log(res[0].id))
}

o()