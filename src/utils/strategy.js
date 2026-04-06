
/** Calculates the metrics for the given candles. */
const calcMetrics = (candles) => {
    if (candles.length < 50) return {};

    const closes = candles.map(c => c.close);
    const volumes = candles.map(c => c.volume);
    const last = candles[candles.length - 1];

    // --- Helpers ---
    const sma = (arr, period) =>
        arr.slice(-period).reduce((a, b) => a + b, 0) / period;

    const ema = (arr, period) => {
        const k = 2 / (period + 1);
        let ema = arr[0];
        for (let i = 1; i < arr.length; i++) {
            ema = arr[i] * k + ema * (1 - k);
        }
        return ema;
    };

    const std = (arr, period) => {
        const slice = arr.slice(-period);
        const mean = sma(arr, period);
        return Math.sqrt(
            slice.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period
        );
    };

    // --- EMA ---
    const emaFast = ema(closes.slice(-20), 9);
    const emaSlow = ema(closes.slice(-50), 21);

    const prevEmaFast = ema(closes.slice(-21, -1), 9);

    // --- RSI ---
    const calcRSI = (period = 14) => {
        let gains = 0, losses = 0;

        for (let i = closes.length - period; i < closes.length; i++) {
            const diff = closes[i] - closes[i - 1];
            if (diff > 0) gains += diff;
            else losses -= diff;
        }

        const rs = gains / (losses || 1);
        return 100 - (100 / (1 + rs));
    };

    const rsi = calcRSI();

    // --- MACD ---
    const macdLine = ema(closes.slice(-26), 12) - ema(closes.slice(-26), 26);
    const signalLine = ema(closes.slice(-9), 9);

    const prevMacd =
        ema(closes.slice(-27, -1), 12) - ema(closes.slice(-27, -1), 26);

    // --- Bollinger ---
    const bollMid = sma(closes, 20);
    const bollStd = std(closes, 20);
    const bollUpper = bollMid + 2 * bollStd;
    const bollLower = bollMid - 2 * bollStd;

    // --- Volume ---
    const avgVolume = sma(volumes, 20);

    // --- Candle Range ---
    const ranges = candles.map(c => c.high - c.low);
    const avgRange = sma(ranges, 20);
    const currentRange = last.high - last.low;

    return {
        // Trend
        emaFastAboveSlow: emaFast > emaSlow,
        priceAboveEma: last.close > emaFast,
        emaSlopeUp: emaFast > prevEmaFast,

        // Momentum
        rsiOverbought: rsi > 70,
        rsiOversold: rsi < 30,

        macdBullish: macdLine > signalLine,
        macdCrossUp: macdLine > signalLine && prevMacd <= signalLine,

        // Volatility
        outBollUp: last.close > bollUpper,
        outBollDown: last.close < bollLower,
        bollSqueeze: bollStd / bollMid < 0.02,

        rangeExpansion: currentRange > avgRange * 1.5,

        // Volume
        volumeSpike: last.volume > avgVolume * 1.5,
        highVolumeUp: last.close > last.open && last.volume > avgVolume,
        highVolumeDown: last.close < last.open && last.volume > avgVolume,
    };
};


/** Calculates the structure for the given candles. */
const calcStructure = (candles) => {
    if (candles.length < 30) return {};

    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];

    // --- Swing Detection ---
    const isSwingHigh = (i) =>
        candles[i].high > candles[i - 1].high &&
        candles[i].high > candles[i + 1].high;

    const isSwingLow = (i) =>
        candles[i].low < candles[i - 1].low &&
        candles[i].low < candles[i + 1].low;

    let swingHighs = [];
    let swingLows = [];

    for (let i = 2; i < candles.length - 2; i++) {
        if (isSwingHigh(i)) swingHighs.push(candles[i].high);
        if (isSwingLow(i)) swingLows.push(candles[i].low);
    }

    const lastSwingHigh = swingHighs[swingHighs.length - 1];
    const prevSwingHigh = swingHighs[swingHighs.length - 2];

    const lastSwingLow = swingLows[swingLows.length - 1];
    const prevSwingLow = swingLows[swingLows.length - 2];

    // --- Market Structure ---
    const higherHigh =
        lastSwingHigh && prevSwingHigh && lastSwingHigh > prevSwingHigh;

    const lowerLow =
        lastSwingLow && prevSwingLow && lastSwingLow < prevSwingLow;

    // --- Support / Resistance (simple zones) ---
    const support = lastSwingLow;
    const resistance = lastSwingHigh;

    const tolerance = 0.002; // ~0.2% zone

    const nearSupport =
        support && Math.abs(last.low - support) / support < tolerance;

    const nearResistance =
        resistance && Math.abs(last.high - resistance) / resistance < tolerance;

    // --- Candle Rejection Logic ---
    const bullishRejection =
        last.close > last.open && last.low < prev.low;

    const bearishRejection =
        last.close < last.open && last.high > prev.high;

    return {
        // Structure
        higherHigh,
        lowerLow,

        // Levels
        supportBounce: nearSupport && bullishRejection,
        resistanceRejection: nearResistance && bearishRejection,
    };
};

module.exports = { calcMetrics, calcStructure };