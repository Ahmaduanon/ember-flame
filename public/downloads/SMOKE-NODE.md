# Ember observation node and monitoring gateway

This is a research prototype for particle/temperature observation, not an approved life-safety detector. Keep working approved smoke and CO alarms independently. Do not create fires, burn materials or use hazardous gas to test it. Use the labeled software demonstrations for workflow testing; hardware validation belongs in a controlled, qualified test program.

Some smoldering conditions release particles before visible flaming. A particulate sensor cannot identify “micro-combustions” uniquely: cooking, dust and steam may also affect it, and some hazardous fires may not reach this sensor in time. No guaranteed pre-flame warning or exact source localization is implemented.

## Starter hardware

The included sketch targets a **classic ESP32 DevKit**, a **UART PMS5003 particulate sensor** and an optional **BME280 breakout**. These are implementation targets, not a certified detector assembly or validated shopping recommendation. Other ESP32 variants have different pin assignments. Verify the exact board, breakout and sensor datasheets before assembly.

With power disconnected:

| Connection | Classic ESP32 mapping |
|---|---|
| PMS5003 power | Suitable regulated 5 V supply and common ground, per sensor datasheet |
| PMS5003 TX, 3.3 V logic | GPIO16 / UART2 RX |
| PMS5003 RX | Not connected; GPIO17 is reserved but not wired |
| Compatible BME280 breakout supply | 3.3 V / GND, subject to breakout specification |
| BME280 SDA / SCL | GPIO21 / GPIO22 |

Never put 5 V on an ESP32 GPIO. Confirm the sensor connector orientation and use an appropriate adapter; do not infer pin order from wire color. Keep sensors away from direct heat and liquids. Enclosure design and placement are not validated by this project.

1. Install the ESP32 board support package for your board in Arduino IDE.
2. Install **Adafruit PM25 AQI**, **Adafruit BME280**, **Adafruit Unified Sensor** and **Adafruit BusIO** libraries.
3. Open `firmware/ember_smoke_node/ember_smoke_node.ino`. Set a unique `DEVICE_ID` for each node. Select the board and port, compile and upload.
4. The USB output is one JSON line per second at **115200 baud**. The particle channel reports fault/incomplete during the first 30 seconds; this hold is a demo convention, not calibration. Frames expire after 2.5 seconds without a fresh particulate measurement. An absent optional BME280 is omitted.
5. In Ember, add the installed room, then **Sensor monitoring → Pair a device**. Enter the exact firmware ID, such as `ember-smoke-01`.
6. Open **IoT connection → USB serial** and connect the node. A real paired stream feeds monitoring while the app remains open, even when you change tabs. Close Arduino Serial Monitor first; only one process can own the serial port.

The sketch does not estimate CO from a generic MQ sensor. `co_ppm` is accepted only as an external measurement from a suitable calibrated sensor/interface that you implement and validate. No CO sensor driver is included. The original BME280/MPU6050 flame-lab node remains available separately; temperature and acceleration alone do not provide complete fire-monitoring coverage.

## Optional alarm contact

`USE_ALARM_CONTACT` is false by default. A qualified installer may integrate a **manufacturer-approved isolated low-voltage dry-contact interface** that is compatible with the alarm and ESP32 input. The example reads a closure between GPIO25 and GND as `smoke_alarm:true` with an internal pull-up. It cannot supervise wire breaks; an open/broken cable is indistinguishable from an inactive contact. Verify this limitation against your interface requirements.

Never connect mains, alarm interconnect wiring or an unknown powered output directly to the ESP32. Do not modify or disable an independent alarm. The original alarm must function with Ember unplugged. Alarm contacts bypass prototype persistence rules and are reported even when the particle channel is starting or faulty. No silence command, valve control, extinguisher actuation or automatic suppression is provided.

## Optional background gateway

Use this instead of a browser serial connection when you want the local server to record while the browser is closed. The **computer, server and gateway must all keep running**. This is not a system service, battery-backed monitor or remote alerting service. Browser notifications require Ember to stay open; SMS, email and mobile push are not implemented.

Install Python 3.10+ and pySerial:

```sh
python -m pip install pyserial==3.5
```

When pairing a device, Ember shows its gateway token once. Copy it locally. On macOS/Linux:

```sh
export EMBER_DEVICE_TOKEN='paste_the_token_here_locally'
python firmware/gateway/monitor_gateway.py --serial-port /dev/ttyUSB0 --device-id ember-smoke-01
```

On Windows PowerShell:

```powershell
$env:EMBER_DEVICE_TOKEN='paste_the_token_here_locally'
python firmware/gateway/monitor_gateway.py --serial-port COM3 --device-id ember-smoke-01
```

Replace the serial path and device ID with yours. On macOS use the board's `/dev/cu.*` device. Avoid storing real tokens in shared shell transcripts. Do not run this gateway and the browser serial reader against the same port. The gateway posts to `http://127.0.0.1:3000/api/safety/device-telemetry`; `--server` can change the local port. Only loopback HTTP origins are accepted. Credentials are not printed, proxied or redirected. A lost token currently requires pairing a new device ID and updating the firmware; token rotation is not implemented.

The server stores a hash of each device token. This is separate from the trusted single-user browser ingestion route. Invalid device credentials are rejected. Samples are not buffered for replay after outages: old sensor readings must not be presented as new. Server receipt time drives persistence rules; device clock synchronization and signed telemetry are future work.

## Packet example

```json
{"device_id":"ember-smoke-01","pm25_ugm3":12,"ambient_c":25.2,"humidity_pct":48,"sensor_fault":false}
```

Optional alarm-only packet:

```json
{"device_id":"ember-smoke-01","smoke_alarm":true}
```

See `IOT-SETUP.md` for all field ranges. Never substitute zero for a missing reading. Each paired device retains its installed-room association; that identifies the reporting sensor's location, not a fire's origin. The prototype has no triangulation, smoke-plume tracking or multi-node source localization.

## Verification and sources

The firmware was reviewed against library interfaces but **was not compiled with an Arduino toolchain or tested on physical hardware**. Python syntax and software API flows were checked; physical USB operation remains untested. Thresholds, placement, response time, calibration, drift, nuisance rejection, enclosure behavior, power loss and communications loss need independent validation. See `SAFETY-MODEL.md` for the implemented rules.

- Adafruit UART sensor wiring and example: https://learn.adafruit.com/pm25-air-quality-sensor/arduino-code
- Adafruit PM25 AQI library example: https://learn.adafruit.com/pmsa003i/arduino
- BME280 library: https://github.com/adafruit/Adafruit_BME280_Library
- NIST home smoke-alarm research: https://www.nist.gov/el/home-smoke-alarm-tests
- USFA smoke-alarm guidance: https://www.usfa.fema.gov/prevention/home-fires/prepare-for-fire/smoke-alarms/
