"""Importing this package registers every model on ``Base.metadata``.

Alembic relies on this for autogenerate.
"""

from app.models.admin import AdminProfile
from app.models.catalog import Category, Design, DesignProposal
from app.models.credit import CreditTransaction
from app.models.delivery import DeliveryAssignment, DeliveryProfile, LocationPing
from app.models.notification import FcmToken, Notification
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.payment import Payment
from app.models.tailor import OrderAssignment, TailorExpertise, TailorInterest, TailorProfile
from app.models.user import CustomerProfile, UserAccount

__all__ = [
    "AdminProfile",
    "Category",
    "CreditTransaction",
    "CustomerProfile",
    "DeliveryAssignment",
    "DeliveryProfile",
    "Design",
    "DesignProposal",
    "FcmToken",
    "LocationPing",
    "Notification",
    "Order",
    "OrderAssignment",
    "OrderItem",
    "OrderStatusHistory",
    "Payment",
    "TailorExpertise",
    "TailorInterest",
    "TailorProfile",
    "UserAccount",
]
