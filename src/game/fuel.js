export const FUEL_K = 1; // F_consumed = k · L

export function fuelCost(length, k = FUEL_K) {
  return k * length;
}

export class FuelTank {
  constructor(amount, capacity = 100) {
    this.capacity = capacity;
    this.amount = Math.min(amount, capacity);
  }

  canAfford(cost) {
    return this.amount + 1e-9 >= cost;
  }

  consume(cost) {
    if (!this.canAfford(cost)) return false;
    this.amount = Math.max(0, this.amount - cost);
    return true;
  }

  refill(units) {
    const before = this.amount;
    this.amount = Math.min(this.capacity, this.amount + units);
    return this.amount - before;
  }
}
