import type { Usage } from "@console/core/billing";
import { define } from "$/providers/replicache";

export const UsageStore = define<Usage>({
  scan() {
    return ["usage"];
  },
  get(id: string) {
    return ["usage", id];
  },
});

type PricingTier = {
  from: number;
  to: number;
  rate: number;
};

export type PricingPlan = PricingTier[];

export const PRICING_PLAN: PricingPlan = [
  { from: 0, to: 1000000, rate: 0 },
  { from: 1000000, to: 10000000, rate: 0.00002 },
  { from: 10000000, to: Infinity, rate: 0.000002 },
];
