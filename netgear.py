#!/usr/bin/env python3
"""PG3x Python interface, delegating SNMP operations to the Node.js CLI."""
import json
import os
import re
import subprocess
from pathlib import Path
import udi_interface

LOG = udi_interface.LOGGER
ROOT = Path(__file__).resolve().parent
CONFIG = ROOT / 'config.json'


def run_cli(*args):
    env = os.environ.copy()
    env['POE_CONFIG'] = str(CONFIG)
    completed = subprocess.run(['node', str(ROOT / 'src' / 'cli.js'), *map(str, args)],
                               cwd=str(ROOT), env=env, capture_output=True,
                               text=True, timeout=35, check=False)
    if completed.returncode:
        raise RuntimeError(completed.stderr.strip() or 'Node.js command failed')
    return json.loads(completed.stdout)


def address(value):
    """IoX addresses are <=14 chars, lowercase alphanumeric."""
    if not re.fullmatch(r'[a-z][a-z0-9]{0,7}', value):
        raise ValueError('Switch IDs must start with a letter and contain <=8 lowercase letters/digits')
    return value


class Controller(udi_interface.Node):
    id = 'POECTRL'
    drivers = [{'driver': 'ST', 'value': 1, 'uom': 2}]
    def query(self, command=None):
        self.reportDrivers()
    commands = {'QUERY': query}


class Switch(udi_interface.Node):
    id = 'POESW'
    drivers = [{'driver': 'ST', 'value': 0, 'uom': 2}]
    def query(self, command=None):
        self.reportDrivers()
    commands = {'QUERY': query}


class Port(udi_interface.Node):
    id = 'POEPORT'
    drivers = [{'driver': 'ST', 'value': 0, 'uom': 2},
               {'driver': 'GV0', 'value': 0, 'uom': 25}]
    def __init__(self, poly, primary, addr, name, switch_id, port):
        super().__init__(poly, primary, addr, name)
        self.switch_id = switch_id
        self.port = port

    def refresh(self):
        try:
            data = run_cli('read', self.switch_id, self.port)['result']
            self.setDriver('ST', 1 if data['enabled'] else 0)
            self.setDriver('GV0', int(data['detection'] or 0))
            return True
        except Exception as exc:
            LOG.error('Read failed %s port %s: %s', self.switch_id, self.port, exc)
            return False

    def query(self, command=None):
        self.refresh()

    def on(self, command=None):
        self.change('on')

    def off(self, command=None):
        self.change('off')

    def change(self, state):
        try:
            run_cli('set', self.switch_id, self.port, state)
            self.refresh()
        except Exception as exc:
            LOG.error('PoE %s failed on %s port %s: %s', state, self.switch_id, self.port, exc)

    commands = {'DON': on, 'DOF': off, 'QUERY': query}


class App:
    def __init__(self):
        self.poly = udi_interface.Interface([])
        self.ports = []
        self.poly.start()
        self.poly.subscribe(self.poly.POLL, self.poll)
        self.poly.subscribe(self.poly.STOP, self.stop)
        self.poly.ready()
        self.poly.setCustomParamsDoc()
        self.poly.updateProfile()
        self.create_nodes()

    def create_nodes(self):
        cfg = json.loads(CONFIG.read_text())
        self.poly.addNode(Controller(self.poly, 'netgear', 'netgear', 'NETGEAR PoE Controller'))
        for sid, settings in cfg['switches'].items():
            sid = address(sid)
            self.poly.addNode(Switch(self.poly, 'netgear', sid, settings.get('name', sid)))
            for port in sorted(map(int, settings.get('portMap', {}))):
                if not 1 <= port <= 48:
                    raise ValueError('Invalid port %s for %s' % (port, sid))
                addr = f'{sid}p{port:02d}'
                node = Port(self.poly, sid, addr, f'Port {port:02d}', sid, port)
                self.poly.addNode(node)
                self.ports.append(node)
        LOG.info('Registered %d port nodes', len(self.ports))

    def poll(self, polltype):
        if 'longPoll' in polltype:
            for node in self.ports:
                node.refresh()

    def stop(self):
        LOG.info('NETGEAR bridge stopping')

    def run(self):
        self.poly.runForever()


if __name__ == '__main__':
    App().run()
