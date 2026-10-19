# Ember Studio 0.4 — combined release

Reviewed the supplied Claude v0.3 ZIP against Ember 0.2 source. The original upload is unchanged. This release builds on the persistent local Ember application.

| Area | Supplied Claude v0.3 | Ember 0.2 | Combined 0.4 decision |
|---|---|---|---|
| Entry experience | Landing page and local waitlist | Workspace opened directly | New architectural navy landing page and light workspace; contact uses FormSubmit |
| Room planning | Manual item-placement scanner | Photo/manual room surveys | Add saved room sketches linked to rooms and review prompts |
| Photo AI | No image model in the manual scanner | Ollama/OpenAI vision adapters | Retain photo AI and human review; add selected views, cached assessments and request caps |
| Hazard estimates | Distance rules and a weighted room score | Evidence and uncertainty per observation | Use contextual review prompts; remove unsupported safety scores and proximity-only wiring claims |
| Sensor scenarios | Interactive Guardian state simulator | Labeled demo incidents and validated input schema | Add a synthetic timeline playground using the same prototype detection engine |
| Physical hardware | MQ signal baselines and suppressant relay firmware | Particulate/ambient observation node and optional alarm contact | Retain monitoring-only starter; do not merge unvalidated suppressant actuation |
| Incident history | Guardian state log | SQLite events linked to prior room findings | Retain durable events, provenance, acknowledgement and cautious closure checks |
| Public hosting | Optional public waitlist mode | Loopback-only local application | Keep local-only delivery; FormSubmit handles the contact form externally |
| Costs | No model request allowance | Local AI default, optional cloud | Cloud paused by default; 2/day, 10/month, two photos/request and 60-second cloud cooldown |

## Design

The uploaded architecture reference informed the navy/blue palette, large serif headings, overlapping feature panels, light lower sections and spacious hierarchy. The new skyline illustration is native SVG; no image-generation or stock-image purchase was used. All interface symbols use Lucide/SVG icons. No emoji UI assets are used.

## FormSubmit

The enquiry form posts to https://formsubmit.co/salisuashraf46@gmail.com in a separate tab. Name, email, interest, message and consent fields are included. FormSubmit CAPTCHA is left enabled, with an additional honeypot. No test message was sent during development. The recipient may need to activate the form using FormSubmit’s first-submission email. Delivery and spam filtering depend on FormSubmit and the recipient mailbox. Run the app through localhost; do not open the built index as a file.

FormSubmit is for contact enquiries, not emergency notifications. Room photographs, AI prompts and device credentials are never attached automatically. Documentation: https://formsubmit.co/documentation and https://formsubmit.co/help

## Usage controls

Usage & settings stores server-enforced request allowances in SQLite. Cloud AI is initially paused. A configured API key and per-request photo consent are still required. Failed/time-out attempts count against cloud allowances; there are no automatic retries. Unchanged photo/context/model assessments reuse saved results without another model call. Daily/monthly counters reset on UTC calendar boundaries and survive application restarts. Pausing cloud or setting an allowance to zero blocks new cloud requests.

These controls limit this app’s request count. They cannot cap ChatGPT credits, exact provider bills, calls from other applications, or computer electricity usage. Local model downloads and installation are separate. No paid model calls were made while building this release.

## Run and upgrade

Extract the ZIP completely, install Node.js 22.13+ and open START-LAB.cmd (Windows) or run sh start-lab.sh (macOS/Linux). Open http://localhost:3000, then Open workspace. No npm installation is needed for the prebuilt app. An iPhone can download the ZIP; a desktop computer runs this local project.

Stop an older app before copying its data folder into this release. Back it up first. Existing Ember 0.2 tables are retained and the new tables/assessment column are created automatically. Claude’s old waitlist table, if present, is left untouched; its old public server mode and waitlist API are not enabled in this release.

## Verification limits

TypeScript and production builds, automated model/detection/vision-adapter/usage/layout/API checks, and Python gateway syntax checks are the software verification gates. Visual browser automation was unavailable in this environment. No physical hardware, live AI accuracy or FormSubmit email delivery was tested. This remains a research prototype, with independent approved smoke/CO alarms required for real buildings.
