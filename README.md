# NETGEAR GS752TPP SNMP PoE controller — PG3x integration scaffold

**Status: controller implementation and profile scaffold; NOT a finished PG3x plugin.** PG3x Node.js messaging protocol has not been verified. The CLI can be tested on eisy or a workstation.

## Setup

```sh
npm install
cp config.example.json config.json
# edit config.json: switch IP, community
node src/cli.js discover
node src/cli.js read 10
npm test
```

Never assume PoE row index matches physical port number. Compare SNMP table results with the switch web UI. After a verified mapping and with an unused noncritical port, set `allowWrite:true` and run `node src/cli.js set 10 off` followed by `node src/cli.js set 10 on`.

## SNMP manual verification

```sh
snmpwalk -v2c -c YOUR_RO_COMMUNITY SWITCH_IP 1.3.6.1.2.1.105.1.1.1.3
snmpwalk -v2c -c YOUR_RO_COMMUNITY SWITCH_IP 1.3.6.1.2.1.105.1.1.1.6
snmpget -v2c -c YOUR_RO_COMMUNITY SWITCH_IP 1.3.6.1.2.1.105.1.1.1.3.1.10
# Only after verifying exact index, RW access, and safe test port:
snmpset -v2c -c YOUR_RW_COMMUNITY SWITCH_IP 1.3.6.1.2.1.105.1.1.1.3.1.10 i 2
snmpset -v2c -c YOUR_RW_COMMUNITY SWITCH_IP 1.3.6.1.2.1.105.1.1.1.3.1.10 i 1
```

## PG3x completion tasks

- Obtain a confirmed PG3x Node.js transport/SDK or implement and validate the PG3x MQTT protocol against a known working node server.
- Implement PG3x config, addNode, command dispatch, driver updates, polling, stop and reconnection.
- Validate XML profile command naming and editors on installed IoX firmware.
- Create a Local Store entry with Node.js executable, install script and repository URL.
- Confirm profile deployment and 48 individual IoX nodes in PG3x.

## Security

SNMPv2c sends community strings without encryption. Restrict SNMP via ACLs and management VLAN; use SNMPv3 if supported by the eventual plugin. Never publish config.json or community secrets.

## Multiple switches
The CLI supports `switches` configuration with per-switch `host`, `community`, and `portMap`.
The physical-to-SNMP mapping examples in config.example.json are placeholders and must be verified separately on each switch.

```sh
node src/cli.js switches
node src/cli.js discover switch1
node src/cli.js discover switch2
node src/cli.js read switch1 10
node src/cli.js read switch2 10
node src/cli.js set switch2 10 off
```

For writes, set BOTH top-level `allowWrite` and that switch's `allowWrite` to `true`, only after verification. The CLI uses one SNMP session per invocation and closes it after use.
This update does NOT implement the PG3x messaging adapter or multi-switch IoX nodes.
