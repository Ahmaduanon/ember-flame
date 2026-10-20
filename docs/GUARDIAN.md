# Ember Guardian: build and safety notes
**Prototype. Not a certified smoke alarm or suppression system.** Keep certified alarms and extinguishers in place.

Parts: ESP32 DevKit, PMS5003 (TX to GPIO16), BME280 (I2C 21/22), IR flame module (GPIO27, LOW = flame), toggle switch to GND on GPIO14 (closed = ARMED), buzzer (GPIO33), relay module (GPIO26) driving your release actuator from its own supply. No CO sensor is read by the firmware; the simulator and logic accept CO ppm once you add a calibrated sensor.

How it decides (1 Hz, `lib/guardian.ts` = `firmware/guardian/guardian_esp32.ino`): evidence = particle rise above a slow baseline, temperature slope or 57 C, flame, optional CO. Watch (3 s), warning (two evidence types, 5 s), release (score 4+, two types, 8 s sustained, armed). Max 2 releases, 3 s each, 60 s lockout. Warm-up (60 s) and sensor faults never release.

Known limits: PM2.5 rises with cooking, steam and dust, and a hot stove also raises temperature, so arm it away from cooking. All constants are unvalidated bench values. Test with the actuator DISCONNECTED first (relay LED only), then with water, never with a live suppressant first. Powder suppressants irritate lungs and corrode electronics: mount away from people, and add a manual override. Guardian state also feeds the app's alert pipeline (warning, and release as alarm).
