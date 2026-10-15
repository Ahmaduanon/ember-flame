#!/usr/bin/env python3
"""Read a local USB node into Ember's authenticated local monitoring API.
No cloud, outbound alerts, actuation, synthetic readings or replay queue.
Requires Python 3.10+ and pyserial 3.5. See docs/SMOKE-NODE.md.
"""
import argparse
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request

import serial


def server_origin(value):
    u = urllib.parse.urlsplit(value)
    if (u.scheme != 'http' or u.hostname not in ('127.0.0.1', 'localhost', '::1')
            or u.username or u.password or u.path not in ('', '/') or u.query or u.fragment):
        raise argparse.ArgumentTypeError('Use a plain localhost HTTP origin, such as http://127.0.0.1:3000')
    return value.rstrip('/')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--serial-port', required=True, help='COM3, /dev/ttyUSB0 or your board port')
    parser.add_argument('--device-id', required=True, help='Must match the paired ID and firmware device_id')
    parser.add_argument('--server', type=server_origin, default='http://127.0.0.1:3000')
    args = parser.parse_args()
    token = os.environ.get('EMBER_DEVICE_TOKEN', '')
    if not token:
        parser.error('Set EMBER_DEVICE_TOKEN locally to the token shown when pairing this device.')
    # Bypass proxy environment variables for localhost; never forward credentials.
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *unused):
            return None
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
    last_report = 0.0
    while True:
        try:
            with serial.Serial(args.serial_port, 115200, timeout=1) as port:
                port.reset_input_buffer()
                print('USB connected. Forwarding fresh samples; Ctrl+C stops monitoring.', flush=True)
                while True:
                    line = port.read_until(b'\n', 4097)
                    if not line:
                        continue
                    if len(line) > 4096 or not line.endswith(b'\n'):
                        port.reset_input_buffer()
                        continue
                    try:
                        sample = json.loads(line)
                        if not isinstance(sample, dict) or sample.get('device_id') != args.device_id:
                            continue
                        request = urllib.request.Request(
                            args.server + '/api/safety/device-telemetry',
                            data=json.dumps(sample, allow_nan=False).encode(),
                            headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token},
                            method='POST')
                        with opener.open(request, timeout=3) as response:
                            result = json.load(response)
                        if time.monotonic() - last_report > 10:
                            print('Device state:', result.get('state', result.get('reason', 'waiting')), flush=True)
                            last_report = time.monotonic()
                    except urllib.error.HTTPError as error:
                        print('Local API rejected sample (HTTP %s). Check pairing and packet format.' % error.code, flush=True)
                        if error.code == 401:
                            return 1
                        time.sleep(1)
                        port.reset_input_buffer()
                    except (urllib.error.URLError, TimeoutError, OSError):
                        print('Local server unavailable. Samples are discarded, never replayed as current.', flush=True)
                        time.sleep(2)
                        port.reset_input_buffer()
                    except (ValueError, UnicodeError):
                        continue
        except serial.SerialException:
            print('USB unavailable; retrying. Check connection and close other serial readers.', flush=True)
            time.sleep(2)


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print('\nGateway stopped.')
