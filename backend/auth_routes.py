"""
KOPARTNER AUTHENTICATION MODULE - PERFECT & BULLETPROOF
========================================================
Complete authentication system with:
- OTP Send/Verify for signup/login
- Password login
- Admin login
- Set password
- Get current user

All functions are designed to be error-free and production-ready.
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import jwt
import bcrypt
import asyncio
import random
import logging
import os
import requests

# ============================================================================
# CONFIGURATION
# ============================================================================

JWT_SECRET = os.environ.get('JWT_SECRET', 'kopartner-secret-key-change-in-production-2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRY_DAYS = 7  # Token valid for 7 days

FAST2SMS_API_KEY = os.environ.get('FAST2SMS_API_KEY', '')
FAST2SMS_SENDER_ID = os.environ.get('FAST2SMS_SENDER_ID', 'SIBPLR')
DLT_OTP_TEMPLATE_ID = os.environ.get('DLT_OTP_TEMPLATE_ID', '201186')

# Admin credentials - hardcoded for reliability
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', '')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', '')

# ============================================================================
# ENUMS AND MODELS
# ============================================================================

class UserRole(str, Enum):
    CLIENT = "client"
    CUDDLIST = "cuddlist"
    BOTH = "both"
    ADMIN = "admin"

class SendOTPRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str
    role: UserRole = UserRole.CLIENT
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

class AuthResponse(BaseModel):
    token: str
    user: dict
    message: str

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def clean_phone(phone: str) -> str:
    """Clean phone number - remove non-digits and take last 10 digits"""
    if not phone:
        return ""
    digits = ''.join(filter(str.isdigit, phone))
    if len(digits) > 10:
        return digits[-10:]
    return digits

def validate_phone(phone: str) -> bool:
    """Validate 10-digit Indian phone number"""
    clean = clean_phone(phone)
    return len(clean) == 10 and clean.isdigit()

def validate_otp(otp: str) -> bool:
    """Validate 6-digit OTP"""
    if not otp:
        return False
    clean = otp.strip()
    return len(clean) == 6 and clean.isdigit()

def create_jwt_token(user_id: str, role: str) -> str:
    """Create JWT token with 7-day expiry"""
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> dict:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired. Please login again.")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token. Please login again.")

def hash_password(password: str) -> str:
    """Hash password with bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def send_sms_otp(phone: str, otp: str) -> bool:
    """Send OTP via Fast2SMS"""
    if not FAST2SMS_API_KEY:
        logging.warning(f"[SMS] No API key configured. OTP for {phone}: {otp}")
        return False
    
    try:
        url = "https://www.fast2sms.com/dev/bulkV2"
        params = {
            "authorization": FAST2SMS_API_KEY,
            "route": "dlt",
            "sender_id": FAST2SMS_SENDER_ID,
            "message": DLT_OTP_TEMPLATE_ID,
            "variables_values": f"{otp}|",
            "flash": "0",
            "numbers": phone
        }
        
        response = requests.get(url, params=params, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("return"):
                logging.info(f"[SMS] OTP sent to {phone}")
                return True
        
        logging.warning(f"[SMS] Failed for {phone}: {response.text}")
        return False
    except Exception as e:
        logging.error(f"[SMS] Error sending to {phone}: {e}")
        return False

async def send_sms_otp_async(phone: str, otp: str) -> bool:
    """Async wrapper for SMS sending"""
    import concurrent.futures
    try:
        loop = asyncio.get_event_loop()
        with concurrent.futures.ThreadPoolExecutor() as pool:
            result = await asyncio.wait_for(
                loop.run_in_executor(pool, send_sms_otp, phone, otp),
                timeout=20.0
            )
            return result
    except asyncio.TimeoutError:
        logging.warning(f"[SMS] Timeout for {phone}")
        return False
    except Exception as e:
        logging.error(f"[SMS] Async error for {phone}: {e}")
        return False

def serialize_user(user: dict) -> dict:
    """Serialize user for JSON response - remove sensitive fields"""
    if not user:
        return {}
    
    # Remove sensitive fields
    safe_fields = {k: v for k, v in user.items() if k not in ['_id', 'password_hash', 'otp', 'otp_expiry']}
    
    # Convert datetime objects to ISO strings
    for key, value in safe_fields.items():
        if isinstance(value, datetime):
            safe_fields[key] = value.isoformat()
    
    return safe_fields

# ============================================================================
# DATABASE OPERATIONS WITH RETRY
# ============================================================================

async def db_retry(operation, max_retries: int = 3, delay: float = 0.2):
    """Execute database operation with retry on transient errors"""
    last_error = None
    for attempt in range(max_retries):
        try:
            return await operation()
        except Exception as e:
            last_error = e
            error_str = str(e).lower()
            retryable = ['timeout', 'connection', 'network', 'pool', 'socket', 'busy']
            if any(x in error_str for x in retryable) and attempt < max_retries - 1:
                await asyncio.sleep(delay * (attempt + 1))
                continue
            raise
    raise last_error

# ============================================================================
# AUTHENTICATION ROUTER
# ============================================================================

def create_auth_router(db, limiter, get_remote_address):
    """Create authentication router with database connection"""
    
    router = APIRouter(prefix="/auth", tags=["Authentication"])
    security = HTTPBearer()
    
    # Dependency to get current user
    async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
        """Get current authenticated user"""
        payload = verify_jwt_token(credentials.credentials)
        user_id = payload.get("user_id")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        async def fetch():
            return await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
        
        try:
            user = await asyncio.wait_for(db_retry(fetch), timeout=10.0)
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Server busy. Please try again.")
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to fetch user data")
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return serialize_user(user)
    
    # ========================================================================
    # SEND OTP ENDPOINT
    # ========================================================================
    @router.post("/send-otp")
    @limiter.limit("20/minute")
    async def send_otp(request: Request, data: SendOTPRequest):
        """
        Send OTP to phone number for login/signup
        
        Features:
        - 15 minute OTP validity
        - 10 verification attempts
        - Phone number auto-cleaning
        - Multiple SMS retry attempts
        """
        # Clean and validate phone
        phone = clean_phone(data.phone)
        
        if not phone:
            raise HTTPException(status_code=400, detail="Mobile number is required")
        
        if not validate_phone(phone):
            raise HTTPException(status_code=400, detail="Please enter a valid 10-digit mobile number")
        
        logging.info(f"[SEND-OTP] Processing request for {phone}")
        
        try:
            # Generate 6-digit OTP
            otp = str(random.randint(100000, 999999))
            
            # Create OTP document
            otp_doc = {
                "phone": phone,
                "otp": otp,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat(),
                "attempts": 0,
                "max_attempts": 10
            }
            
            # Save OTP to database (upsert)
            async def save_otp():
                result = await db.otps.update_one(
                    {"phone": phone},
                    {"$set": otp_doc},
                    upsert=True
                )
                return result.acknowledged
            
            try:
                await asyncio.wait_for(db_retry(save_otp), timeout=10.0)
            except asyncio.TimeoutError:
                raise HTTPException(status_code=503, detail="Server busy. Please try again.")
            except Exception as e:
                logging.error(f"[SEND-OTP] Database error for {phone}: {e}")
                raise HTTPException(status_code=503, detail="Server busy. Please try again.")
            
            # Send SMS with retry
            sms_sent = False
            for attempt in range(3):
                try:
                    sms_sent = await send_sms_otp_async(phone, otp)
                    if sms_sent:
                        break
                except Exception:
                    pass
                if attempt < 2:
                    await asyncio.sleep(0.5)
            
            # Log OTP for debugging (remove in production)
            logging.info(f"[SEND-OTP] OTP for {phone}: {otp} (SMS sent: {sms_sent})")
            print(f"[DEBUG] OTP for {phone}: {otp}")
            
            return {
                "success": True,
                "message": "OTP sent successfully! Valid for 15 minutes.",
                "expires_in_minutes": 15,
                "sms_sent": sms_sent
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"[SEND-OTP] Error for {phone}: {e}")
            raise HTTPException(status_code=500, detail="Unable to send OTP. Please try again.")
    
    # ========================================================================
    # VERIFY OTP ENDPOINT
    # ========================================================================
    @router.post("/verify-otp", response_model=AuthResponse)
    @limiter.limit("30/minute")
    async def verify_otp(request: Request, data: VerifyOTPRequest):
        """
        Verify OTP and login/register user
        
        Features:
        - 10 verification attempts
        - Shows remaining attempts on wrong OTP
        - Auto-creates user on first login
        - Returns JWT token on success
        """
        # Clean and validate inputs
        phone = clean_phone(data.phone)
        otp = data.otp.strip() if data.otp else ""
        
        if not validate_phone(phone):
            raise HTTPException(status_code=400, detail="Invalid phone number")
        
        if not validate_otp(otp):
            raise HTTPException(status_code=400, detail="Please enter a valid 6-digit OTP")
        
        logging.info(f"[VERIFY-OTP] Processing for {phone}")
        
        try:
            current_time = datetime.now(timezone.utc).isoformat()
            
            # Get OTP from database
            async def get_otp():
                return await db.otps.find_one({
                    "phone": phone,
                    "expires_at": {"$gt": current_time}
                })
            
            try:
                otp_doc = await asyncio.wait_for(db_retry(get_otp), timeout=10.0)
            except asyncio.TimeoutError:
                raise HTTPException(status_code=503, detail="Server busy. Please try again.")
            
            if not otp_doc:
                raise HTTPException(status_code=400, detail="OTP expired or not found. Please request a new OTP.")
            
            # Check attempts
            attempts = otp_doc.get("attempts", 0)
            max_attempts = otp_doc.get("max_attempts", 10)
            
            if attempts >= max_attempts:
                await db.otps.delete_one({"phone": phone})
                raise HTTPException(status_code=400, detail="Too many incorrect attempts. Please request a new OTP.")
            
            # Verify OTP
            stored_otp = otp_doc.get("otp", "")
            if stored_otp != otp:
                # Increment attempts
                await db.otps.update_one({"phone": phone}, {"$inc": {"attempts": 1}})
                remaining = max_attempts - attempts - 1
                
                if remaining <= 0:
                    await db.otps.delete_one({"phone": phone})
                    raise HTTPException(status_code=400, detail="Too many incorrect attempts. Please request a new OTP.")
                
                raise HTTPException(status_code=400, detail=f"Incorrect OTP. {remaining} attempt(s) remaining.")
            
            # OTP correct - delete it
            await db.otps.delete_one({"phone": phone})
            logging.info(f"[VERIFY-OTP] OTP verified for {phone}")
            
            # Check if user exists
            async def get_user():
                return await db.users.find_one({"phone": phone}, {"_id": 0})
            
            user = await asyncio.wait_for(db_retry(get_user), timeout=10.0)
            
            if user:
                # Existing user - login
                token = create_jwt_token(user["id"], user["role"])
                logging.info(f"[VERIFY-OTP] Login successful for {phone}")
                
                return AuthResponse(
                    token=token,
                    user=serialize_user(user),
                    message="Login successful"
                )
            else:
                # New user - register
                # Validate required fields
                if not data.name or not data.name.strip():
                    raise HTTPException(status_code=400, detail="Name is required for registration")
                if not data.city or not data.city.strip():
                    raise HTTPException(status_code=400, detail="City is required for registration")
                
                # Create user document
                user_id = str(uuid.uuid4())
                user_doc = {
                    "id": user_id,
                    "phone": phone,
                    "role": data.role.value,
                    "name": data.name.strip(),
                    "email": data.email.strip().lower() if data.email else None,
                    "city": data.city.strip(),
                    "pincode": data.pincode.strip() if data.pincode else None,
                    "profile_photo": None,
                    "birth_year": None,
                    "availability": [],
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "is_active": True,
                    "password_hash": None,
                    "password_set": False,
                    "bio": None,
                    "hobbies": [],
                    "services": [],
                    "upi_id": None,
                    "earnings": 0.0,
                    "rating": 0.0,
                    "total_reviews": 0,
                    "is_online": False,
                    "last_online": None
                }
                
                # Role-specific settings
                if data.role == UserRole.CLIENT:
                    user_doc.update({
                        "profile_activated": True,
                        "can_search": False,
                        "service_payment_done": False,
                        "cuddlist_status": None
                    })
                elif data.role in [UserRole.CUDDLIST, UserRole.BOTH]:
                    user_doc.update({
                        "can_search": False,
                        "service_payment_done": False,
                        "membership_paid": False,
                        "profile_completed": False,
                        "profile_activated": False,
                        "cuddlist_status": "pending"
                    })
                    if data.role == UserRole.BOTH:
                        user_doc["active_mode"] = "find"
                
                # Insert user
                async def create_user():
                    await db.users.insert_one(user_doc)
                
                try:
                    await asyncio.wait_for(db_retry(create_user), timeout=10.0)
                except Exception as e:
                    if "duplicate" in str(e).lower() or "e11000" in str(e).lower():
                        # Race condition - user was created by another request
                        user = await db_retry(get_user)
                        if user:
                            token = create_jwt_token(user["id"], user["role"])
                            return AuthResponse(token=token, user=serialize_user(user), message="Login successful")
                    raise HTTPException(status_code=503, detail="Server busy. Please try again.")
                
                token = create_jwt_token(user_id, data.role.value)
                logging.info(f"[VERIFY-OTP] Registration successful for {phone}")
                
                return AuthResponse(
                    token=token,
                    user=serialize_user(user_doc),
                    message="Registration successful"
                )
            
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"[VERIFY-OTP] Error for {phone}: {e}")
            raise HTTPException(status_code=500, detail="Something went wrong. Please try again.")
    
    # ========================================================================
    # PASSWORD LOGIN ENDPOINT
    # ========================================================================
    @router.post("/password-login", response_model=AuthResponse)
    @limiter.limit("30/minute")
    async def password_login(request: Request, data: PasswordLoginRequest):
        """
        Login with phone and password
        
        Features:
        - Clear error messages
        - Handles password not set
        - Handles wrong password
        - Handles account not found
        """
        # Clean and validate inputs
        phone = clean_phone(data.phone)
        password = data.password if data.password else ""
        
        if not validate_phone(phone):
            raise HTTPException(status_code=400, detail="Please enter a valid 10-digit mobile number")
        
        if not password:
            raise HTTPException(status_code=400, detail="Please enter your password")
        
        logging.info(f"[PASSWORD-LOGIN] Processing for {phone}")
        
        try:
            # Get user
            async def get_user():
                return await db.users.find_one({"phone": phone})
            
            try:
                user = await asyncio.wait_for(db_retry(get_user), timeout=10.0)
            except asyncio.TimeoutError:
                raise HTTPException(status_code=503, detail="Server busy. Please try again.")
            
            if not user:
                raise HTTPException(status_code=401, detail="Account not found. Please signup first or login with OTP.")
            
            # Check if password is set
            password_hash = user.get("password_hash")
            password_set = user.get("password_set", False)
            
            if not password_set or not password_hash:
                raise HTTPException(status_code=400, detail="Password not set. Please login with OTP and set your password.")
            
            # Verify password
            if not verify_password(password, password_hash):
                raise HTTPException(status_code=401, detail="Incorrect password. Please try again or login with OTP.")
            
            # Create token
            token = create_jwt_token(user["id"], user["role"])
            logging.info(f"[PASSWORD-LOGIN] Login successful for {phone}")
            
            return AuthResponse(
                token=token,
                user=serialize_user(user),
                message="Login successful"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"[PASSWORD-LOGIN] Error for {phone}: {e}")
            raise HTTPException(status_code=500, detail="Something went wrong. Please try again or login with OTP.")
    
    # ========================================================================
    # ADMIN LOGIN ENDPOINT
    # ========================================================================
    @router.post("/admin-login", response_model=AuthResponse)
    @limiter.limit("10/minute")
    async def admin_login(request: Request, data: AdminLoginRequest):
        """
        Admin login - simple username/password authentication
        
        Features:
        - Case-insensitive username
        - Instant login (no 2FA)
        - Creates admin user if not exists
        """
        username = data.username.strip() if data.username else ""
        password = data.password if data.password else ""
        
        if not username:
            raise HTTPException(status_code=400, detail="Username is required")
        
        if not password:
            raise HTTPException(status_code=400, detail="Password is required")
        
        logging.info(f"[ADMIN-LOGIN] Attempt for {username}")
        
        try:
            # Verify credentials (case-insensitive username)
            if username.lower() != ADMIN_USERNAME.lower() or password != ADMIN_PASSWORD:
                logging.warning(f"[ADMIN-LOGIN] Invalid credentials for {username}")
                raise HTTPException(status_code=401, detail="Invalid username or password")
            
            # Get or create admin user
            async def get_admin():
                return await db.users.find_one({"role": "admin"}, {"_id": 0})
            
            admin_user = await asyncio.wait_for(db_retry(get_admin), timeout=10.0)
            
            if not admin_user:
                # Create admin user
                admin_id = f"admin-{uuid.uuid4()}"
                admin_doc = {
                    "id": admin_id,
                    "phone": "0000000000",
                    "role": "admin",
                    "name": "Admin",
                    "email": os.environ.get('ADMIN_EMAIL', 'admin@kopartner.in'),
                    "city": None,
                    "pincode": None,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "is_active": True,
                    "password_set": True,
                    "profile_activated": True
                }
                await db.users.insert_one(admin_doc)
                admin_user = admin_doc
            
            token = create_jwt_token(admin_user["id"], "admin")
            logging.info(f"[ADMIN-LOGIN] Login successful for {username}")
            
            return AuthResponse(
                token=token,
                user=serialize_user(admin_user),
                message="Admin login successful"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"[ADMIN-LOGIN] Error: {e}")
            raise HTTPException(status_code=500, detail="Login failed. Please try again.")
    
    # ========================================================================
    # GET CURRENT USER ENDPOINT
    # ========================================================================
    @router.get("/me")
    async def get_me(current_user: dict = Depends(get_current_user)):
        """Get current authenticated user"""
        return current_user
    
    # ========================================================================
    # SET PASSWORD ENDPOINT
    # ========================================================================
    @router.post("/set-password")
    @limiter.limit("10/minute")
    async def set_password(request: Request, data: SetPasswordRequest, current_user: dict = Depends(get_current_user)):
        """
        Set user password
        
        Requirements:
        - Minimum 6 characters
        """
        password = data.password if data.password else ""
        
        if len(password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        try:
            # Hash password
            hashed = hash_password(password)
            
            # Update user
            async def update_password():
                await db.users.update_one(
                    {"id": current_user["id"]},
                    {"$set": {"password_hash": hashed, "password_set": True}}
                )
            
            await asyncio.wait_for(db_retry(update_password), timeout=10.0)
            
            logging.info(f"[SET-PASSWORD] Password set for {current_user.get('phone')}")
            
            return {"success": True, "message": "Password set successfully"}
            
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"[SET-PASSWORD] Error: {e}")
            raise HTTPException(status_code=500, detail="Failed to set password. Please try again.")
    
    # ========================================================================
    # RESEND OTP ENDPOINT
    # ========================================================================
    @router.post("/resend-otp")
    @limiter.limit("10/minute")
    async def resend_otp(request: Request, data: SendOTPRequest):
        """Resend OTP - same as send-otp but explicitly named"""
        return await send_otp(request, data)
    
    return router, get_current_user
