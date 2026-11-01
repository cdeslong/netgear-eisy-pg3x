# NETGEAR PoE configuration

This package currently provides a standalone Node.js SNMP controller and preliminary IoX profile files. **It is not yet a deployable PG3x node server:** a verified PG3x Node.js message adapter is required. Do not register `src/cli.js` as a PG3x executable.

1. Copy `config.example.json` to `config.json` (never commit the latter).
2. Set host and community, leave allowWrite false.
3. Run `node src/cli.js discover`; identify PoE table group/index mapping from switch web UI and controlled port tests.
4. Populate portMap, e.g. `"10":{"group":1,"index":10}` only after verifying.
5. Run `node src/cli.js read 10`.
6. When SNMP SET permission and mapping are confirmed, set allowWrite true and use `node src/cli.js set 10 off` on a noncritical test port.

Use a management VLAN and restrict SNMP access to eisy. SNMPv2c communities are not encrypted. SNMPv3 support would require extending this example's session configuration.
