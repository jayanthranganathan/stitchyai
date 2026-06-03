"""Orders service — order lifecycle."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.catalog import Category, Design
from app.models.order import Order, OrderItem, OrderStatus, OrderStatusHistory
from app.models.user import CustomerProfile
from app.modules.orders.repository import OrdersRepository
from app.modules.orders.schemas import OrderCreate, OrderProgress, OrderPublic, OrderItemPublic


class OrdersService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = OrdersRepository(db)

    def create(self, user_id: uuid.UUID, body: OrderCreate) -> OrderPublic:
        # ── 1. Resolve customer profile from user_id ──────────────────────────
        customer = (
            self.db.query(CustomerProfile)
            .filter(CustomerProfile.user_id == user_id)
            .first()
        )
        if customer is None:
            raise NotFoundError("Customer profile not found for this account")

        # ── 2. Resolve category from slug ─────────────────────────────────────
        category = (
            self.db.query(Category)
            .filter(Category.slug == body.category_slug)
            .first()
        )
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

        # ── 5. Build order ────────────────────────────────────────────────────
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
            placed_at=datetime.now(tz=timezone.utc),
            expected_delivery_date=body.expected_delivery_date,
            delivery_address=delivery_address,
            notes=body.notes,
            total_amount=subtotal,
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
        self.repo.save(order)
        # TODO: publish OrderPlaced event → notify tailors with matching expertise
        return self._to_public(order)

    def _resolve_customer(self, user_id: uuid.UUID) -> CustomerProfile:
        customer = (
            self.db.query(CustomerProfile)
            .filter(CustomerProfile.user_id == user_id)
            .first()
        )
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
    def _to_public(order: Order) -> OrderPublic:
        return OrderPublic(
            id=str(order.id),
            status=order.status.value,
            placed_at=order.placed_at.isoformat() if order.placed_at else None,
            expected_delivery_date=order.expected_delivery_date,
            total_amount=float(order.total_amount),
            currency=order.currency,
            progress_percent=order.progress_percent,
            items=[
                OrderItemPublic(
                    id=str(i.id),
                    category_id=str(i.category_id),
                    design_id=str(i.design_id) if i.design_id else None,
                    proposal_id=str(i.proposal_id) if i.proposal_id else None,
                    quantity=i.quantity,
                    unit_price=float(i.unit_price),
                    subtotal=float(i.subtotal),
                )
                for i in order.items
            ],
        )
