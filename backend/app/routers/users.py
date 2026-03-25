from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from firebase_admin import auth as firebase_auth

from app.dependencies.auth import require_role, CurrentUser
from app.dependencies.db import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserRoleUpdate

router = APIRouter(prefix="/users", tags=["users"])

admin_only = require_role("admin")


@router.get("", response_model=list[UserResponse])
def list_users(
    role: str | None = Query(None),
    is_active: bool | None = Query(None),
    skip: int = 0,
    limit: int = 50,
    _: CurrentUser = Depends(admin_only),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    return query.offset(skip).limit(limit).all()


@router.get("/{uid}", response_model=UserResponse)
def get_user(
    uid: str,
    _: CurrentUser = Depends(admin_only),
    db: Session = Depends(get_db),
):
    user = db.get(User, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


@router.patch("/{uid}/role", response_model=UserResponse)
def update_role(
    uid: str,
    body: UserRoleUpdate,
    _: CurrentUser = Depends(admin_only),
    db: Session = Depends(get_db),
):
    user = db.get(User, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.role = body.role
    db.commit()
    db.refresh(user)
    # Update Firebase custom claim
    firebase_auth.set_custom_user_claims(uid, {"role": body.role})
    return user


@router.patch("/{uid}/status", response_model=UserResponse)
def update_status(
    uid: str,
    is_active: bool,
    _: CurrentUser = Depends(admin_only),
    db: Session = Depends(get_db),
):
    user = db.get(User, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    if not is_active:
        firebase_auth.revoke_refresh_tokens(uid)
    return user


@router.delete("/{uid}", status_code=204)
def delete_user(
    uid: str,
    _: CurrentUser = Depends(admin_only),
    db: Session = Depends(get_db),
):
    user = db.get(User, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    db.delete(user)
    db.commit()
    try:
        firebase_auth.delete_user(uid)
    except Exception:
        pass  # Firebase user may already be gone
