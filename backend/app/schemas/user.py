from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Literal


UserRole = Literal["customer", "staff", "admin"]


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: str | None = None
    avatar_url: str | None = None


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserResponse(UserBase):
    id: str
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SyncRequest(BaseModel):
    full_name: str
    phone: str | None = None
