# NETGEAR PoE Controller for Universal Devices eisy

A custom PG3x plugin for controlling individual Power over Ethernet (PoE) ports on NETGEAR managed switches through SNMP.

Designed for Universal Devices eisy running PG3x 3.4.28.

## Project Status

**Development / Testing**

This project combines a Python PG3x node-server interface with a Node.js SNMP controller. The source includes the integration components, but end-to-end operation on eisy and compatibility with individual NETGEAR firmware versions still require testing.

## Features

- Support for multiple NETGEAR switches
- Individual SNMP configuration for each switch
- Physical-to-SNMP port mapping
- Python interface using `udi_interface`
- Node.js SNMP communication
- Intended On, Off, and Query controls for individual PoE ports
- Intended automatic status polling and IoX integration
- Read-only mode for safe initial testing

## Supported Hardware

Primary development target:

- NETGEAR GS752TPP managed PoE switch

Other NETGEAR switches supporting compatible standard PoE MIB objects may work but have not been verified.

## Architecture

```text
Universal Devices eisy
       |
       v
PG3x 3.4.28
       |
       v
Python Node Server (netgear.py)
       |
       v
Node.js SNMP Controller
       |
       v
NETGEAR PoE Switches
```

## Project Structure

```text
netgear-eisy-pg3x/
├── netgear.py
├── install.sh
├── requirements.txt
├── package.json
├── config.example.json
├── README.md
├── README_PG3X.md
├── POLYGLOT_CONFIG.md
├── LICENSE
├── src/
├── profile/
└── test/
```

## Installation

### 1. Requirements

- Universal Devices eisy
- PG3x 3.4.28
- Python 3
- Node.js and npm
- Network access to NETGEAR switches
- SNMP enabled on each switch

### 2. Obtain the source code

Clone the repository:

```bash
git clone https://github.com/cdeslong/netgear-eisy-pg3x.git
cd netgear-eisy-pg3x
```

### 3. Install dependencies

```bash
sh install.sh
```

### 4. Configure switches

Copy the example configuration:

```bash
cp config.example.json config.json
```

Edit `config.json` to define each switch's IP address, SNMP community, and verified port mapping.

Do not commit `config.json` containing real credentials to GitHub.

### 5. Test SNMP communication

```bash
node src/cli.js switches
node src/cli.js discover switch1
node src/cli.js read switch1 1
```

Confirm that the returned information matches the NETGEAR switch management interface.

### 6. PG3x Local Store

Create a Local Store entry using the following proposed settings:

| Setting | Value |
|---|---|
| Name | NetgearPoE |
| Language | Python |
| Executable | netgear.py |
| Repository | https://github.com/cdeslong/netgear-eisy-pg3x |
| Branch | main |
| Documentation | README.md |
| License | LICENSE |

Follow `README_PG3X.md` for additional PG3x development and installation information.

The PG3x installation lifecycle, node registration, and profile deployment must be validated before production use.

## SNMP Port Mapping

Each physical Ethernet port must be mapped to the correct SNMP PoE group and index.

Example:

```json
"portMap": {
  "1": { "group": 1, "index": 1 },
  "2": { "group": 1, "index": 2 },
  "10": { "group": 1, "index": 10 }
}
```

These are example values. Do not assume physical port numbers match SNMP indexes without verification.

## Safety and Security

- Keep SNMP writes disabled during initial setup.
- Verify all physical-to-SNMP mappings.
- Use a noncritical port for initial write testing.
- Restrict SNMP access to trusted management devices.
- Never publish SNMP community strings or credentials.
- SNMPv2c community strings are not encrypted.

## Development Roadmap

- [x] Node.js SNMP controller
- [x] Multi-switch configuration support
- [x] Python PG3x interface scaffold
- [ ] Validate PG3x installation on eisy
- [ ] Verify switch and port node registration
- [ ] Verify On/Off/Query commands
- [ ] Verify status polling and reconnection
- [ ] Verify NETGEAR firmware-specific SNMP writes
- [ ] Complete production testing

## License

MIT License. See [LICENSE](LICENSE).

## Author

cdeslong

## Disclaimer

This is an independent community development project and is not affiliated with or endorsed by NETGEAR or Universal Devices.
