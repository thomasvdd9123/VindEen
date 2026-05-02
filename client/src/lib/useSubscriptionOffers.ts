import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

// Shape returned by GET /api/subscription-plans (one row per offer).
export interface SubscriptionOffer {
  id: string;
  planId: string;
  type: string;
  name: string;
  durationInYears: number;
  years: number;
  price: number;
  totalPrice: number;
  discountPercentage: number;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface PricingPlan {
  id: string; // legacy identifier "{years}-year" used by /api/mollie/create-payment
  offerId: string;
  years: number;
  discount: number;
  totalPrice: number;
  pricePerYear: number;
  label: string;
  popular: boolean;
}

function offerToPlan(o: SubscriptionOffer): PricingPlan {
  const years = o.years ?? o.durationInYears ?? 1;
  return {
    id: o.id,
    offerId: o.id,
    years,
    discount: o.discountPercentage ?? 0,
    totalPrice: o.totalPrice ?? o.price ?? 0,
    pricePerYear: years > 0 ? Math.round(((o.totalPrice ?? 0) / years) * 100) / 100 : 0,
    label: o.name || `${years}y`,
    popular: !!o.isPopular,
  };
}

export function useSubscriptionOffers() {
  const query = useQuery<SubscriptionOffer[]>({
    queryKey: ["/api/subscription-plans"],
    staleTime: Infinity,
  });
  const plans = useMemo(() => (query.data || []).map(offerToPlan).sort((a, b) => a.years - b.years), [query.data]);
  const defaultPlanId = useMemo(() => {
    if (!plans.length) return null;
    return (plans.find((p) => p.popular) || plans[0]).id;
  }, [plans]);
  return { ...query, plans, defaultPlanId };
}
