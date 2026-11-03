from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth import get_password_hash, user_has_plan_access
from app.database import Base
from app.main import get_my_profile, login
from app.models import PaymentOrder, User
from app.schemas import UserLogin


def make_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    return sessionmaker(bind=engine)()


def add_user(db, *, role="user"):
    user = User(
        first_name="Plan",
        email=f"{role}@example.com",
        password_hash=get_password_hash("strong-password"),
        role=role,
        credits_balance=2,
        is_email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def add_order(db, user, status):
    order = PaymentOrder(
        user_id=user.id,
        plan_id="starter",
        plan_name="Starter Pack",
        razorpay_order_id=f"order_{status}",
        razorpay_payment_id=f"payment_{status}" if status == "verified" else None,
        credits_purchased=5,
        amount_paid=10000,
        currency="INR",
        status=status,
    )
    db.add(order)
    db.commit()
    return order


def test_welcome_credits_do_not_unlock_plan_access():
    db = make_session()
    try:
        user = add_user(db)
        assert user.credits_balance == 2
        assert user_has_plan_access(db, user) is False

        add_order(db, user, "created")
        assert user_has_plan_access(db, user) is False
    finally:
        db.close()


def test_verified_payment_unlocks_login_and_profile_access():
    db = make_session()
    try:
        user = add_user(db)
        add_order(db, user, "verified")

        token = login(
            UserLogin(email=user.email, password="strong-password"),
            db,
        )
        profile = get_my_profile(db, user)

        assert token["has_plan_access"] is True
        assert profile["has_plan_access"] is True
    finally:
        db.close()


def test_admin_access_does_not_require_a_payment():
    db = make_session()
    try:
        admin = add_user(db, role="admin")
        assert user_has_plan_access(db, admin) is True
    finally:
        db.close()
