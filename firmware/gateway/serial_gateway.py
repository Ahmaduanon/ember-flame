"""Observation-only serial -> WebSocket bridge. Default: local loopback only.

pip install -r requirements.txt
python serial_gateway.py --serial-port COM3
or: python serial_gateway.py --serial-port /dev/ttyUSB0
"""
import argparse
import asyncio
import json
import ssl
import serial
from websockets.asyncio.server import serve, broadcast


def arguments():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--serial-port', required=True)
    parser.add_argument('--baud', type=int, default=115200)
    parser.add_argument('--listen', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=8765)
    parser.add_argument('--origin', action='append', help='Exact allowed browser origin; repeat as needed')
    parser.add_argument('--cert', help='Trusted TLS certificate PEM for WSS')
    parser.add_argument('--key', help='TLS private-key PEM; do not commit it')
    args = parser.parse_args()
    if bool(args.cert) != bool(args.key):
        parser.error('Provide both --cert and --key.')
    if args.listen not in ('localhost', '127.0.0.1', '::1') and not (args.cert and args.origin):
        parser.error('Network listening requires TLS (--cert/--key) and explicit --origin. Keep this on a trusted lab network.')
    return args


async def main(args):
    context = None
    if args.cert:
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(args.cert, args.key)
    origins = args.origin or ['http://localhost:3000', 'http://127.0.0.1:3000']

    async def connected(ws):
        # This channel never accepts commands to hardware.
        await ws.wait_closed()

    with serial.Serial(args.serial_port, args.baud, timeout=1) as port:
        async with serve(connected, args.listen, args.port, origins=origins,
                         ssl=context, max_size=5000, max_queue=8) as server:
            print(f"Telemetry bridge: {'wss' if context else 'ws'}://{args.listen}:{args.port}")
            while True:
                line = await asyncio.to_thread(port.read_until, b'\n', 5001)
                if not line or len(line) > 5000 or not line.endswith(b'\n'):
                    continue
                try:
                    value = json.loads(line)
                    if not isinstance(value, dict) or 'device_id' not in value:
                        continue
                    # The app validates measurements and rejects unsupported fields.
                    broadcast(server.connections, json.dumps(value, allow_nan=False))
                except (ValueError, UnicodeDecodeError):
                    continue


if __name__ == '__main__':
    try:
        asyncio.run(main(arguments()))
    except KeyboardInterrupt:
        pass
