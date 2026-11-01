# PG3x Python + Node.js SNMP bridge (development build)

This is a development implementation, **not hardware-tested**. Existing SNMP port mapping must be verified independently on each switch. Switch IDs must be <=8 lowercase alphanumeric characters beginning with a letter (example: switch1). IoX node addresses are `switch1p01`, `switch1p02`, etc. Python calls the existing Node.js CLI using a subprocess, no credentials in CLI arguments. Configuration stays in local `config.json` (not committed).

## Test first

1. Back up your original directory/config.json. Extract to a new folder.
2. Copy your original `config.json` into the extracted folder; keep global and per-switch `allowWrite: false`.
3. `npm install` and `node src/cli.js discover switch1` / `node src/cli.js read switch1 1`.
4. Check `python3 --version` and `python3 -m pip --version`. Run `sh install.sh` in the project directory.
5. `python3 -m py_compile netgear.py` and `python3 -c 'import udi_interface; print("OK")'`.

## PG3x development installation

Create a PG3x Local Store entry pointing at a Git repository containing this project. Use Python as language and `netgear.py` as executable, with `install.sh` as installer. Install in a spare slot. PG3x starts the process with its own communication environment: do NOT run `python3 netgear.py` by hand and expect it to connect. Review PG3x node-server log, refresh/restart IoX Admin Console, and check nodes. Suggested short poll 30s, long poll 300s; only long poll performs full SNMP refresh.

The node hierarchy is NETGEAR controller -> switch -> configured port. Parent switch status currently indicates configured, **not reachability**. Port ST reports admin enabled, not actual power delivery; GV0 reports PoE detection. On/Off errors are logged and do not claim success. SNMP write is gated by BOTH global and switch-level allowWrite flags. Profile and API behavior require verification on your eisy and PG3x 3.4.28.

Do not commit SNMP communities to public repositories. Use a private repository, and ensure `config.json` is excluded by `.gitignore`. Local Store deployment must provide config.json separately because it is intentionally excluded from Git.
