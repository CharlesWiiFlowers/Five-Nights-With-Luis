import { describe, expect, it } from 'vitest';
import { FuelTank, fuelCost } from '../src/game/fuel.js';
import { Expedition, FUEL_CAPACITY } from '../src/game/expedition.js';
import { SECTORS } from '../src/config/sectors.js';

describe('fuel', () => {
  it('consumes k·L and refuses unaffordable routes', () => {
    const t = new FuelTank(10);
    expect(fuelCost(4.5)).toBe(4.5);
    expect(t.consume(4.5)).toBe(true);
    expect(t.amount).toBeCloseTo(5.5);
    expect(t.consume(6)).toBe(false);
    expect(t.amount).toBeCloseTo(5.5);
    expect(t.refill(500)).toBeCloseTo(94.5);
    expect(t.amount).toBe(100);
  });
});

describe('expedition', () => {
  it('carries fuel between sectors with a partial refill', () => {
    const e = new Expedition();
    const out = e.advance(30);
    expect(e.sectorIndex).toBe(1);
    expect(out.fuel).toBe(Math.max(Math.min(FUEL_CAPACITY, 30 + SECTORS[0].defeatRefill), SECTORS[1].minEntryFuel));
  });

  it('death restores only the current sector entry fuel', () => {
    const e = new Expedition();
    e.advance(42);
    const entry = e.sectorStartFuel;
    expect(e.recordDeath()).toBe(entry);
    expect(e.sectorIndex).toBe(1);
  });

  it('applies an emergency top-up so a sector is never started empty', () => {
    const e = new Expedition();
    const out = e.advance(0);
    expect(out.fuel).toBeGreaterThanOrEqual(SECTORS[1].minEntryFuel);
  });

  it('reaches all three sectors and stops after the last', () => {
    const e = new Expedition();
    e.advance(10);
    e.advance(10);
    expect(e.sector.name).toBe('THE SINGULARITY');
    expect(e.advance(10)).toBeNull();
  });
});
