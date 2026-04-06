#!/usr/bin/env node
process.removeAllListeners('warning');

const { CapitalLogin, CapitalPrices, CapitalOpen, CapitalClose, CapitalStream, toCandle, streamToCandle } = require('./utils/capital');
const { conf, delay } = require('./utils/constant');
const { makePrompt } = require('./utils/generate');
const { calcMetrics, calcStructure} = require('./utils/strategy');
const { callAnthropic } = require('./utils/generate');


// ##################################################
// #                 Global Variables               #
// ##################################################

const config = conf(process.argv.slice(2)[0])
const tokens = { apiKey: config?.apiKey }

let data = []
let open = null
let stream = null
let reauth = null
let started = false


// ##################################################
// #                    Functions                   #
// ##################################################

const getLevels = (entry, direction, tpPct, slPct) => {
    const tpF = Number(tpPct) / 100
    const slF = Number(slPct) / 100
    if (direction === "BUY") return { tp: entry * (1 + tpF), sl: entry * (1 - slF) }
    return { tp: entry * (1 - tpF), sl: entry * (1 + slF) }
}

const openPosition = async (trade) => {
    const order = await CapitalOpen(tokens, { epic: config.epic, direction: trade.signal, size: Number(config.orderSize) });
    if (!order.error && order?.dealId && trade?.signal) {
        const { tp, sl } = getLevels(order.level, trade.signal, config?.tp || trade.takeProfit, config?.sl || trade.stopLoss)
        open = { direction: trade.signal, price: order?.level, dealId: order?.dealId, tp, sl }
        if(trade?.signal === "BUY") console.green(`[OPEN-BUY] Price: ${order?.level?.toFixed(4)} | Take Profit: ${tp?.toFixed(4)} | Stop Loss: ${sl?.toFixed(4)}`)
        else console.red(`[OPEN-SELL] Price: ${order?.level?.toFixed(4)} | Take Profit: ${tp?.toFixed(4)} | Stop Loss: ${sl?.toFixed(4)}`)
    }
    else console.red(`[ERROR] ${JSON.stringify(order.error)}`)
}

const closePosition = async (price, profit) => {
    const order = await CapitalClose(tokens, open?.dealId);
    if (!order.error) {
        console.yellow(`[CLOSE-${open?.direction}] Price: ${price?.toFixed(4)} | Profit: ${profit?.toFixed(4)}`)
        open = null
    }
    else console.red(`[ERROR] ${JSON.stringify(order.error)}`)
}


// ##################################################
// #                  Stream Loop                   #
// ##################################################

const onUpdate = async (payload) => {

    // Prevent duplicate candles
    if (payload?.t === data?.[data?.length - 1]?.timestamp) return;

    // Add new candle to data
    data.push(streamToCandle(payload))
    const price = data[data.length - 1].close
    
    // Close position if open
    if(open?.dealId) {

        const isBuy = open?.direction === "BUY"
        const currentPrice = price * Number(config.orderSize)
        const openPrice = open.price * Number(config.orderSize)

        const hitTP = isBuy ? price >= open?.tp : price <= open?.tp
        const hitSL = isBuy ? price <= open?.sl : price >= open?.sl
        const profit = isBuy ? (currentPrice - openPrice) : (openPrice - currentPrice)

        if(hitTP) return await closePosition(price, profit)
        if(hitSL) return await closePosition(price, profit)
        return console.white(`[HOLD] Looking for opportunity to close position...`);
    }
  
    // Calculate metrics
    const metrics = calcMetrics(data)
    
    // Calculate structure
    const structure = calcStructure(data)

    // Make prompt
    const prompt = makePrompt(config, data, metrics, structure)

    // Call AI
    const response = await callAnthropic(config, [{ role: 'user', content: prompt }])

    // Check for trade
    if((response?.signal === "BUY" || response?.signal === "SELL") && response?.confidence !== 'LOW') {
        return await openPosition(response)
    }
    else {
        console.white(`[HOLD] Looking for opportunity to open position...`)
    }
}


// ##################################################
// #                   Initialize                   #
// ##################################################

const main = async () => {

    // Close stream
    stream?.()
    clearInterval(reauth)

    // Reset tokens
    tokens.cst = ""
    tokens.securityToken = ""

    // Authentication
    const login = await CapitalLogin(tokens, config)
    if (login.error || !login.cst || !login.securityToken) {
        console.red(`[LOGIN ERROR] -> ${JSON.stringify(login.error)}`)
        return
    }

    // Set tokens
    tokens.cst = login?.cst
    tokens.securityToken = login?.securityToken
    tokens.apiKey = config?.apiKey

    // Get market prices
    const { prices, error } = await CapitalPrices(tokens, config)
    if (!prices || prices.length === 0 || error) {
        console.red(`[PRICES ERROR] -> ${error?.errorCode ? JSON.stringify(error) : "No prices data. Check your API connection or configuration."}`)
        return
    }

    // Map prices to candles
    if (!data?.length) data = prices?.map(toCandle)?.slice(0, -1)

    // Start stream
    stream = await CapitalStream(tokens, config, onUpdate, console.error)

    if (!started) {
        console.log("")
        console.log(`Size: ${Number(config?.orderSize)}`)
        console.log(`Epic: ${config?.epic}`)
        console.log(`Time: ${new Date().toLocaleTimeString()}`)
        console.log(`Currency: ${login?.account?.currencyIsoCode}`)
        console.log(`Timeframe: ${config?.timeframe}`)
        console.log(`Environment: ${config?.environment}`)
        console.log(`Total Balance: ${login?.account?.currencySymbol} ${(login?.account?.accountInfo?.balance ?? 0).toFixed(2)}`)
        console.log(`Available Balance: ${login?.account?.currencySymbol} ${(login?.account?.accountInfo?.available ?? 0).toFixed(2)}`)
        console.log("")
        started = true
    }

    // Reauthenticate in 8 minutes
    reauth = setInterval(async () => { await delay(3000); main() }, 8 * 60 * 1000)
}
main()

process.on('SIGINT', async () => { stream?.(); process.exit(0); });
process.on('SIGTERM', async () => { stream?.(); process.exit(0); });