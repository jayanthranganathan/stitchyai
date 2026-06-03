"""Delivery service."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.delivery import DeliveryProfile, VehicleType
from app.models.tailor import ApprovalState
from app.modules.delivery.repository import DeliveryRepository
from app.modules.delivery.schemas import DeliveryMe, DeliveryRegister, StatusUpdate


class DeliveryService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = DeliveryRepository(db)

    def register(self, user_id: uuid.UUID, body: DeliveryRegister) -> DeliveryMe:
        if self.repo.get_by_user(user_id):
            raise ConflictError("Already registered as a delivery partner")
        profile = DeliveryProfile(
            user_id=user_id,
            vehicle_type=VehicleType(body.vehicle_type),
            license_url=body.license_url,
            documents=body.documents,
            city=body.city,
            approval_state=ApprovalState.UNDER_REVIEW,
        )
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return self._to_me(profile)

    def me(self, user_id: uuid.UUID) -> DeliveryMe:
        profile = self.repo.get_by_user(user_id)
        if not profile:
            raise NotFoundError("Delivery profile not found")
        return self._to_me(profile)

    def set_status(self, user_id: uuid.UUID, body: StatusUpdate) -> DeliveryMe:
        profile = self.repo.get_by_user(user_id)
        if not profile:
            raise NotFoundError("Delivery profile not found")
        profile.is_online = body.is_online
        self.db.commit()
        return self._to_me(profile)

    @staticmethod
    def _to_me(profile: DeliveryProfile) -> DeliveryMe:
        return DeliveryMe(
            id=str(profile.id),
            user_id=str(profile.user_id),
            vehicle_type=profile.vehicle_type.value,
            approval_state=profile.approval_state.value,
            is_online=profile.is_online,
            city=profile.city,
        )
