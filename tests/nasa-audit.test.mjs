import test from 'node:test';
import assert from 'node:assert/strict';
import { auditFindingsWithNasa, evaluateFindingNasaBenchmark, evaluateMissionCertifications } from '../lib/nasa-safety-audit.ts';

test('NASA Audit: correctly maps combustibles near heat to NASA-STD-6001 and Apollo 1', () => {
  const benchmark = evaluateFindingNasaBenchmark({
    category: 'combustibles_heat',
    priority: 'urgent_review',
    title: 'Space heater too close to curtains',
    evidence: 'Portable electric heater placed 15cm from long window fabric and cardboard.',
  });

  assert.equal(benchmark.standardCode, 'NASA-STD-6001-T1');
  assert.equal(benchmark.complianceLevel, 'critical_violation');
  assert.equal(benchmark.simPresetId, 'apollo-1');
  assert.equal(benchmark.psiInvestigationId, 'psi-acme');
  assert.match(benchmark.spaceRisk, /Limiting Oxygen Index/);
  assert.match(benchmark.earthSpinoffMitigation, /Spinoff #9918/);
});

test('NASA Audit: correctly maps electrical daisy chaining to NASA SP-5080 and Apollo 13', () => {
  const benchmark = evaluateFindingNasaBenchmark({
    category: 'power_strip_chain',
    priority: 'urgent_review',
    title: 'Daisy-chained power strips under desk',
    evidence: 'Multiple multi-tap extension cords chained together on carpet.',
  });

  assert.equal(benchmark.standardCode, 'NASA-SP-5080');
  assert.equal(benchmark.complianceLevel, 'critical_violation');
  assert.equal(benchmark.simPresetId, 'apollo-13');
  assert.match(benchmark.spaceRisk, /Zero-gravity atmospheres lack natural heat dissipation/);
  assert.match(benchmark.earthSpinoffMitigation, /Spinoff #9407/);
});

test('NASA Audit: correctly maps blocked exits to ISS SSP 50005 and Mir 1997', () => {
  const benchmark = evaluateFindingNasaBenchmark({
    category: 'blocked_exit',
    priority: 'urgent_review',
    title: 'Storage boxes blocking doorway',
    evidence: 'Cardboard boxes obstruct primary room egress door.',
  });

  assert.equal(benchmark.standardCode, 'ISS-SSP-50005-EGRESS');
  assert.equal(benchmark.simPresetId, 'mir-1997');
  assert.match(benchmark.spaceRisk, /stagnates into an opaque, oily aerosol cloud/);
});

test('NASA Audit: mission habitat certifications evaluate ISS, Moon, Mars, and Rover', () => {
  const mockFindings = [
    {
      category: 'combustibles_heat',
      priority: 'urgent_review',
      title: 'Space heater near drapes',
      evidence: 'Direct contact risk.'
    }
  ];

  const { auditReport, findingsWithNasa } = auditFindingsWithNasa(mockFindings, {
    name: 'Living Room',
    kind: 'home',
    notes: 'Ground floor'
  });

  assert.equal(findingsWithNasa.length, 1);
  assert.equal(findingsWithNasa[0].nasaBenchmark.standardCode, 'NASA-STD-6001-T1');

  // Lunar and Rover environments fail due to hyper-oxygenated flashover risk
  const lunar = auditReport.missionCertifications.find(m => m.missionId === 'lunar');
  assert.equal(lunar.status, 'failed');
  assert.match(lunar.summary, /FAILED/);

  // Overall status should reflect flashover threat
  assert.equal(auditReport.overallStatus, 'Non-Compliant / Flashover Threat');
  assert.ok(auditReport.overallScore < 100);
});

test('NASA Audit: safe space with zero hazards certifies across all 4 space habitats', () => {
  const { auditReport } = auditFindingsWithNasa([], {
    name: 'Clean Lab',
    kind: 'commercial'
  });

  assert.equal(auditReport.overallStatus, 'Flight Certified');
  assert.equal(auditReport.overallScore, 100);
  assert.equal(auditReport.missionCertifications.every(m => m.status === 'certified'), true);
});
