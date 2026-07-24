import { calculateRiskScore, getRiskLevel, buildTodaySnapshot } from './vida-fit';

describe('VidaFit.AI risk engine', () => {
  it('marks a patient as critical when habits are deteriorating', () => {
    const score = calculateRiskScore({
      hydration: 0.2,
      sleep: 0.3,
      meals: 0.15,
      weightChange: -0.08,
      activity: 0.1,
      frequency: 0.2,
    });

    expect(score).toBeGreaterThan(80);
    expect(getRiskLevel(score)).toBe('Crítico');
  });

  it('keeps a patient in low risk when the routine is steady', () => {
    const score = calculateRiskScore({
      hydration: 0.9,
      sleep: 0.8,
      meals: 0.85,
      weightChange: 0.01,
      activity: 0.75,
      frequency: 0.9,
    });

    expect(score).toBeLessThan(35);
    expect(getRiskLevel(score)).toBe('Baixo');
  });

  it('builds a daily snapshot with the main actions and alerts', () => {
    const snapshot = buildTodaySnapshot();

    expect(snapshot.alerts.length).toBeGreaterThan(0);
    expect(snapshot.actions).toContain('Plano alimentar');
    expect(snapshot.actions).toContain('Consulta marcada');
    expect(snapshot.risk.level).toBeDefined();
  });
});
