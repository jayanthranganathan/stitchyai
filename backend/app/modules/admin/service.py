"""Admin service — approvals queue, order assignment, admin user CRUD."""

from __future__ import annotations

import contextlib
import uuid

from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import NotFoundError, ValidationError
from app.models.delivery import DeliveryProfile
from app.models.order import Order, OrderStatus, OrderStatusHistory
from app.models.tailor import (
    ApprovalState,
    AssignmentState,
    OrderAssignment,
    TailorInterest,
    TailorProfile,
)
from app.models.user import CustomerProfile
from app.modules.admin.repository import AdminRepository
from app.modules.admin.schemas import (
    AdminCreate,
    AdminOrderItem,
    AdminOrderPublic,
    AdminPublic,
    ApprovalDecision,
    AssignTailor,
    PendingApproval,
)


class AdminService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = AdminRepository(db)

    # ── Orders ────────────────────────────────────────────────────────────────

    def list_orders(self, status: str | None) -> list[AdminOrderPublic]:
        query = (
            self.db.query(Order)
            .options(
                joinedload(Order.customer).joinedload(CustomerProfile.user),
                joinedload(Order.items),
                joinedload(Order.assignments).joinedload(OrderAssignment.tailor).joinedload(TailorProfile.user),
            )
        )
        if status:
            with contextlib.suppress(ValueError):
                query = query.filter(Order.status == OrderStatus(status))
        orders = query.order_by(Order.created_at.desc()).all()
        return [self._order_to_public(o) for o in orders]

    def approve_order(self, order_id: uuid.UUID) -> None:
        """Admin approves a placed order → moves to 'confirmed', now visible to tailors."""
        order = self.db.get(Order, order_id)
        if order is None:
            raise NotFoundError("Order not found")
        if order.status != OrderStatus.PLACED:
            raise ValidationError(
                f"Order is '{order.status.value}' — only 'placed' orders can be approved"
            )
        order.status = OrderStatus.CONFIRMED
        self.db.add(OrderStatusHistory(
            order_id=order.id,
            status=OrderStatus.CONFIRMED,
            progress_percent=order.progress_percent,
            note="Order approved by admin — open for tailor interest",
            actor_role="admin",
        ))
        self.db.commit()

    def assign_order(self, order_id: uuid.UUID, body: AssignTailor) -> None:
        """Assign a tailor to a confirmed order → moves order to 'assigned'."""
        order = self.db.get(Order, order_id)
        if order is None:
            raise NotFoundError("Order not found")
        if order.status != OrderStatus.CONFIRMED:
            raise ValidationError(
                f"Order is '{order.status.value}' — only 'confirmed' orders can be assigned"
            )

        tailor = self.db.get(TailorProfile, uuid.UUID(body.tailor_id))
        if tailor is None:
            raise NotFoundError("Tailor profile not found")
        if tailor.approval_state != ApprovalState.APPROVED:
            raise ValidationError("Tailor is not approved yet")

        # Create the assignment
        assignment = OrderAssignment(
            order_id=order.id,
            tailor_id=tailor.id,
            state=AssignmentState.ACCEPTED,
            progress_percent=0,
            agreed_delivery_date=order.expected_delivery_date,
        )
        self.db.add(assignment)

        # Advance order status
        order.status = OrderStatus.ASSIGNED
        order.progress_percent = 15

        # Append history entry
        self.db.add(OrderStatusHistory(
            order_id=order.id,
            status=OrderStatus.ASSIGNED,
            progress_percent=15,
            note="Assigned to tailor by admin",
            actor_role="admin",
        ))

        self.db.commit()

    # ── Approvals ─────────────────────────────────────────────────────────────

    def pending_approvals(self, kind: str | None) -> list[PendingApproval]:
        results: list[PendingApproval] = []

        if kind in (None, "order"):
            # Placed orders = awaiting admin approval
            results.extend(self._placed_orders())
            # Confirmed orders = awaiting tailor assignment
            results.extend(self._confirmed_orders())

        if kind in (None, "tailor"):
            results.extend(self._pending_tailors())

        if kind in (None, "delivery"):
            results.extend(self._pending_delivery())

        return results

    def _placed_orders(self) -> list[PendingApproval]:
        """Orders waiting for admin approval (placed → confirmed)."""
        orders = (
            self.db.query(Order)
            .options(joinedload(Order.customer).joinedload(CustomerProfile.user))
            .filter(Order.status == OrderStatus.PLACED)
            .order_by(Order.placed_at)
            .all()
        )
        out = []
        for o in orders:
            customer_name = (
                o.customer.user.full_name if o.customer and o.customer.user else None
            )
            out.append(PendingApproval(
                kind="order",
                id=str(o.id),
                name=f"Order #{str(o.id)[:8]} — {customer_name or 'Unknown'}",
                submitted_at=(o.placed_at or o.created_at).isoformat(),
                details={
                    "action": "approve",          # tells the UI which button to show
                    "order_status": "placed",
                    "total_amount": float(o.total_amount),
                    "currency": o.currency,
                    "customer_name": customer_name,
                    "expected_delivery_date": (
                        o.expected_delivery_date.isoformat()
                        if o.expected_delivery_date else None
                    ),
                },
            ))
        return out

    def _confirmed_orders(self) -> list[PendingApproval]:
        """Admin-confirmed orders waiting for tailor assignment."""
        orders = (
            self.db.query(Order)
            .options(
                joinedload(Order.customer).joinedload(CustomerProfile.user),
                joinedload(Order.tailor_interests)
                    .joinedload(TailorInterest.tailor)
                    .joinedload(TailorProfile.user),
            )
            .filter(Order.status == OrderStatus.CONFIRMED)
            .order_by(Order.placed_at)
            .all()
        )
        out = []
        for o in orders:
            customer_name = (
                o.customer.user.full_name if o.customer and o.customer.user else None
            )
            interests = [
                {
                    "tailor_id": str(i.tailor_id),
                    "tailor_name": i.tailor.user.full_name if (i.tailor and i.tailor.user) else None,
                    "note": i.note,
                    "expected_delivery_date": (
                        i.expected_delivery_date.isoformat()
                        if i.expected_delivery_date else None
                    ),
                }
                for i in o.tailor_interests
            ]
            out.append(PendingApproval(
                kind="order",
                id=str(o.id),
                name=f"Order #{str(o.id)[:8]} — {customer_name or 'Unknown'}",
                submitted_at=(o.placed_at or o.created_at).isoformat(),
                details={
                    "action": "assign",            # tells the UI to show tailor list
                    "order_status": "confirmed",
                    "total_amount": float(o.total_amount),
                    "currency": o.currency,
                    "customer_name": customer_name,
                    "expected_delivery_date": (
                        o.expected_delivery_date.isoformat()
                        if o.expected_delivery_date else None
                    ),
                    "interests": interests,
                },
            ))
        return out

    def _pending_tailors(self) -> list[PendingApproval]:
        tailors = (
            self.db.query(TailorProfile)
            .options(joinedload(TailorProfile.user))
            .filter(TailorProfile.approval_state == ApprovalState.UNDER_REVIEW)
            .order_by(TailorProfile.created_at)
            .all()
        )
        return [
            PendingApproval(
                kind="tailor",
                id=str(t.id),
                name=t.user.full_name if t.user else None,
                submitted_at=t.created_at.isoformat(),
                details={
                    "city": t.city,
                    "bio": t.bio,
                    "approval_state": t.approval_state.value,
                },
            )
            for t in tailors
        ]

    def _pending_delivery(self) -> list[PendingApproval]:
        partners = (
            self.db.query(DeliveryProfile)
            .options(joinedload(DeliveryProfile.user))
            .filter(DeliveryProfile.approval_state == ApprovalState.UNDER_REVIEW)
            .order_by(DeliveryProfile.created_at)
            .all()
        )
        return [
            PendingApproval(
                kind="delivery",
                id=str(d.id),
                name=d.user.full_name if d.user else None,
                submitted_at=d.created_at.isoformat(),
                details={
                    "city": d.city,
                    "vehicle_type": d.vehicle_type.value,
                    "approval_state": d.approval_state.value,
                },
            )
            for d in partners
        ]

    def approve_tailor(self, tailor_id: uuid.UUID, decision: ApprovalDecision) -> None:
        tailor = self.db.get(TailorProfile, tailor_id)
        if tailor is None:
            raise NotFoundError("Tailor not found")
        tailor.approval_state = (
            ApprovalState.APPROVED if decision.approve else ApprovalState.REJECTED
        )
        self.db.commit()

    def approve_delivery(self, partner_id: uuid.UUID, decision: ApprovalDecision) -> None:
        partner = self.db.get(DeliveryProfile, partner_id)
        if partner is None:
            raise NotFoundError("Delivery partner not found")
        partner.approval_state = (
            ApprovalState.APPROVED if decision.approve else ApprovalState.REJECTED
        )
        self.db.commit()

    # ── Admin user CRUD ───────────────────────────────────────────────────────

    def create_admin(self, body: AdminCreate) -> AdminPublic:
        # TODO: create UserAccount + AdminProfile
        raise NotImplementedError

    def list_admins(self) -> list[AdminPublic]:
        items = self.repo.list_admins()
        return [
            AdminPublic(
                id=str(a.id),
                full_name=a.user.full_name or "",
                phone=a.user.phone,
                email=a.user.email,
                role=a.role.value,
                permissions=list(a.permissions or []),
            )
            for a in items
        ]

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _order_to_public(order: Order) -> AdminOrderPublic:
        customer_name: str | None = None
        if order.customer and order.customer.user:
            customer_name = order.customer.user.full_name

        tailor_name: str | None = None
        for assignment in order.assignments:
            if assignment.state.value in ("accepted", "completed"):
                if assignment.tailor and assignment.tailor.user:
                    tailor_name = assignment.tailor.user.full_name
                break

        return AdminOrderPublic(
            id=str(order.id),
            status=order.status.value,
            progress_percent=order.progress_percent,
            total_amount=float(order.total_amount),
            currency=order.currency,
            placed_at=order.placed_at.isoformat() if order.placed_at else None,
            expected_delivery_date=(
                order.expected_delivery_date.isoformat()
                if order.expected_delivery_date else None
            ),
            customer_name=customer_name,
            tailor_name=tailor_name,
            items=[
                AdminOrderItem(
                    id=str(i.id),
                    category_id=str(i.category_id),
                    design_id=str(i.design_id) if i.design_id else None,
                    quantity=i.quantity,
                    unit_price=float(i.unit_price),
                    subtotal=float(i.subtotal),
                )
                for i in order.items
            ],
        )
