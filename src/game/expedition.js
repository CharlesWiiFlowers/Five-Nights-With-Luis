// Run-level progression: which sector we are in, fuel carried between sectors,
// and the state needed to restart only the current sector after death.
import { SECTORS } from '../config/sectors.js';

export const FUEL_CAPACITY = 100;

export class Expedition {
  constructor(sectors = SECTORS) {
    this.sectors = sectors;
    this.sectorIndex = 0;
    this.sectorStartFuel = sectors[0].startFuel;
    this.explanationSeen = false;
    this.deaths = 0;
    this.lastRefill = 0;
  }

  get sector() {
    return this.sectors[this.sectorIndex];
  }

  get isFinalSector() {
    return this.sectorIndex === this.sectors.length - 1;
  }

  // Fuel to use when (re)starting the current sector.
  restartFuel() {
    return this.sectorStartFuel;
  }

  recordDeath() {
    this.deaths += 1;
    return this.restartFuel();
  }

  // Called when the portal of the current sector is entered with `remainingFuel`.
  advance(remainingFuel) {
    if (this.isFinalSector) return null;
    const next = this.sectors[this.sectorIndex + 1];
    const refilled = Math.min(FUEL_CAPACITY, remainingFuel + this.sector.defeatRefill);
    const entry = Math.max(refilled, next.minEntryFuel);
    this.lastRefill = entry - remainingFuel;
    this.sectorIndex += 1;
    this.sectorStartFuel = entry;
    return { fuel: entry, refill: this.lastRefill, emergencyTopUp: entry > refilled };
  }
}
