#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const { PoeSnmp } = require('./snmp');

function selectSwitch(cfg, args) {
  if (!cfg.switches) return { settings: cfg, args, name: 'default', allowWrite: cfg.allowWrite === true };
  const [id, ...rest] = args;
  if (!id || !Object.hasOwn(cfg.switches, id)) {
    throw new Error(`Specify a switch ID. Available: ${Object.keys(cfg.switches).join(', ')}`);
  }
  return { settings: { ...cfg, ...cfg.switches[id] }, args: rest, name: id,
    allowWrite: cfg.allowWrite === true && cfg.switches[id].allowWrite === true };
}
async function main() {
  const [command, ...rawArgs] = process.argv.slice(2);
  const cfg = JSON.parse(fs.readFileSync(process.env.POE_CONFIG || 'config.json', 'utf8'));
  if (command === 'switches') {
    console.log(JSON.stringify(Object.entries(cfg.switches || {default: cfg}).map(([id, s]) => ({id, name: s.name || id, host: s.host})), null, 2));
    return;
  }
  const { settings, args, name, allowWrite } = selectSwitch(cfg, rawArgs);
  const [portArg, stateArg] = args;
  const client = new PoeSnmp(settings);
  try {
    let result;
    if (command === 'discover') result = await client.discover();
    else if (command === 'read') result = await client.read(Number(portArg));
    else if (command === 'set') {
      if (!['on', 'off'].includes(stateArg)) throw new Error('State must be on or off');
      result = await client.set(Number(portArg), stateArg === 'on', {allowWrite});
    } else throw new Error('Usage: switches | discover SWITCH | read SWITCH PORT | set SWITCH PORT on|off');
    console.log(JSON.stringify({switch: name, result}, null, 2));
  } finally { client.close(); }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
