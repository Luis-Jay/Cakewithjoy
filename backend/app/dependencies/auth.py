from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from app.config import settings

# Initialize Firebase Admin SDK once
if not firebase_admin._apps:
    cred = credentials.Certificate(settings.firebase_service_account_path)
    firebase_admin.initialize_app(cred)

bearer_scheme = HTTPBearer(auto_error=False)


class CurrentUser:
    def __init__(self, uid: str, email: str, role: str):
        self.uid = uid
        self.email = email
        self.role = role


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        decoded = firebase_auth.verify_id_token(credentials.credentials)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    role = decoded.get("role", "customer")
    return CurrentUser(
        uid=decoded["uid"],
        email=decoded.get("email", ""),
        role=role,
    )


def require_role(*roles: str):
    """Factory that returns a dependency enforcing the given roles."""
    def check(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user
    return check
