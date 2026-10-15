# Ember Guard 0.2 — behavior and limits

The building workflow connects three separate records: a human-assigned room, a photo/manual observation, and a timestamped sensor event. They are linked by room ID, never by an inferred causal claim. A kitchen/bathroom adjacency is stored as context, not automatically classified as a hazard. No finding, sensor status or closed incident certifies a building as safe.

## Prototype detection engine

`lib/detection.ts` implements **EMBER-DETECT 0.2-prototype**. These constants exercise the software; they are not validated fire thresholds, certified alarm settings or safe exposure limits.

| Rule | Software result |
|---|---|
| Fresh `smoke_alarm:true` or `co_alarm:true` | Immediate device-alarm event, ahead of fault/history rules |
| Device explicitly reports `sensor_fault:true` | Fault state; previous incidents stay latched |
| PM₂.₅ at least 75 µg/m³ for at least 20 s | Review/watch event |
| CO at least 25 ppm for at least 10 s | Review/watch event |
| PM₂.₅ at least 75 and CO at least 25 for at least 8 s | Corroborating-signal warning |
| PM elevation for at least 8 s plus ambient rise at least 8 °C/min | Corroborating-signal warning |
| Latest receipt older than 15 s, or no sample | Offline / coverage unknown |
| No PM, CO or independent alarm channel | Coverage incomplete |

Sustained rules need at least three samples. A gap above 6 s restarts the continuous segment. Faulted samples do not count toward sustained elevation. The thermal slope uses the current temperature and an earlier available reading 10–60 s before it within the same continuous segment. This is a simple slope, not a calibrated thermal model. Humidity above 80% adds context to a warning; it does not cancel it. Channels not supplied remain missing.

The server uses receipt times, accepts at most one sample per 500 ms per device, and permits a newly asserted alarm contact to bypass that rate limit. Browser forwarding is sampled at about 1 s; state polling is every 2.5 s. These timings, OS scheduling and outages prevent any claim of guaranteed real-time alarm delivery. Background collection requires the gateway and server to keep running. Browser notifications are best effort and require permission plus an open app. There is no SMS, mobile push or automatic emergency-service contact.

## Incidents and review

One unresolved event per device/source is updated rather than duplicated. Its level can escalate and is not automatically reduced. Escalation reopens an acknowledged event. The initial event snapshots earlier findings in the reporting room (up to 30, excluding dismissed findings); later edits do not rewrite that snapshot. Resolved findings remain historical context. The system cannot determine which observation, if any, caused the event.

Acknowledging records a human note; it does not clear sensor state or silence an alarm. Closing a live record requires at least 30 s of continuous, fresh readings below prototype triggers, no new active alarm/fault, and explicitly cleared contact channels that previously asserted. Original quantitative channels must remain present. Missing or offline sensors cannot clear an event. Record closure is administrative, not a physical safety determination. Demo events have their own source and can be closed with a review note.

During an alarm, the UI displays fixed evacuation guidance. No model call is required, and new AI photo analyses are blocked while a live alarm record is unresolved. It does not investigate an ongoing fire or advise an occupant to repair equipment during one.

## Data boundary

- Buildings and room names are user-entered; no address lookup or hidden location inference occurs.
- The survey stores at most four photos per room. Evidence, human review and model provenance remain distinct.
- Demo and imported snapshots never update real paired-device monitoring. Demo incidents never generate real-device browser notifications.
- Raw monitoring samples are retained up to 24 h, pruned on ingestion. The separate original telemetry archive retains up to 7 days. The current detector uses at most 120 s / 180 records.
- All unresolved incidents and the most recent 200 closed records are displayed. Findings persist; the UI displays the latest 200 AI assessments. SQLite retains older assessment/incident records.
- Photos, findings and incident evidence are unencrypted local SQLite data. Stop the app before backing up `data/`. Access control is the computer's user account; this prototype is not multiuser software.
- Device credentials are hashed in storage. Browser USB/WebSocket ingestion trusts the local user. It is not a public device platform or MQTT broker.

## Before real-world safety use

Software unit tests establish rule behavior, not sensitivity to real fires. A qualified program would need approved independent alarms, calibrated hardware, appropriate placement, nuisance and fire-response evaluation, supervised communications, backup power, secure remote notification, a reviewed operational response, and relevant local compliance assessment. The AI component needs expert-labeled photo evaluation with missed concerns and unsupported claims measured separately. None of those validations is supplied by this project.

The flame lab is a separate educational model (`MODEL.md`). Its virtual suppression sliders do not control hardware or establish a safe real-world extinguishing method.

## Primary sources informing the scope

- NIST smoke-alarm tests: https://www.nist.gov/el/home-smoke-alarm-tests
- USFA smoke alarms: https://www.usfa.fema.gov/prevention/home-fires/prepare-for-fire/smoke-alarms/
- USFA appliance/electrical prevention: https://www.usfa.fema.gov/prevention/home-fires/prevent-fires/appliance-and-electrical/index.html

The numerical prototype constants above are project choices; they are not taken from or endorsed by these sources.
