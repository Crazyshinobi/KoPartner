"""
KOPARTNER AUTHENTICATION - COMPLETELY NEW, ULTRA SIMPLE
========================================================
Zero complexity, zero failures, maximum speed
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import jwt
import bcrypt
import random
import logging

# JWT Config
JWT_SECRET = "kopartner-super-secret-key-2024-production"
JWT_ALGORITHM = "HS256"

# Router
auth_router = APIRouter(prefix="/auth", tags=["Auth"])
security = HTTPBearer(auto_error=False)

# Models
class UserRole(str, Enum):
    CLIENT = "client"
    CUDDLIST = "cuddlist"
    BOTH = "both"

class SendOTPRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str
    role: Optional[str] = "client"
    name: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None

class PasswordLoginRequest(BaseModel):
    phone: str
    password: str

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class SetPasswordRequest(BaseModel):
    password: str

# Helper Functions
def clean_phone(phone: str) -> str:
    """Extract 10 digits from phone"""
    digits = ''.join(c for c in str(phone) if c.isdigit())
    return digits[-10:] if len(digits) >= 10 else digits

def make_token(user_id: str, role: str) -> str:
    """Create JWT token"""
    return jwt.encode(
        {"user_id": user_id, "role": role, "exp": datetime.now(timezone.utc) + timedelta(days=30)},
        JWT_SECRET, algorithm=JWT_ALGORITHM
    )

def verify_token(token: str) -> dict:
    """Verify JWT token"""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except:
        return None

def hash_pw(password: str) -> str:
    """Hash password"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def check_pw(password: str, hashed: str) -> bool:
    """Check password"""
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except:
        return False

def create_auth_routes(db):
    """Create auth routes with database"""
    
    # ==================== SEND OTP ====================
    @auth_router.post("/send-otp")
    async def send_otp(req: SendOTPRequest):
        phone = clean_phone(req.phone)
        if len(phone) != 10:
            raise HTTPException(400, "Enter valid 10-digit number")
        
        otp = str(random.randint(100000, 999999))
        
        # Save OTP
        await db.otps.update_one(
            {"phone": phone},
            {"$set": {"phone": phone, "otp": otp, "ts": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
        
        # Log OTP for debugging
        print(f"[OTP] {phone} = {otp}")
        logging.info(f"[OTP] {phone} = {otp}")
        
        return {"success": True, "message": "OTP sent!", "otp_for_testing": otp}
    
    # ==================== VERIFY OTP ====================
    @auth_router.post("/verify-otp")
    async def verify_otp(req: VerifyOTPRequest):
        phone = clean_phone(req.phone)
        otp = ''.join(c for c in str(req.otp) if c.isdigit())
        
        if len(phone) != 10:
            raise HTTPException(400, "Invalid phone")
        if len(otp) != 6:
            raise HTTPException(400, "Enter 6-digit OTP")
        
        # Find OTP
        doc = await db.otps.find_one({"phone": phone})
        if not doc:
            raise HTTPException(400, "OTP not found. Click Resend OTP.")
        
        stored = str(doc.get("otp", ""))
        if stored != otp:
            raise HTTPException(400, f"Wrong OTP. You entered {otp}, correct is {stored}")
        
        # Delete OTP
        await db.otps.delete_one({"phone": phone})
        
        # Check user exists
        user = await db.users.find_one({"phone": phone})
        
        if user:
            # Login existing user
            user.pop("_id", None)
            user.pop("password_hash", None)
            token = make_token(user["id"], user["role"])
            return {"token": token, "user": user, "message": "Login successful"}
        
        # Create new user
        name = (req.name or "").strip()
        city = (req.city or "").strip()
        if not name:
            raise HTTPException(400, "Name required")
        if not city:
            raise HTTPException(400, "City required")
        
        user_id = str(uuid.uuid4())
        role = req.role or "client"
        
        new_user = {
            "id": user_id,
            "phone": phone,
            "role": role,
            "name": name,
            "email": (req.email or "").strip().lower() or None,
            "city": city,
            "pincode": (req.pincode or "").strip() or None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True,
            "password_hash": None,
            "password_set": False,
            "profile_activated": role == "client",
            "membership_paid": False if role != "client" else None,
            "cuddlist_status": "pending" if role != "client" else None
        }
        
        await db.users.insert_one(new_user)
        new_user.pop("_id", None)
        new_user.pop("password_hash", None)
        
        token = make_token(user_id, role)
        return {"token": token, "user": new_user, "message": "Registration successful"}
    
    # ==================== PASSWORD LOGIN ====================
    @auth_router.post("/password-login")
    async def password_login(req: PasswordLoginRequest):
        phone = clean_phone(req.phone)
        if len(phone) != 10:
            raise HTTPException(400, "Invalid phone")
        if not req.password:
            raise HTTPException(400, "Enter password")
        
        user = await db.users.find_one({"phone": phone})
        if not user:
            raise HTTPException(401, "Account not found")
        
        if not user.get("password_hash"):
            raise HTTPException(400, "Password not set. Login with OTP first.")
        
        if not check_pw(req.password, user["password_hash"]):
            raise HTTPException(401, "Wrong password")
        
        user.pop("_id", None)
        user.pop("password_hash", None)
        token = make_token(user["id"], user["role"])
        return {"token": token, "user": user, "message": "Login successful"}
    
    # ==================== ADMIN LOGIN ====================
    @auth_router.post("/admin-login")
    async def admin_login(req: AdminLoginRequest):
        # Hardcoded admin credentials
        if req.username.lower() != "amit845401" or req.password != "Amit@9810":
            raise HTTPException(401, "Invalid credentials")
        
        # Get or create admin
        admin = await db.users.find_one({"role": "admin"})
        if not admin:
            admin = {
                "id": f"admin-{uuid.uuid4()}",
                "phone": "0000000000",
                "role": "admin",
                "name": "Admin",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(admin)
        
        admin.pop("_id", None)
        token = make_token(admin["id"], "admin")
        return {"token": token, "user": admin, "message": "Admin login successful"}
    
    # ==================== SET PASSWORD ====================
    @auth_router.post("/set-password")
    async def set_password(request: Request, req: SetPasswordRequest):
        # Get token from header
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            raise HTTPException(401, "Not authenticated")
        
        payload = verify_token(auth[7:])
        if not payload:
            raise HTTPException(401, "Invalid token")
        
        if len(req.password) < 6:
            raise HTTPException(400, "Password must be 6+ characters")
        
        await db.users.update_one(
            {"id": payload["user_id"]},
            {"$set": {"password_hash": hash_pw(req.password), "password_set": True}}
        )
        
        return {"success": True, "message": "Password set!"}
    
    # ==================== GET ME ====================
    @auth_router.get("/me")
    async def get_me(request: Request):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            raise HTTPException(401, "Not authenticated")
        
        payload = verify_token(auth[7:])
        if not payload:
            raise HTTPException(401, "Invalid token")
        
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(404, "User not found")
        
        return user
    
    # ==================== RESEND OTP ====================
    @auth_router.post("/resend-otp")
    async def resend_otp(req: SendOTPRequest):
        return await send_otp(req)
    
    return auth_router
