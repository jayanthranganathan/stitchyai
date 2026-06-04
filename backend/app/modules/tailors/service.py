"""Tailors service — registration, interest, progress, self reports."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.order import Order, OrderItem, OrderStatus
from app.models.tailor import (
    ApprovalState,
    AssignmentState,
    OrderAssignment,
    TailorInterest,
    TailorProfile,
)
from app.models.user import CustomerProfile
from app.modules.tailors.repository import TailorsRepository
from app.modules.tailors.schemas import (
    InterestCreate,
    ProgressUpdate,
    TailorMe,
    TailorOrderSummary,
    TailorRegister,
)


class TailorsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = TailorsRepository(db)

    def register(self, user_id: uuid.UUID, body: TailorRegister) -> TailorMe:
        if self.repo.get_by_user(user_id):
            raise ConflictError("Already registered as a tailor")
        expertise = self.repo.find_expertise(body.expertise_slugs)
        if len(expertise) != len(body.expertise_slugs):
            raise ValidationError("Unknown expertise slug(s)")
        profile = TailorProfile(
            user_id=user_id,
            bio=body.bio,
            city=body.city,
            documents=body.documents,
            approval_state=ApprovalState.UNDER_REVIEW,
        )
        profile.expertise = expertise
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return self._to_me(profile)

    def me(self, user_id: uuid.UUID) -> TailorMe:
        profile = self.repo.get_by_user(user_id)
        if not profile:
            raise NotFoundError("Tailor profile not found")
        return self._to_me(profile)

    def my_orders(self, user_id: uuid.UUID) -> list[TailorOrderSummary]:
        """Orders assigned to this tailor (active + completed)."""
        profile = self.repo.get_by_user(user_id)
        if not profile:
            raise NotFoundError("Tailor profile not found")
        assignments = (
            self.db.query(OrderAssignment)
            .options(
                joinedload(OrderAssignment.order).joinedload(Order.items).joinedload(OrderItem.design),
                joinedload(OrderAssignment.order).joinedload(Order.customer).joinedload(CustomerProfile.user),
            )
            .filter(
                OrderAssignment.tailor_id == profile.id,
                OrderAssignment.state != AssignmentState.CANCELLED,
            )
            .order_by(OrderAssignment.created_at.desc())
            .all()
        )
        return [self._assignment_to_summary(a) for a in assignments]

    def available_orders(self, user_id: uuid.UUID) -> list[TailorOrderSummary]:
        """Admin-confirmed orders open for tailor interest expressions."""
        profile = self.repo.get_by_user(user_id)
        if not profile:
            raise NotFoundError("Tailor profile not found")
        if profile.approval_state != ApprovalState.APPROVED:
            raise ValidationError("Tailor is not approved yet")

        orders = (
            self.db.query(Order)
            .options(
                joinedload(Order.items).joinedload(OrderItem.design),
                joinedload(Order.customer).joinedload(CustomerProfile.user),
            )
            .filter(Order.status == OrderStatus.CONFIRMED)
            .order_by(Order.placed_at)
            .all()
        )
        return [self._order_to_summary(o) for o in orders]

    def express_interest(self, user_id: uuid.UUID, body: InterestCreate) -> None:
        profile = self.repo.get_by_user(user_id)
        if not profile or profile.approval_state != ApprovalState.APPROVED:
            raise ValidationError("Tailor is not approved")
        order = self.db.get(Order, uuid.UUID(body.order_id))
        if not order or order.status != OrderStatus.CONFIRMED:
            raise ValidationError("Order is not open for interest")
        self.db.add(
            TailorInterest(
                order_id=uuid.UUID(body.order_id),
                tailor_id=profile.id,
                note=body.note,
                expected_delivery_date=body.expected_delivery_date,
            )
        )
        self.db.commit()

    def update_progress(
        self, user_id: uuid.UUID, order_id: uuid.UUID, body: ProgressUpdate
    ) -> None:
        # TODO: lookup OrderAssignment, advance progress + write OrderStatusHistory
        raise NotImplementedError

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _to_me(profile: TailorProfile) -> TailorMe:
        return TailorMe(
            id=str(profile.id),
            user_id=str(profile.user_id),
            bio=profile.bio,
            city=profile.city,
            approval_state=profile.approval_state.value,
            expertise=[e.slug for e in profile.expertise],
            rating=float(profile.rating) if profile.rating is not None else None,
        )

    @staticmethod
    def _assignment_to_summary(a: OrderAssignment) -> TailorOrderSummary:
        o = a.order
        first_item = o.items[0] if o.items else None
        design_name = first_item.design.name if (first_item and first_item.design) else None
        customer_name = o.customer.user.full_name if (o.customer and o.customer.user) else None
        return TailorOrderSummary(
            id=str(o.id),
            status=o.status.value,
            progress_percent=a.progress_percent,
            expected_delivery_date=o.expected_delivery_date,
            placed_at=o.placed_at.isoformat() if o.placed_at else None,
            total_amount=float(o.total_amount),
            currency=o.currency,
            design_name=design_name,
            customer_name=customer_name,
            notes=o.notes,
        )

    @staticmethod
    def _order_to_summary(o: Order) -> TailorOrderSummary:
        first_item = o.items[0] if o.items else None
        design_name = first_item.design.name if (first_item and first_item.design) else None
        customer_name = o.customer.user.full_name if (o.customer and o.customer.user) else None
        return TailorOrderSummary(
            id=str(o.id),
            status=o.status.value,
            progress_percent=o.progress_percent,
            expected_delivery_date=o.expected_delivery_date,
            placed_at=o.placed_at.isoformat() if o.placed_at else None,
            total_amount=float(o.total_amount),
            currency=o.currency,
            design_name=design_name,
            customer_name=customer_name,
            notes=o.notes,
        )
