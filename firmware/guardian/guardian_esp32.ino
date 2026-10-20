/* Ember Guardian: bench prototype, NOT a certified smoke alarm or suppression system.
   ESP32 DevKit + PMS5003 (UART2) + BME280 (I2C) + IR flame module + arm switch + buzzer + relay.
   Logic mirrors lib/guardian.ts (1 Hz). No CO channel is read: add a calibrated CO sensor before using CO evidence.
   Libraries: Adafruit PM25 AQI, Adafruit BME280, Adafruit Unified Sensor, Adafruit BusIO. Read docs/GUARDIAN.md first. */
#include <Wire.h>
#include <Adafruit_PM25AQI.h>
#include <Adafruit_BME280.h>
#include <math.h>

const char* DEVICE_ID = "ember-guardian-01";
const int PM_RX = 16, PM_TX = 17;                 // PMS5003 TX -> GPIO16
const int PIN_FLAME = 27, PIN_ARM = 14, PIN_BUZZ = 33, PIN_RELAY = 26;
const int RELAY_ON = HIGH, RELAY_OFF = LOW;       // flip for active-low relay modules
const int WARMUP_S = 60, WATCH_S = 3, WARN_S = 5, FIRE_S = 8, CLEAR_S = 10, DISCHARGE_S = 3, COOLDOWN_S = 60, MAX_DISCHARGES = 2, FIRE_SCORE = 4;
const float PM_WEAK = 35, PM_STRONG = 75, SLOPE_WEAK = 1.5f, SLOPE_STRONG = 4.0f, ABS_TEMP = 57;
enum S { WARMUP, NORMAL, WATCH, WARNING, DISCHARGE, COOLDOWN, FAULT };
const char* NAMES[] = { "warmup", "normal", "watch", "warning", "discharging", "cooldown", "fault" };

HardwareSerial pmSerial(2);
Adafruit_PM25AQI particles;
Adafruit_BME280 ambient;
PM25_AQI_Data latest;
bool pmReady = false, bmeReady = false, haveParticles = false, relayOn = false;
unsigned long lastParticlesAt = 0, lastTick = 0;
uint32_t t = 0;
int state = WARMUP, score = 0;
float basePm = NAN, hist[30]; int hn = 0;
int watchT = 0, warnT = 0, fireT = 0, clearT = 0, coolT = 0, dischargeLeft = 0, discharges = 0;

int lvl(float v, float a, float b) { return v >= b ? 2 : v >= a ? 1 : 0; }

void setup() {
  pinMode(PIN_RELAY, OUTPUT); digitalWrite(PIN_RELAY, RELAY_OFF);   // safe-off first
  pinMode(PIN_BUZZ, OUTPUT); digitalWrite(PIN_BUZZ, LOW);
  pinMode(PIN_FLAME, INPUT); pinMode(PIN_ARM, INPUT_PULLUP);        // unplugged arm switch = HIGH = DISARMED
  Serial.begin(115200);
  Wire.begin(21, 22);
  bmeReady = ambient.begin(0x76) || ambient.begin(0x77);
  pmSerial.begin(9600, SERIAL_8N1, PM_RX, PM_TX);
  pmReady = particles.begin_UART(&pmSerial);
}

void tick() {
  t++;
  float temp = NAN, hum = NAN;
  if (bmeReady) { temp = ambient.readTemperature(); hum = ambient.readHumidity(); }
  bool ambientOk = isfinite(temp) && temp > -20 && temp < 120 && isfinite(hum) && hum >= 0 && hum <= 100;
  bool pmOk = haveParticles && (millis() - lastParticlesAt) <= 2500 && latest.pm25_env <= 5000;
  float pm = pmOk ? (float)latest.pm25_env : NAN;
  bool flame = digitalRead(PIN_FLAME) == LOW, armed = digitalRead(PIN_ARM) == LOW;
  bool fault = !pmOk || (bmeReady && !ambientOk);
  if (fault) { state = (t < WARMUP_S) ? WARMUP : FAULT; relayOn = false; score = 0; }
  else {
    if (bmeReady) { if (hn == 30) { memmove(hist, hist + 1, 29 * sizeof(float)); hn = 29; } hist[hn++] = temp; }
    if (isnan(basePm)) basePm = pm;
    float slope = hn >= 10 ? (hist[hn - 1] - hist[0]) / (hn - 1) * 60.0f : 0;
    int pChem = lvl(pm - basePm, PM_WEAK, PM_STRONG);
    int pHeat = (bmeReady && temp >= ABS_TEMP) ? 2 : lvl(slope, SLOPE_WEAK, SLOPE_STRONG);
    int pFlame = flame ? 3 : 0;
    score = pChem + pHeat + pFlame;
    int classes = (pChem > 0) + (pHeat > 0) + (pFlame > 0);
    if (t < WARMUP_S) { basePm += 0.05f * (pm - basePm); state = WARMUP; relayOn = false; }
    else {
      if (state == WARMUP || state == FAULT) state = NORMAL;
      watchT = score >= 1 ? watchT + 1 : 0;
      warnT = (score >= 3 && classes >= 2) ? warnT + 1 : 0;
      fireT = (score >= FIRE_SCORE && classes >= 2) ? fireT + 1 : 0;
      clearT = score == 0 ? clearT + 1 : 0;
      if (state == NORMAL && score == 0) basePm += 0.01f * (pm - basePm);
      bool fire = fireT >= FIRE_S && armed && discharges < MAX_DISCHARGES;
      if (state == DISCHARGE) { relayOn = true; if (--dischargeLeft <= 0) { relayOn = false; state = COOLDOWN; coolT = 0; discharges++; } }
      else if (state == COOLDOWN) {
        relayOn = false; coolT++;
        if (clearT >= COOLDOWN_S) { state = NORMAL; discharges = 0; }
        else if (coolT >= COOLDOWN_S && fire) { state = DISCHARGE; dischargeLeft = DISCHARGE_S; relayOn = true; }
      } else {
        relayOn = false;
        if (fire) { state = DISCHARGE; dischargeLeft = DISCHARGE_S; relayOn = true; }
        else if (warnT >= WARN_S && state < WARNING) state = WARNING;
        else if (watchT >= WATCH_S && state < WATCH) state = WATCH;
        else if (clearT >= CLEAR_S && state != NORMAL) state = NORMAL;
      }
    }
  }
  digitalWrite(PIN_RELAY, relayOn ? RELAY_ON : RELAY_OFF);
  bool buzz = state == WARNING || state == DISCHARGE || (state == COOLDOWN && score > 0) || (state == FAULT && t % 20 == 0);
  digitalWrite(PIN_BUZZ, buzz ? HIGH : LOW);
  Serial.print("{\"device_id\":\""); Serial.print(DEVICE_ID); Serial.print("\"");
  if (pmOk) { Serial.print(",\"pm25_ugm3\":"); Serial.print(pm, 0); }
  if (ambientOk) { Serial.print(",\"ambient_c\":"); Serial.print(temp, 2); Serial.print(",\"humidity_pct\":"); Serial.print(hum, 2); }
  Serial.print(",\"sensor_fault\":"); Serial.print(state == FAULT ? "true" : "false");
  if (state == WARMUP) Serial.print(",\"warming_up\":true");
  Serial.print(",\"flame_detected\":"); Serial.print(flame ? "true" : "false");
  Serial.print(",\"armed\":"); Serial.print(armed ? "true" : "false");
  Serial.print(",\"guardian_state\":\""); Serial.print(NAMES[state]); Serial.print("\"");
  Serial.print(",\"guardian_score\":"); Serial.print(score);
  Serial.println("}");
}

void loop() {
  while (pmReady && pmSerial.available() >= 32) {
    PM25_AQI_Data frame;
    if (particles.read(&frame)) { latest = frame; lastParticlesAt = millis(); haveParticles = true; }
  }
  if (millis() - lastTick >= 1000) { lastTick += 1000; tick(); }
}
