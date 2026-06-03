"""
Local development seed script.

Creates 4 demo accounts + sample catalog + orders so the app works
without any real users or external services.

Usage:
    cd backend
    source .venv/bin/activate
    python seed.py

Safe to run multiple times — all inserts are upserts keyed on phone/slug.

Demo accounts
─────────────
Role        Phone           OTP (dev bypass)
──────────────────────────────────────────
Customer    +91 9000000001  123456
Tailor      +91 9000000002  123456
Delivery    +91 9000000003  123456
Admin       +91 9000000004  123456
"""

from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import (
    AdminProfile,
    Category,
    CustomerProfile,
    DeliveryAssignment,
    DeliveryProfile,
    Design,
    Order,
    OrderAssignment,
    OrderItem,
    OrderStatusHistory,
    TailorExpertise,
    TailorProfile,
    UserAccount,
)

engine = create_engine(settings.database_url, echo=False)

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def upsert_user(session: Session, phone: str, full_name: str, email: str | None = None) -> UserAccount:
    user = session.scalar(select(UserAccount).where(UserAccount.phone == phone))
    if user is None:
        user = UserAccount(phone=phone, full_name=full_name, email=email)
        session.add(user)
        session.flush()
        print(f"  + UserAccount  {phone}  ({full_name})")
    return user


def upsert_category(session: Session, slug: str, name: str, sort_order: int) -> Category:
    cat = session.scalar(select(Category).where(Category.slug == slug))
    if cat is None:
        cat = Category(slug=slug, name=name, sort_order=sort_order)
        session.add(cat)
        session.flush()
        print(f"  + Category     {slug}")
    return cat


def upsert_expertise(session: Session, slug: str, name: str) -> TailorExpertise:
    exp = session.scalar(select(TailorExpertise).where(TailorExpertise.slug == slug))
    if exp is None:
        exp = TailorExpertise(slug=slug, name=name)
        session.add(exp)
        session.flush()
    return exp


# ─────────────────────────────────────────────
# Seed
# ─────────────────────────────────────────────

def seed() -> None:
    with Session(engine) as session:

        # ── Catalog ──────────────────────────────────────────────────────────
        print("\n[1/5] Categories & expertise tags")
        CATEGORIES = [
            ("blouse",       "Blouse",       1),
            ("kurti",        "Kurti",        2),
            ("shirt",        "Shirt",        3),
            ("pants",        "Pants",        4),
            ("saree-blouse", "Saree Blouse", 5),
            ("custom",       "Custom",       6),
        ]
        cats: dict[str, Category] = {}
        for slug, name, order in CATEGORIES:
            cats[slug] = upsert_category(session, slug, name, order)
            upsert_expertise(session, slug, name)

        # ── Designs ──────────────────────────────────────────────────────────
        print("\n[2/5] Designs")
        DESIGNS: list[tuple[str, str, float, list[str]]] = [
            # (category_slug, name, base_price, tags)
            ("blouse", "Classic Round Neck",    350.0, ["cotton", "casual"]),
            ("blouse", "Deep V-Neck",           420.0, ["silk", "party"]),
            ("blouse", "Boat Neck",             380.0, ["georgette", "work"]),
            ("blouse", "Halter Back",           460.0, ["silk", "bridal"]),
            ("kurti", "Straight Cut",           480.0, ["casual", "daily"]),
            ("kurti", "A-Line Flared",          520.0, ["cotton", "festive"]),
            ("kurti", "High-Low Hem",           550.0, ["rayon", "trendy"]),
            ("shirt", "Formal Oxford",          600.0, ["cotton", "office"]),
            ("shirt", "Casual Linen",           520.0, ["linen", "casual"]),
            ("pants", "Straight Fit Trousers",  700.0, ["formal", "office"]),
            ("pants", "Palazzo",                580.0, ["rayon", "casual"]),
            ("saree-blouse", "Silk Blouse",     500.0, ["silk", "wedding"]),
            ("custom", "Custom Design",         800.0, ["custom"]),
        ]
        designs: dict[str, Design] = {}
        for cat_slug, dname, price, tags in DESIGNS:
            existing = session.scalar(
                select(Design).where(
                    Design.category_id == cats[cat_slug].id,
                    Design.name == dname,
                )
            )
            if existing is None:
                d = Design(
                    category_id=cats[cat_slug].id,
                    name=dname,
                    base_price=price,
                    tags=tags,
                )
                session.add(d)
                session.flush()
                print(f"  + Design       {cat_slug} / {dname}  ₹{price}")
                designs[dname] = d
            else:
                designs[dname] = existing

        # ── Users & Profiles ─────────────────────────────────────────────────
        print("\n[3/5] Demo user accounts")

        # Customer
        customer_user = upsert_user(session, "+919000000001", "Priya Sharma", "priya@demo.local")
        if session.scalar(select(CustomerProfile).where(CustomerProfile.user_id == customer_user.id)) is None:
            cp = CustomerProfile(
                user_id=customer_user.id,
                addresses=[{
                    "label": "Home",
                    "street": "12 Anna Nagar East",
                    "city": "Chennai",
                    "state": "Tamil Nadu",
                    "pincode": "600040",
                    "lat": 13.0843,
                    "lng": 80.2101,
                }],
                preferences={"notify_sms": True, "notify_push": True},
            )
            session.add(cp)
            session.flush()
            print("  + CustomerProfile for Priya Sharma")

        # Tailor
        tailor_user = upsert_user(session, "+919000000002", "Ravi Kumar")
        tailor_profile = session.scalar(select(TailorProfile).where(TailorProfile.user_id == tailor_user.id))
        if tailor_profile is None:
            blouse_exp = session.scalar(select(TailorExpertise).where(TailorExpertise.slug == "blouse"))
            kurti_exp  = session.scalar(select(TailorExpertise).where(TailorExpertise.slug == "kurti"))
            shirt_exp  = session.scalar(select(TailorExpertise).where(TailorExpertise.slug == "shirt"))
            tailor_profile = TailorProfile(
                user_id=tailor_user.id,
                bio="10 years experience stitching blouses and kurtis in Chennai.",
                approval_state="approved",
                city="Chennai",
                rating=4.7,
            )
            if blouse_exp: tailor_profile.expertise.append(blouse_exp)
            if kurti_exp:  tailor_profile.expertise.append(kurti_exp)
            if shirt_exp:  tailor_profile.expertise.append(shirt_exp)
            session.add(tailor_profile)
            session.flush()
            print("  + TailorProfile for Ravi Kumar (approved)")

        # Delivery
        delivery_user = upsert_user(session, "+919000000003", "Suresh Kumar")
        delivery_profile = session.scalar(select(DeliveryProfile).where(DeliveryProfile.user_id == delivery_user.id))
        if delivery_profile is None:
            delivery_profile = DeliveryProfile(
                user_id=delivery_user.id,
                vehicle_type="bike",
                approval_state="approved",
                is_online=True,
                last_lat=13.0827,
                last_lng=80.2707,
                city="Chennai",
            )
            session.add(delivery_profile)
            session.flush()
            print("  + DeliveryProfile for Suresh Kumar (approved, online)")

        # Admin
        admin_user = upsert_user(session, "+919000000004", "Admin User", "admin@demo.local")
        if session.scalar(select(AdminProfile).where(AdminProfile.user_id == admin_user.id)) is None:
            ap = AdminProfile(
                user_id=admin_user.id,
                role="super_admin",
                permissions=["*"],
            )
            session.add(ap)
            session.flush()
            print("  + AdminProfile  (super_admin)")

        # ── Orders ───────────────────────────────────────────────────────────
        print("\n[4/5] Sample orders")

        customer_profile = session.scalar(
            select(CustomerProfile).where(CustomerProfile.user_id == customer_user.id)
        )

        ORDER_SPECS = [
            # (design_name, status, days_ago_placed, days_until_delivery)
            ("Classic Round Neck", "delivered",    14, None),
            ("Straight Cut",       "delivered",    10, None),
            ("Deep V-Neck",        "in_progress",   3,    4),
            ("Formal Oxford",      "assigned",      1,    6),
            ("Palazzo",            "placed",        0,    7),
        ]

        today = date.today()

        for design_name, status, days_ago, days_fwd in ORDER_SPECS:
            design = designs.get(design_name)
            if design is None:
                continue

            existing_order = session.scalar(
                select(Order)
                .join(OrderItem, OrderItem.order_id == Order.id)
                .where(
                    Order.customer_id == customer_profile.id,
                    OrderItem.design_id == design.id,
                    Order.status == status,  # status is a plain string
                )
            )
            if existing_order:
                continue

            placed_at_date = today - timedelta(days=days_ago)
            exp_delivery   = (today + timedelta(days=days_fwd)) if days_fwd else None

            order = Order(
                customer_id=customer_profile.id,
                status=status,
                placed_at=placed_at_date,
                expected_delivery_date=exp_delivery,
                delivery_address=customer_profile.addresses[0] if customer_profile.addresses else {},
                total_amount=design.base_price,
                currency="INR",
                progress_percent=_progress(status),
                notes=None,
            )
            session.add(order)
            session.flush()

            item = OrderItem(
                order_id=order.id,
                category_id=design.category_id,
                design_id=design.id,
                measurements={
                    "bust": 34, "waist": 28, "hip": 36,
                    "sleeve_length": 7, "blouse_length": 16,
                },
                quantity=1,
                unit_price=design.base_price,
                subtotal=design.base_price,
            )
            session.add(item)

            # Status history
            session.add(OrderStatusHistory(
                order_id=order.id,
                status="placed",
                progress_percent=0,
                note="Order placed",
                actor_role="customer",
            ))

            if status in ("assigned", "in_progress", "delivered"):
                session.add(OrderStatusHistory(
                    order_id=order.id,
                    status="assigned",
                    progress_percent=10,
                    note="Tailor assigned",
                    actor_role="admin",
                ))

            if status in ("in_progress", "delivered"):
                session.add(OrderStatusHistory(
                    order_id=order.id,
                    status="in_progress",
                    progress_percent=_progress(status),
                    note="Stitching started",
                    actor_role="tailor",
                ))

            # Tailor assignment for non-draft orders
            if status in ("assigned", "in_progress", "delivered"):
                session.flush()  # ensure order.id is set
                oa = OrderAssignment(
                    order_id=order.id,
                    tailor_id=tailor_profile.id,
                    state="accepted" if status != "delivered" else "completed",
                    progress_percent=_progress(status),
                    agreed_delivery_date=exp_delivery,
                )
                session.add(oa)

            session.flush()
            print(f"  + Order  {design_name:<26}  status={status}")

        # ── Delivery assignment for in-progress order ─────────────────────
        print("\n[5/5] Delivery assignment for in-progress order")
        in_prog_order = session.scalar(
            select(Order).where(
                Order.customer_id == customer_profile.id,
                Order.status == "in_progress",
            )
        )
        if in_prog_order:
            existing_da = session.scalar(
                select(DeliveryAssignment).where(DeliveryAssignment.order_id == in_prog_order.id)
            )
            if existing_da is None:
                da = DeliveryAssignment(
                    order_id=in_prog_order.id,
                    delivery_partner_id=delivery_profile.id,
                    kind="tailor_to_customer",
                    pickup_location={
                        "address": "Ravi Kumar Tailors, T Nagar, Chennai",
                        "lat": 13.0418, "lng": 80.2341,
                        "contact_name": "Ravi Kumar", "contact_phone": "+919000000002",
                    },
                    drop_location=customer_profile.addresses[0] if customer_profile.addresses else {},
                    state="accepted",
                )
                session.add(da)
                session.flush()
                print(f"  + DeliveryAssignment for order {in_prog_order.id}")

        session.commit()

    print("\n✅  Seed complete!\n")
    print("Demo accounts (use OTP: 123456 on local dev)")
    print("─" * 50)
    print("  Customer   +91 9000000001   (Priya Sharma)")
    print("  Tailor     +91 9000000002   (Ravi Kumar, approved)")
    print("  Delivery   +91 9000000003   (Suresh Kumar, approved)")
    print("  Admin      +91 9000000004   (Admin User, super_admin)")
    print()


def _progress(status: str) -> int:
    return {
        "draft":            0,
        "placed":           5,
        "assigned":        15,
        "in_progress":     55,
        "ready":           90,
        "out_for_delivery": 95,
        "delivered":       100,
        "cancelled":         0,
    }.get(status, 0)


if __name__ == "__main__":
    seed()
