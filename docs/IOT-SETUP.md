# Ember IoT setup

Ember reads measurements. It does not control a burner, valve, fan, heater, or extinguisher.
The simulation runs without any electronics. No physical hardware was connected or tested during development.

For particulate sensing and room-linked events, start with [SMOKE-NODE.md](SMOKE-NODE.md). This guide also covers the original flame-lab environmental node.

## Start with USB (simplest)

1. Run Ember on a computer and open http://localhost:3000 in a desktop browser supporting Web Serial (for example, Chrome or Edge). iPhone/iPad Safari does not provide this USB workflow.
2. For the example firmware, use a classic ESP32 DevKit, a BME280 breakout, and an MPU6050 breakout. The app also accepts any device producing the documented JSON stream.
3. With power disconnected, connect compatible 3.3 V I2C breakouts to 3.3 V and GND; connect SDA to GPIO 21 and SCL to GPIO 22. Confirm your exact board's pinout and breakout voltage requirements. The starter uses BME280 address 0x76 or 0x77 and MPU6050 address 0x68.
4. In Arduino IDE, install the ESP32 board support package appropriate for your board and the Adafruit BME280, Adafruit MPU6050, Adafruit Unified Sensor and Adafruit BusIO libraries. Select your board and USB port.
5. Upload `firmware/ember_esp32.ino`. Close the Arduino serial monitor so Ember can open the port.
6. In Ember, open **IoT connection → USB serial** and select the device. Baud rate is 115200. The starter emits one reading every 500 ms.
7. Turn on **Record telemetry** to save at most one sample every 2 seconds. A disconnected device or a sample older than 5 seconds is not presented as live. The connection stays active when you switch Ember tabs; keep the app open. Closing or reloading the browser disconnects it. Paired USB/WebSocket devices also feed Ember Guard independently of this optional archive toggle.

The BME280 is an ambient sensor; do not place it in a flame. The MPU6050 reports the magnitude of specific acceleration in m/s². A stationary supported board reads approximately 9.81 m/s² on Earth; that is not a direct measurement of the simulated gravity parameter. No dropping of a live flame experiment is required or suggested.

## Oxygen and temperature channels

The starter intentionally leaves oxygen and flame-probe channels absent. Add a suitable calibrated oxygen sensor for `oxygen_pct` and a suitable calibrated probe/interface for `probe_c`. Commodity combustible-gas/MQ sensors must not be treated as calibrated oxygen meters. Follow the selected device's electrical limits and datasheet; no universal pin mapping or calibration is assumed.

`probe_c` remains a measurement, separate from the model's lumped gas temperature. **Use ambient + O₂ inputs** copies only available values within the model's ranges (0–100 °C and 0–30% oxygen). It never changes gravity from the accelerometer. Calibration, timing synchronization, uncertainty quantification and measurement-to-model validation remain future work.

## JSON contract

USB: one UTF-8 JSON object followed by a newline. WebSocket: one JSON object per message.

```json
{
  "device_id": "esp32-01",
  "ambient_c": 25.1,
  "oxygen_pct": 20.9,
  "acceleration_ms2": 9.81
}
```

| Field | Meaning | Accepted input |
|---|---|---|
| device_id | Device label | 1–64 letters, digits, dots, underscores or hyphens |
| ambient_c | Ambient temperature | −50 to 150 °C |
| oxygen_pct | Oxygen volume percentage | 0 to 100% |
| acceleration_ms2 | Specific acceleration magnitude | 0 to 200 m/s² |
| probe_c | Separate temperature probe | −50 to 2,000 °C |
| pm25_ugm3 | Particulate mass concentration estimate | 0–5,000 µg/m³ |
| co_ppm | Calibrated CO measurement, if installed | 0–1,000 ppm |
| humidity_pct | Relative humidity | 0–100% |
| battery_pct | Optional battery estimate | 0–100% |
| smoke_alarm / co_alarm | Independent alarm inputs, if installed | boolean |
| sensor_fault | Device fault / startup status | boolean |
| timestamp | Optional device time | ISO 8601 UTC string, e.g. 2026-10-15T12:00:00Z |

Supply at least one numeric measurement, alarm contact or fault status. Omit unavailable fields; numeric fields may also be null. Never invent zero for a missing channel. Unknown fields, NaN, numeric strings and invalid ranges are rejected. Received time is recorded separately; a timestamp from a device is not trusted as proof of clock synchronization.

## WebSocket gateway (optional)

An optional Python bridge reads the same USB serial stream and forwards it through a WebSocket. This is useful when the browser has no direct serial support. It does not implement MQTT; an MQTT broker requires a bridge that emits this JSON protocol.

Install Python 3.10 or newer, then, from the project folder:

```sh
python -m pip install -r firmware/gateway/requirements.txt
python firmware/gateway/serial_gateway.py --serial-port COM3
```

On Linux, replace `COM3` with your device path (for example `/dev/ttyUSB0`); on macOS use the appropriate `/dev/cu.*` path. Open only one program against the serial device at a time.

In Ember, enter `ws://localhost:8765` and connect. The bridge defaults to loopback and allows only the app's localhost:3000 browser origins. If you change the app port, pass the exact origin with `--origin http://localhost:3001`.

A remote connection requires WSS with a trusted TLS certificate. The bridge accepts `--cert`, `--key`, `--listen` and `--origin`; it refuses non-loopback listening without TLS and an explicit allowed origin. The bridge is a trusted-lab prototype, not an internet service with device authentication. The provided app server itself listens only on your computer. Mobile or remote access requires a separately reviewed hosting/authentication setup; do not simply expose the local server publicly.

## Demo and archive

**Try demo feed** produces synthetic readings, visibly labeled SIMULATED FEED. It requires no device or gateway. Recordings retain their `demo` source. Imported JSON is a snapshot, not a live connection.

SQLite storage is `data/ember.sqlite`. The UI shows the most recent 100 archived samples. Samples older than 7 days are removed when new samples are recorded. Stop the app before copying the data folder for backup.

## References

- Web Serial: https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API
- BME280 example: https://github.com/adafruit/Adafruit_BME280_Library/blob/master/examples/bme280test/bme280test.ino
- MPU6050 example: https://github.com/adafruit/Adafruit_MPU6050/blob/master/examples/basic_readings/basic_readings.ino
- WebSocket server library: https://websockets.readthedocs.io/en/15.0.1/reference/asyncio/server.html
- pySerial: https://pyserial.readthedocs.io/en/latest/pyserial_api.html
