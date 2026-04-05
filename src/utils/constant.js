const { join, dirname } = require('path');
const { existsSync, readFileSync } = require('fs');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const cpath = (p) => process.env?.PROMPT ? join(__dirname, "..", "..", p) : join(dirname(process.argv[0]), p);

const cfg = cpath("config.json");
const required = ["username", "password", "apiKey", "epic", "timeframe", "orderSize", "environment", "tp", "sl"]

global.console.red = (txt) => console.log(`\x1b[31m${new Date().toLocaleTimeString()}`, txt, '\x1b[0m')
global.console.white = (txt) => console.log(`\x1b[0m${new Date().toLocaleTimeString()}`, txt, '\x1b[0m')
global.console.green = (txt) => console.log(`\x1b[32m${new Date().toLocaleTimeString()}`, txt, '\x1b[0m')
global.console.yellow = (txt) => console.log(`\x1b[33m${new Date().toLocaleTimeString()}`, txt, '\x1b[0m')

const missing  = (keys) => {
    console.log("")
    console.log("\x1b[31mMISSING REQUIRED PROPERTIES\x1b[0m\n")
    console.log(`Edit Config: ${cfg}`)
    console.log("")
    for(const key of keys) console.log(`\x1b[33m${key}\x1b[0m is required but not set.`)
    console.log("")
    process.exit(0);
}

const conf = () => {
    if (!existsSync(cfg)) {
        console.error("Missing config.json file. Create one in the root directory with your Capital API credentials and trading preferences.")
        process.exit(1)
    }
    const res = JSON.parse(readFileSync(cfg, 'utf-8'));
    if(!required?.every(k => res?.[k])) {
        missing(required?.filter(k => !res?.[k]));
    }
    return res;
}

module.exports = { delay, conf }
