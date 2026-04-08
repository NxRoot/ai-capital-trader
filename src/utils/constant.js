const { resolve, join } = require('path');
const { existsSync, readFileSync } = require('fs');


// Utility function to create a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


// List of required configuration properties
const required = ["username", "password", "apiKey", "epic", "timeframe", "orderSize", "environment"]


// Custom console log functions with timestamps and colors
global.console.red = (txt) => console.log(`\x1b[31m${new Date().toLocaleTimeString()}`, txt, '\x1b[0m')
global.console.white = (txt) => console.log(`\x1b[0m${new Date().toLocaleTimeString()}`, txt, '\x1b[0m')
global.console.yellow = (txt) => console.log(`\x1b[33m${new Date().toLocaleTimeString()}`, txt, '\x1b[0m')
global.console.cyan = (txt) => console.log(`\x1b[36m${new Date().toLocaleTimeString()}`, txt, '\x1b[0m')


// Function to display missing required properties and exit the process
const missing = (keys, cfg) => {
    console.log("")
    console.log("\x1b[31mMISSING REQUIRED PROPERTIES\x1b[0m\n")
    console.log(`Edit Config: ${cfg}`)
    console.log("")
    for (const key of keys) console.log(`\x1b[33m${key}\x1b[0m is required but not set.`)
    console.log("")
    process.exit(0);
}


// Function to load and validate configuration from a JSON file
const conf = (cfg) => {
    cfg = cfg ? resolve(cfg) : null
    if (!existsSync(cfg)) {
        console.log("")
        console.log("\x1b[31mMISSING CONFIG FILE\x1b[0m\n")
        console.log(`cpt /path/to/config.json`)
        console.log("")
        process.exit(1)
    }
    const res = JSON.parse(readFileSync(cfg, 'utf-8'));
    if (!required?.every(k => res?.[k])) {
        missing(required?.filter(k => !res?.[k]), cfg);
    }
    return res;
}


module.exports = { delay, conf }
