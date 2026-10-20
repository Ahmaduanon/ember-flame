/* Ember observation node — bench prototype, not a certified smoke alarm.
   Classic ESP32 DevKit + UART PMS5003; optional BME280 on I2C.
   Libraries: Adafruit PM25 AQI, Adafruit BME280, Adafruit Unified Sensor,
   Adafruit BusIO. See docs/SMOKE-NODE.md before connecting equipment.
   No Wi-Fi credentials, fabricated readings, CO estimate or actuators.
*/
#include <Wire.h>
#include <Adafruit_PM25AQI.h>
#include <Adafruit_BME280.h>
#include <math.h>

const char* DEVICE_ID = "ember-smoke-01";
const int PM_RX = 16; // Sensor TX -> ESP32 GPIO16. Verify your board pinout.
const int PM_TX = 17; // Not connected; receive-only operation.
const bool USE_ALARM_CONTACT = false;
const int ALARM_PIN = 25;
// Optional input ONLY from an approved isolated, low-voltage dry-contact
// interface rated for this input. Never wire mains/interconnect wires here.
// Closure to GND = active. This simple circuit cannot detect a broken wire.

HardwareSerial pmSerial(2);
Adafruit_PM25AQI particles;
Adafruit_BME280 ambient;
bool pmReady = false, bmeReady = false;
unsigned long lastSent = 0, bootAt = 0;
unsigned long lastParticlesAt = 0;
PM25_AQI_Data latestParticles;
bool haveParticles = false;
const unsigned long STARTUP_HOLD_MS = 30000; // Conservative demo hold, not calibration.

void setup() {
  Serial.begin(115200);
  if (USE_ALARM_CONTACT) pinMode(ALARM_PIN, INPUT_PULLUP);
  Wire.begin(21, 22);
  bmeReady = ambient.begin(0x76) || ambient.begin(0x77);
  pmSerial.begin(9600, SERIAL_8N1, PM_RX, PM_TX);
  pmReady = particles.begin_UART(&pmSerial);
  bootAt = millis();
}

void loop() {
  // Drain complete frames continuously so the once-per-second output uses
  // the latest actual measurement. A missing channel expires after 2.5 s.
  while (pmReady && pmSerial.available() >= 32) {
    PM25_AQI_Data frame;
    if (particles.read(&frame)) {
      latestParticles = frame; lastParticlesAt = millis(); haveParticles = true;
    }
  }
  const unsigned long now = millis();
  if ((unsigned long)(now - lastSent) < 1000) return;
  lastSent = now;

  const bool startup = (unsigned long)(now - bootAt) < STARTUP_HOLD_MS;
  const bool validParticles = haveParticles && (unsigned long)(now - lastParticlesAt) <= 2500
    && !startup && latestParticles.pm25_env <= 5000;
  float t = NAN, h = NAN;
  if (bmeReady) { t = ambient.readTemperature(); h = ambient.readHumidity(); }
  const bool validAmbient = isfinite(t) && t >= -50 && t <= 150 && isfinite(h) && h >= 0 && h <= 100;

  Serial.print("{\"device_id\":\""); Serial.print(DEVICE_ID); Serial.print("\"");
  if (validParticles) { Serial.print(",\"pm25_ugm3\":"); Serial.print(latestParticles.pm25_env); }
  if (validAmbient) {
    Serial.print(",\"ambient_c\":"); Serial.print(t, 2);
    Serial.print(",\"humidity_pct\":"); Serial.print(h, 2);
  }
  // The particle channel is required. An absent optional BME280 is omitted.
  Serial.print(",\"sensor_fault\":"); Serial.print((!startup && !validParticles) || (bmeReady && !validAmbient) ? "true" : "false");
  if (startup) Serial.print(",\"warming_up\":true");
  // Alarm contacts continue to report during startup and particle-sensor faults.
  if (USE_ALARM_CONTACT) {
    Serial.print(",\"smoke_alarm\":"); Serial.print(digitalRead(ALARM_PIN) == LOW ? "true" : "false");
  }
  Serial.println("}");
}
