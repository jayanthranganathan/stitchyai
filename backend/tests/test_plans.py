"""Plan capability invariants — the rules AI gating and pricing depend on."""

from __future__ import annotations

from app.core.plans import PlanTier, get_caps


def test_standard_has_no_ai() -> None:
    caps = get_caps(PlanTier.STANDARD)
    assert caps.ai_enabled is False
    assert caps.ai_monthly_quota == 0
    assert caps.price_inr == 0


def test_gold_has_quota_ai() -> None:
    caps = get_caps(PlanTier.GOLD)
    assert caps.ai_enabled is True
    assert caps.ai_monthly_quota == 30


def test_platinum_unlimited_ai_and_higher_earn() -> None:
    gold = get_caps(PlanTier.GOLD)
    plat = get_caps(PlanTier.PLATINUM)
    assert plat.ai_enabled is True
    assert plat.ai_monthly_quota is None  # unlimited
    assert plat.credit_earn_multiplier > gold.credit_earn_multiplier


def test_get_caps_falls_back_to_standard_on_unknown() -> None:
    assert get_caps("nonsense").tier is PlanTier.STANDARD
