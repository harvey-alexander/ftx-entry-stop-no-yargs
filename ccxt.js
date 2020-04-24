#!usr/bin/env node
const CCXT = require('ccxt');
require('dotenv').config()

const ftx = new CCXT.ftx({
  apiKey: process.env.API_KEY,
  secret: process.env.API_SECRET,

})


//take in from CLI and get account information


const { argv } = require("yargs")
  .usage("Usage: binance-oco")
  .example(
    "binance-oco -p BNBBTC -a 1 -b 0.002 -s 0.001 -t 0.003",
    "Place a buy order for 1 BNB @ 0.002 BTC. Once filled, place a stop-limit sell @ 0.001 BTC. If a price of 0.003 BTC is reached, cancel stop-limit order and place a limit sell @ 0.003 BTC."
  )
  // '-p <tradingPair>'
  .demand("pair")
  .alias("p", "pair")
  .describe("p", "Set trading pair eg. BNBBTC")
  // '-a <amount>'
  .demand("amount")
  .number("a")
  .alias("a", "amount")
  .describe("a", "Set amount to buy/sell")
  // 'e <entryPrice>
  .demand('e')
  .number('e')
  .alias('e', 'entry-price')
  .describe('e', 'Set Entry Price')
  // '-s <stopPrice>'
  .number("s")
  .alias("s", "stop-price")
  .describe("s", "Set stop-limit order stop price")
  .default("F", false);

const {
  p: pair,
  a: amount,
  e: entryPrice,
  s: stopPrice,
} = argv;
console.log(argv)
let isShort = entryPrice < stopPrice;

let entryside,
    entryType,
    entryTriggerPrice,
    ccxtOverride,
    stopSide,
    stopType,
    cancelPrice

if(isShort){
  // Short entry Paramaters
  entrySide = "sell";
  entryType = 'limit';
  entryTriggerPrice = (entryPrice + 0.01)
  // ccxt short override
  ccxtOverride = {
    'orderPrice': entryTriggerPrice
    }
  // Short exit paramaters
  stopSide = 'buy'
  stopType = 'market'
  cancelPrice = (stopPrice - 0.01)
  
} else if(!isShort) {
  // Long entry Paramaters
  entrySide = 'buy'
  entryType = 'stop' //stop limit, so use a conditional order with a trigger price
  entryTriggerPrice = (entryPrice - 0.01)
  // ccxt short override
  ccxtOverride = {
    'orderPrice': entryTriggerPrice
  }
  //Long stop paramaters
  stopSide = 'sell'
  stopType = 'market'
  cancelPrice = (stopPrice + 0.01)
}

console.log(isShort)
//createOrder (symbol, type, side, amount[, price[, params]])

const order = ftx.createOrder (pair, entryType, entrySide, amount, entryPrice, ccxtOverride)
.then(res=>console.log(res))
.catch(err=>console.log(err))
