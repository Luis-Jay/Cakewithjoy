from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from firebase_admin import auth as firebase_auth

from app.dependencies.auth import get_current_user, CurrentUser
from app.dependencies.db import get_db
from app.models.user import User
from app.schemas.user import UserResponse, SyncRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/sync", response_model=UserResponse, status_code=status.HTTP_200_OK)
def sync_user(
    body: SyncRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Called after Firebase sign-up or sign-in to ensure the user exists in MySQL.
    Creates the record if it doesn't exist; updates name/phone if it does.
    """
    user = db.get(User, current_user.uid)

    if user is None:
        user = User(
            id=current_user.uid,
            email=current_user.email,
            full_name=body.full_name,
            phone=body.phone,
            role="customer",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update mutable fields
        user.full_name = body.full_name
        if body.phone is not None:
            user.phone = body.phone
        db.commit()
        db.refresh(user)

    # Stamp custom claim with role so the frontend can read it from the token
    firebase_auth.set_custom_user_claims(current_user.uid, {"role": user.role})

    return user


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the authenticated user's full profile from MySQL."""
    user = db.get(User, current_user.uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Call /auth/sync first.")
    return user


@router.patch("/me", response_model=UserResponse)
def update_me(
    body: dict,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update display name, phone, or avatar for the authenticated user."""
    user = db.get(User, current_user.uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    allowed = {"full_name", "phone", "avatar_url"}
    for key, value in body.items():
        if key in allowed:
            setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user
