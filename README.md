# AI Capital Trader

An automated trading bot for [Capital.com](https://capital.com) with AI decision making via Claude or ChatGPT

<img width="100%" height="100%" alt="cpt" src="https://github.com/user-attachments/assets/c9e303f8-2e45-44c5-8af9-9087edd6d952" />


## Features

- **Capital Live Trading** — Connects to Capital.com via REST API and WebSocket for real-time order execution
- **AI Decision Making** - Analizes market with AI and decides possible entries based on multiple indicators
- **Demo & Live Support** — Switch between demo and live environments by editing configuration file
- **Extremely Flexible** — Runs on any device including Raspberry Pi, VPS, or low-power servers

## Requirements

- [Node.js](https://nodejs.org/en) 18+
- [Capital.com](https://capital.com) account with API key
- [Anthropic API key](https://console.anthropic.com) (for AI decision making)

## Installation

```perl
npm i -g ai-capital-trader
```

## Configuration

Create `config.json`

```json
{
  "username": "your-capital-username",
  "password": "your-capital-password",
  "apiKey": "your-capital-api-key",
  "anthropicKey": "sk-ant-...",
  "environment": "demo",
  "epic": "BTCUSD",
  "orderSize": "0.025",
  "timeframe": "MINUTE_15",
  "confidence": "MEDIUM",
  "tokens": "15000",
  "tp": "",
  "sl": ""
}
```

See More: [Capital.com API Documentation](https://open-api.capital.com/)
| Key | Description | Example |
|-----|-------------|---------|
| `username` | Capital.com login email | `user@example.com` |
| `password` | Capital.com password | |
| `apiKey` | Capital.com API key | |
| `anthropicKey` | Anthropic Claude API key | `sk-ant-...` |
| `environment` | `"demo"` or `"live"` | `"demo"` |
| `epic` | Market identifier | `"BTCUSD"`, `"EURUSD"` |
| `orderSize` | Position size per trade | `"0.025"` |
| `timeframe` | Candle interval | `"MINUTE_15"`, `"MINUTE"` |
| `temperature` | AI exploration rate | `"0.0"` |
| `confidence` | Min AI confidence to trade | `"LOW"`, `"MEDIUM"`, `"HIGH"` |
| `tokens` | Max AI tokens to use | `"15000"` |
| `tp` | Take Profit % (Empty to autogenerate) | `"0.075"` |
| `sl` | Stop Loss % (Empty to autogenerate) | `"0.075"` |


## Usage

Start bot with config file
```py
cpt "/path/to/config.json"
```

## Project Structure

```
src/
├── index.js            # Live trading bot
└── utils/
    ├── capital.js      # Capital.com API client (REST + WebSocket)
    ├── constant.js     # Config loader and utilities
    ├── generate.js     # Claude/OpenAI API calls
    └── strategy.js     # Strategy calculations
```

## &nbsp;
⭐ &nbsp;If you find this useful!
