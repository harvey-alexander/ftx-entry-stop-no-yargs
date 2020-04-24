const FTXWs = require('ftx-api-ws');
const FTXRest = require('ftx-api-rest');
require('dotenv').config()

const ftxRestApi = new FTXRest({
  key: process.env.API_KEY,
  secret: process.env.API_SECRET
})

// private and public chanells
const ftx = new FTXWs({
  key: process.env.API_KEY,
  secret: process.env.API_SECRET
});


//Order Inputs
const pair = "BTC-PERP";

//entry params
const entrySide = "buy";
const entryPrice = 7102;
const entryTriggerPrice = 7101;
const entryType = "stop";
// stop params
const stopSide = "sell";
const stopPrice = 7000;
const stopType = "stop";
const cancelPrice = stopPrice * 0.99;
const positionSize = 0.01;
// target params
const targetSide = 'sell';
const targetSize = positionSize / 2

let isShort = entryPrice < stopPrice;

////////////////////////////////////
// FUNCTIONALITY:
// [x]connects
// [x]submits entry order
// [x] subscribes to ticker
// [x] If ticker breaches stop before entry, cancels order and exit script
// [x] calculates target
// [x] Submits target and stop
// [] Long and short func

////////////////////////////////////

//other variables
let subscribe;
let ticker;
let alreadyOrdered = false;

// conditional stop limit order paramaters
const slo = {
  method: 'POST',
  path: '/conditional_orders',
  data: {
    market: pair,
    side: entrySide,
    triggerPrice: entryTriggerPrice,
    orderPrice: entryPrice,
    size: positionSize,
    type: entryType,
    reduceOnly: false,
  }
}
// limit order for testing
const lmo = {
  method: 'POST',
  path: '/orders',
  data: {
    market: pair,
    side: entrySide,
    price: entryPrice,
    size: positionSize,
    type: 'limit',
    reduceOnly: false,
    ioc: false,
    postOnly: false,
    clientId: Date.now(),
  }
}

async function go() {
  await ftx.connect()
    .catch(err => console.log(err))
  await ftxRestApi.request(lmo)
    .then((order) => {
      console.log(order)
    })
    .catch(err => console.log('Error posting entry: ' + err))
  await ftx.subscribe('ticker', 'BTC-PERP');
  ftx.on(`${pair}::ticker`, function (res) {

    ticker = res
    console.log(ticker.last)
    // if stop breached
    if (
      //Short stop breach
      (isShort && ticker.last > stopPrice) ||
      //Long stop breach
      (!isShort && ticker.last < stopPrice)
    ) {
      //get last order and cancel
      ftxRestApi.request({
        method: 'GET',
        path: `/orders/history`,
        data: {
          market: pair,
          limit: 1
        }
      }).catch(err => console.log('Error getting order for cancel' + err))
        //cancel order
        .then(order => {
          ftxRestApi.request({
            method: 'DELETE',
            path: `/conditional_orders/${order.id}`
          })
        })
    }
    // if price goes through entry
    if (
      //if long
      (entryPrice > stopPrice && ticker.bid <= stopPrice)
      //if short
      || (entryPrice < stopPrice && ticker.ask >= stopPrice)
    ) {
      ftxRestApi.request({
        method: 'GET',
        path: `/orders/history`,
        data: {
          market: pair,
          limit: 1
        }
      })
        //place stop and target
        .then(async (res) => {
          console.log('placing orders and terminating')
          otherorders(res)
          alreadyOrdered = true

        })
        .catch(err => console.log('Eror getting order' + err))
    }


  })

  const otherorders = (res) => {
    if (alreadyOrdered) {
      ftx.terminate()
      process.exit()
    }
    console.log(res.result[0].status)
    let status = res.result[0].status;
    console.log(status)
    //calculate stuff
    let avgFillPrice = res.result[0].avgFillPrice
    console.log(avgFillPrice)
    let targetPrice = (avgFillPrice + (avgFillPrice - stopPrice))
    console.log(targetPrice)
    //if avgFillPrice is there, means order has been filled
    if (res.result[0].avgFillPrice != null) {
      //place stoploss order
      //console.log('posting stoploss')
      ftxRestApi.request({
        method: 'POST',
        path: '/conditional_orders',
        data: {
          market: pair,
          side: stopSide,
          triggerPrice: cancelPrice,
          orderPrice: stopPrice,
          size: positionSize,
          type: stopType,
          reduceOnly: false,
        }
      }).then(async (res) => {
        console.log('Stop loss place at price ' + JSON.stringify(res))
        ftx.terminate()
      }).catch(err => console.log('Error placing Stop ' + err))
      //place 1:1 target order
      ftxRestApi.request({
        method: 'POST',
        path: '/conditional_orders',
        data: {
          market: pair,
          side: targetSide,
          orderPrice: 7101,
          size: targetSize,
          triggerPrice: 7100,
          type: 'takeProfit',
          reduceOnly: false,
        }
      }).then((res) => {
        console.log('target Placed at ' + res)
        console.log('terminating after target')
        ftx.terminate()
        process.exit()
      }).catch(err => {
        console.log('target order error ' + err.toString())
        console.log('terminating on error')
        ftx.terminate()
        process.exit()
      })
    }
  }
}
go()