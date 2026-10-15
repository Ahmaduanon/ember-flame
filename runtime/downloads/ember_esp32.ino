/* Ember Lab: observation-only ESP32 serial telemetry.
 * Example target: classic ESP32 DevKit, I2C SDA=21, SCL=22.
 * Libraries: Adafruit BME280 Library, Adafruit MPU6050,
 * Adafruit Unified Sensor, Adafruit BusIO (Arduino Library Manager).
 * BME280: ambient conditions only. MPU6050: specific force, not gravity.
 * No actuator pins or suppression controls are implemented.
 */
#include <Wire.h>
#include <Adafruit_BME280.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <math.h>

Adafruit_BME280 bme;
Adafruit_MPU6050 mpu;
bool haveBme = false;
bool haveMpu = false;

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22); // Adjust for your exact board.
  haveBme = bme.begin(0x76);
  if (!haveBme) haveBme = bme.begin(0x77);
  haveMpu = mpu.begin(0x68);
  if (haveMpu) {
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  }
}

void loop() {
  float ambient = NAN;
  float acceleration = NAN;
  if (haveBme) ambient = bme.readTemperature();
  if (haveMpu) {
    sensors_event_t a, g, temp;
    if (mpu.getEvent(&a, &g, &temp)) {
      acceleration = sqrtf(a.acceleration.x * a.acceleration.x
                         + a.acceleration.y * a.acceleration.y
                         + a.acceleration.z * a.acceleration.z);
    }
  }
  if (!isfinite(ambient) && !isfinite(acceleration)) {
    // The app will reject this diagnostic packet rather than invent readings.
    Serial.println("{\"error\":\"No valid sensor reading. Check wiring and I2C addresses.\"}");
    delay(2000);
    return;
  }
  Serial.print("{\"device_id\":\"esp32-01\"");
  if (isfinite(ambient)) {
    Serial.print(",\"ambient_c\":"); Serial.print(ambient, 2);
  }
  if (isfinite(acceleration)) {
    Serial.print(",\"acceleration_ms2\":"); Serial.print(acceleration, 3);
  }
  // Do not populate oxygen_pct or probe_c until calibrated hardware is installed.
  Serial.println("}");
  delay(500);
}
