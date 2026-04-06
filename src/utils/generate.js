
/** Parse JSON block. */
const parseJson = (text) => {
    const cleaned = text?.match(/```(?:json)?\s*\n?([\s\S]*?)```/i)?.[1]?.trim() ?? text ?? "";
    try { return JSON.parse(cleaned) } catch (err) { return "FAILED TO PARSE RESPONSE" }
}


/** Calls Anthropic Claude with the current prompt. */
async function callAnthropic(config, messages, model = 'claude-opus-4-6') {
	const res = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: { 'x-api-key': config?.anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
		body: JSON.stringify({ model, max_tokens: Number(config?.tokens) || 10000, messages }),
	});
	if (!res.ok) throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
	const data = await res.json();
	return parseJson(data?.content?.find((b) => b.type === 'text')?.text);
}


/** Calls OpenAI ChatGPT with the current prompt. */
async function callOpenAI(config, messages, model = 'gpt-4o') {
	const res = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: { 'Authorization': `Bearer ${config?.apiKey}`, 'content-type': 'application/json' },
		body: JSON.stringify({ model, max_tokens: Number(config?.tokens) || 10000, messages }),
	});
	if (!res.ok) throw new Error(`OpenAI API error ${res.status}: ${await res.text()}`);
	const data = await res.json();
	return parseJson(data?.choices?.[0]?.message?.content);
}


/** Makes a prompt for the AI assistant. */
const makePrompt = (cfg, candles, metrics, structure) => `You are an expert trader. Your goal is to find PROFITABLE trades.
            
# CONFIG
EPIC: ${cfg.epic}
ORDER SIZE: ${Number(cfg.orderSize)}
TIMEFRAME: ${cfg.timeframe}


# CANDLES
CLOSE: ${candles?.[candles.length - 1].close}
OPEN: ${candles?.[candles.length - 1].open}
HIGH: ${candles?.[candles.length - 1].high}
LOW: ${candles?.[candles.length - 1].low}
VOLUME: ${candles?.[candles.length - 1].volume}
COLOR: ${candles?.[candles.length - 1].close > candles?.[candles.length - 1].open ? "GREEN" : "RED"}
DIFFERENCE: ${((candles?.[candles.length - 1].close - candles?.[candles.length - 1].open) / candles?.[candles.length - 1].open) * 100}%

PREV_CLOSE: ${candles?.[candles.length - 2].close}
PREV_OPEN: ${candles?.[candles.length - 2].open}
PREV_HIGH: ${candles?.[candles.length - 2].high}
PREV_LOW: ${candles?.[candles.length - 2].low}
PREV_VOLUME: ${candles?.[candles.length - 2].volume}
PREV_COLOR: ${candles?.[candles.length - 2].close > candles?.[candles.length - 2].open ? "GREEN" : "RED"}
PREV_DIFFERENCE: ${(candles?.[candles.length - 2].close - candles?.[candles.length - 2].open) / candles?.[candles.length - 2].open * 100}%


# INDICATORS
EMA_FAST_ABOVE_SLOW: ${metrics.emaFastAboveSlow}
PRICE_ABOVE_EMA: ${metrics.priceAboveEma}
EMA_SLOPE_UP: ${metrics.emaSlopeUp}

RSI_OVERBOUGHT: ${metrics.rsiOverbought}
RSI_OVERSOLD: ${metrics.rsiOversold}

MACD_BULLISH: ${metrics.macdBullish}
MACD_CROSS_UP: ${metrics.macdCrossUp}

OUT_BOLL_UP: ${metrics.outBollUp}
OUT_BOLL_DOWN: ${metrics.outBollDown}
BOLL_SQUEEZE: ${metrics.bollSqueeze}

VOLUME_SPIKE: ${metrics.volumeSpike}
HIGH_VOLUME_UP: ${metrics.highVolumeUp}
HIGH_VOLUME_DOWN: ${metrics.highVolumeDown}


# MARKET_STRUCTURE
HIGHER_HIGH: ${structure.higherHigh}
LOWER_LOW: ${structure.lowerLow}


# KEY_LEVELS
SUPPORT_BOUNCE: ${structure.supportBounce}
RESISTANCE_REJECTION: ${structure.resistanceRejection}


Respond ONLY with RAW JSON format:
{ "signal": "BUY" | "SELL" | "HOLD", "confidence": "LOW" | "MEDIUM" | "HIGH", "takeProfit": "percentage, e.g. 0.075", "stopLoss": "percentage, e.g. 0.075" }
`

module.exports = { callAnthropic, callOpenAI, makePrompt };