"""Shared coupon validation, claim, and redemption helpers."""

from django.utils import timezone

from .models import Coupon, UserCoupon


def normalize_code(code: str) -> str:
    return (code or "").strip().upper()


def get_coupon(code: str) -> Coupon | None:
    try:
        return Coupon.objects.get(code=normalize_code(code))
    except Coupon.DoesNotExist:
        return None


def coupon_discount_preview(coupon: Coupon, order_total: float):
    if coupon.discount_type == Coupon.TYPE_PERCENTAGE:
        return order_total * float(coupon.discount_value) / 100
    if coupon.discount_type == Coupon.TYPE_FIXED:
        return float(coupon.discount_value)
    if coupon.discount_type == Coupon.TYPE_FREE_ITEM:
        return None
    return 0


def user_claim_count(user, coupon: Coupon) -> int:
    return UserCoupon.objects.filter(user=user, coupon=coupon).count()


def user_has_unused_claim(user, coupon: Coupon) -> bool:
    return UserCoupon.objects.filter(user=user, coupon=coupon, is_used=False).exists()


def can_user_claim(user, coupon: Coupon) -> tuple[bool, str]:
    if not coupon.is_valid:
        return False, "This coupon is expired or no longer active."
    limit = coupon.max_claims_per_user
    if limit > 0 and user_claim_count(user, coupon) >= limit:
        return False, "You have already claimed this coupon."
    if UserCoupon.objects.filter(user=user, coupon=coupon, is_used=False).exists():
        return False, "You already have this coupon in your wallet."
    return True, ""


def claim_coupon_for_user(user, code: str) -> UserCoupon:
    coupon = get_coupon(code)
    if not coupon:
        raise ValueError("Coupon not found.")
    ok, msg = can_user_claim(user, coupon)
    if not ok:
        raise ValueError(msg)
    return UserCoupon.objects.create(user=user, coupon=coupon)


def require_claimed_coupon(user, coupon: Coupon) -> UserCoupon:
    uc = (
        UserCoupon.objects.filter(user=user, coupon=coupon, is_used=False)
        .order_by("-claimed_at")
        .first()
    )
    if not uc:
        raise ValueError("Claim this coupon on the Coupons page before using it at checkout.")
    return uc


def mark_claim_used(user_coupon: UserCoupon, order) -> None:
    user_coupon.is_used = True
    user_coupon.used_at = timezone.now()
    user_coupon.order = order
    user_coupon.save(update_fields=["is_used", "used_at", "order"])


def list_available_coupons_for_user(user):
    """Active coupons customers can see and claim (no code search required)."""
    from .serializers import CouponSerializer

    result = []
    for coupon in Coupon.objects.filter(is_active=True).order_by("-created_at"):
        if not coupon.is_valid:
            continue

        unused = (
            UserCoupon.objects.filter(user=user, coupon=coupon, is_used=False)
            .order_by("-claimed_at")
            .first()
        )
        can_claim, claim_message = can_user_claim(user, coupon)
        claims_used = user_claim_count(user, coupon)

        if unused:
            status = "in_wallet"
            status_message = "In your wallet — ready to use at checkout."
        elif can_claim:
            status = "claimable"
            status_message = "Tap Claim to add this to your wallet."
        elif claims_used > 0 and coupon.max_claims_per_user > 0 and claims_used >= coupon.max_claims_per_user:
            status = "exhausted"
            status_message = "You have already used this promotion."
        else:
            status = "unavailable"
            status_message = claim_message or "Not available to claim right now."

        result.append(
            {
                "coupon": CouponSerializer(coupon).data,
                "status": status,
                "can_claim": can_claim,
                "in_wallet": unused is not None,
                "wallet_claim_id": unused.id if unused else None,
                "status_message": status_message,
            }
        )
    return result
