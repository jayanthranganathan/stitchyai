"""Orders service — order lifecycle."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.catalog import Category, Design
from app.models.credit import CreditKind
from app.models.order import Order, OrderItem, OrderStatus, OrderStatusHistory
from app.models.user import CustomerProfile
from app.modules.credits.service import CreditsService
from app.modules.orders.repository import OrdersRepository
from app.modules.orders.schemas import OrderCreate, OrderItemPublic, OrderProgress, OrderPublic


class OrdersService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = OrdersRepository(db)

    def create(self, user_id: uuid.UUID, body: OrderCreate) -> OrderPublic:
        # ── 1. Resolve customer profile from user_id ──────────────────────────
        customer = self.db.query(CustomerProfile).filter(CustomerProfile.user_id == user_id).first()
        if customer is None:
            raise NotFoundError("Customer profile not found for this account")

        # ── 2. Resolve category from slug ─────────────────────────────────────
        category = self.db.query(Category).filter(Category.slug == body.category_slug).first()
        if category is None:
            raise NotFoundError(f"Category '{body.category_slug}' not found")

        # ── 3. Resolve unit price from design (or 0 for custom) ──────────────
        design: Design | None = None
        if body.design_id:
            design = self.db.get(Design, uuid.UUID(body.design_id))
        unit_price: float = float(design.base_price) if design else 0.0
        subtotal = unit_price * body.quantity

        # ── 4. Resolve delivery address (fall back to customer's first saved address) ──
        delivery_address = body.delivery_address
        if not delivery_address and customer.addresses:
            delivery_address = customer.addresses[0]

        # ── 5. Apply credit redemption (1 credit = ₹1), capped at balance & total ──
        redeem = Decimal(0)
        if body.credits_to_redeem > 0:
            redeem = min(
                Decimal(body.credits_to_redeem),
                Decimal(customer.credit_balance),
                Decimal(str(subtotal)),
            )
        total_after = Decimal(str(subtotal)) - redeem

        # ── 6. Build order ────────────────────────────────────────────────────
        item = OrderItem(
            category_id=category.id,
            design_id=uuid.UUID(body.design_id) if body.design_id else None,
            proposal_id=uuid.UUID(body.proposal_id) if body.proposal_id else None,
            measurements=body.measurements,
            quantity=body.quantity,
            unit_price=unit_price,
            subtotal=subtotal,
        )
        order = Order(
            customer_id=customer.id,
            status=OrderStatus.PLACED,
            placed_at=datetime.now(tz=UTC),
            expected_delivery_date=body.expected_delivery_date,
            delivery_address=delivery_address,
            notes=body.notes,
            total_amount=total_after,
            credits_redeemed=redeem,
            items=[item],
        )
        order.history.append(
            OrderStatusHistory(
                status=OrderStatus.PLACED,
                progress_percent=5,
                actor_role="customer",
                note="Order placed",
            )
        )

        # ── 7. Persist order + ledger in one transaction ───────────────────────
        self.db.add(order)
        self.db.flush()  # assign order.id before writing the credit ledger entry
        if redeem > 0:
            CreditsService(self.db).redeem(
                customer,
                redeem,
                CreditKind.REDEEM_ORDER,
                reference_id=order.id,
                note=f"Redeemed on order {str(order.id)[:8]}",
            )
        self.db.commit()
        self.db.refresh(order)
        # TODO: publish OrderPlaced event → notify tailors with matching expertise
        return self._to_public(order)

    def mark_delivered(self, order_id: uuid.UUID, actor_role: str = "delivery") -> OrderPublic:
        """Transition an order to DELIVERED and award earn-credits to the customer.

        This is the single hook that grants order-completion credits. Wire any
        delivery/admin "mark delivered" action through here.
        """
        order = self.repo.get(order_id)
        if not order:
            raise NotFoundError("Order not found")
        if order.status == OrderStatus.DELIVERED:
            return self._to_public(order)

        order.status = OrderStatus.DELIVERED
        order.progress_percent = 100
        order.history.append(
            OrderStatusHistory(
                status=OrderStatus.DELIVERED,
                progress_percent=100,
                actor_role=actor_role,
                note="Order delivered",
            )
        )
        # Award completion credits based on the customer's plan earn rate
        CreditsService(self.db).award_for_delivered_order(order)
        self.db.commit()
        self.db.refresh(order)
        return self._to_public(order)

    def _resolve_customer(self, user_id: uuid.UUID) -> CustomerProfile:
        customer = self.db.query(CustomerProfile).filter(CustomerProfile.user_id == user_id).first()
        if customer is None:
            raise NotFoundError("Customer profile not found for this account")
        return customer

    def get_for_customer(self, user_id: uuid.UUID, order_id: uuid.UUID) -> OrderPublic:
        customer = self._resolve_customer(user_id)
        order = self.repo.get(order_id)
        if not order or order.customer_id != customer.id:
            raise NotFoundError("Order not found")
        return self._to_public(order)

    def list_for_customer(self, user_id: uuid.UUID) -> list[OrderPublic]:
        customer = self._resolve_customer(user_id)
        return [self._to_public(o) for o in self.repo.list_for_customer(customer.id)]

    def progress(self, order_id: uuid.UUID) -> OrderProgress:
        order = self.repo.get(order_id)
        if not order:
            raise NotFoundError("Order not found")
        return OrderProgress(
            status=order.status.value,
            progress_percent=order.progress_percent,
            eta=order.expected_delivery_date,
            current_actor=None,  # TODO: derive from assignments
            history=[
                {
                    "status": h.status.value,
                    "progress_percent": h.progress_percent,
                    "note": h.note,
                    "actor_role": h.actor_role,
                    "at": h.created_at.isoformat(),
                }
                for h in order.history
            ],
        )

    @staticmethod
    def _item_image(item: OrderItem) -> str | None:
        """First available cloth image: library design image, else proposal reference."""
        if item.design and item.design.images:
            return item.design.images[0]
        if item.proposal and item.proposal.reference_images:
            return item.proposal.reference_images[0]
        return None

    def _to_public(self, order: Order) -> OrderPublic:
        # Resolve category names once (orders usually have a single item)
        cat_ids = {i.category_id for i in order.items}
        cat_names: dict[uuid.UUID, str] = {}
        if cat_ids:
            for cat in self.db.query(Category).filter(Category.id.in_(cat_ids)).all():
                cat_names[cat.id] = cat.name

        payment = order.payment
        return OrderPublic(
            id=str(order.id),
            status=order.status.value,
            placed_at=order.placed_at.isoformat() if order.placed_at else None,
            expected_delivery_date=order.expected_delivery_date,
            total_amount=float(order.total_amount),
            credits_redeemed=float(order.credits_redeemed),
            currency=order.currency,
            progress_percent=order.progress_percent,
            notes=order.notes,
            payment_status=payment.status.value if payment else None,
            payment_provider=payment.provider if payment else None,
            items=[
                OrderItemPublic(
                    id=str(i.id),
                    category_id=str(i.category_id),
                    category_name=cat_names.get(i.category_id),
                    design_id=str(i.design_id) if i.design_id else None,
                    design_name=i.design.name if i.design else None,
                    proposal_id=str(i.proposal_id) if i.proposal_id else None,
                    image_url=self._item_image(i),
                    quantity=i.quantity,
                    unit_price=float(i.unit_price),
                    subtotal=float(i.subtotal),
                )
                for i in order.items
            ],
        )
