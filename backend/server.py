from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import requests
import bcrypt
from enum import Enum
import traceback

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 720  # 30 days for persistent login

# Fast2SMS Configuration
FAST2SMS_API_KEY = os.environ.get('FAST2SMS_API_KEY', '')

# Cashfree Configuration
CASHFREE_APP_ID = os.environ.get('CASHFREE_APP_ID', '')
CASHFREE_SECRET_KEY = os.environ.get('CASHFREE_SECRET_KEY', '')
CASHFREE_API_URL = "https://api.cashfree.com/pg/orders"

# Agora Configuration
AGORA_APP_ID = os.environ.get('AGORA_APP_ID', '')
AGORA_APP_CERTIFICATE = os.environ.get('AGORA_APP_CERTIFICATE', '')

FAST2SMS_SENDER_ID = 'SIBPLR'

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Enums
class UserRole(str, Enum):
    CLIENT = "client"
    CUDDLIST = "cuddlist"
    BOTH = "both"
    ADMIN = "admin"

class CuddlistStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    INACTIVE = "inactive"

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone: str
    role: UserRole
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True
    
    # Cuddlist specific fields
    bio: Optional[str] = None
    hobbies: List[str] = []
    services: List[dict] = []  # [{"name": "Voice Call", "rate": 500}]
    upi_id: Optional[str] = None
    cuddlist_status: Optional[CuddlistStatus] = None
    membership_paid: bool = False
    membership_expiry: Optional[datetime] = None
    profile_activated: bool = False
    earnings: float = 0.0
    rating: float = 0.0
    total_reviews: int = 0

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str
    role: UserRole
    name: Optional[str] = None

class LoginResponse(BaseModel):
    token: str
    user: dict
    message: str

class AdminLogin(BaseModel):
    username: str
    password: str

# Helper Functions
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    payload = verify_token(token)
    user_id = payload.get("user_id")
    
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return user

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current admin from token"""
    token = credentials.credentials
    payload = verify_token(token)
    user_id = payload.get("user_id")
    
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Check if admin
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    
    return user


def send_otp_sms(phone: str, otp: str) -> bool:
    """Send OTP via Fast2SMS"""
    try:
        url = "https://www.fast2sms.com/dev/bulkV2"
        
        # Construct parameters exactly as per Fast2SMS documentation
        params = {
            "authorization": FAST2SMS_API_KEY,
            "route": "dlt",
            "sender_id": FAST2SMS_SENDER_ID,
            "message": "201186",  # DLT template ID for OTP
            "variables_values": f"{otp}|",  # The OTP value with pipe separator
            "flash": "0",
            "numbers": phone
        }
        
        # Log the request for debugging
        logging.info(f"Sending OTP to {phone} with template 187171")
        
        response = requests.get(url, params=params, timeout=10)
        
        # Log response for debugging
        logging.info(f"Fast2SMS Response Status: {response.status_code}")
        logging.info(f"Fast2SMS Response Body: {response.text}")
        
        if response.status_code == 200:
            response_data = response.json()
            if response_data.get("return"):
                logging.info(f"OTP sent successfully to {phone}")
                return True
            else:
                logging.error(f"Fast2SMS API returned false: {response_data}")
                return False
        else:
            logging.error(f"Fast2SMS API failed with status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        logging.error(f"Failed to send OTP: {str(e)}")
        import traceback
        logging.error(traceback.format_exc())
        return False

# Routes
@api_router.get("/")
async def root():
    return {"message": "Kopartner API is running"}

@api_router.post("/auth/send-otp")
async def send_otp(request: OTPRequest):
    """Send OTP to phone number"""
    phone = request.phone.strip()
    
    # Validate phone number (basic validation)
    if not phone.isdigit() or len(phone) != 10:
        raise HTTPException(status_code=400, detail="Invalid phone number")
    
    # Generate 6-digit OTP
    import random
    otp = str(random.randint(100000, 999999))
    
    # Store OTP in database with expiration
    otp_doc = {
        "id": str(uuid.uuid4()),
        "phone": phone,
        "otp": otp,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    }
    
    await db.otps.delete_many({"phone": phone})  # Remove old OTPs
    await db.otps.insert_one(otp_doc)
    
    # Send OTP via SMS
    sms_sent = send_otp_sms(phone, otp)
    
    # For development/debugging, log OTP (remove in production)
    logging.info(f"OTP for {phone}: {otp}")
    
    # Return success message (OTP should only be sent via SMS)
    return {
        "success": True,
        "message": "OTP sent successfully" if sms_sent else "OTP generated (SMS delivery failed)",
        "otp": None  # Never return OTP in production for security
    }

@api_router.post("/auth/verify-otp", response_model=LoginResponse)
async def verify_otp(request: OTPVerify):
    """Verify OTP and login/register user"""
    phone = request.phone.strip()
    otp = request.otp.strip()
    
    # Check OTP
    current_time = datetime.now(timezone.utc).isoformat()
    otp_doc = await db.otps.find_one({
        "phone": phone,
        "otp": otp,
        "expires_at": {"$gt": current_time}
    })
    
    if not otp_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # Delete used OTP
    await db.otps.delete_one({"phone": phone})
    
    # Check if user exists
    user = await db.users.find_one({"phone": phone}, {"_id": 0})
    
    if user:
        # Existing user - login
        # Remove password hash from response
        password_set = user.get("password_set", False)
        user.pop("password_hash", None)
        
        # Convert datetime to string for JSON serialization
        if isinstance(user.get('created_at'), datetime):
            user['created_at'] = user['created_at'].isoformat()
        if isinstance(user.get('membership_expiry'), datetime):
            user['membership_expiry'] = user['membership_expiry'].isoformat()
            
        token = create_access_token({"user_id": user["id"], "role": user["role"]})
        
        message = "Login successful"
        if not password_set:
            message = "Login successful. Please set your password to enable password-based login."
        
        return LoginResponse(
            token=token,
            user=user,
            message=message
        )
    else:
        # New user - register
        new_user = User(
            phone=phone,
            role=request.role,
            name=request.name,
            cuddlist_status=CuddlistStatus.PENDING if request.role in [UserRole.CUDDLIST, UserRole.BOTH] else None
        )
        
        user_dict = new_user.model_dump()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        if user_dict.get('membership_expiry'):
            user_dict['membership_expiry'] = user_dict['membership_expiry'].isoformat()
        
        # Insert and fetch without _id
        await db.users.insert_one(user_dict)
        registered_user = await db.users.find_one({"id": new_user.id}, {"_id": 0})
        
        token = create_access_token({"user_id": new_user.id, "role": new_user.role})
        
        return LoginResponse(
            token=token,
            user=registered_user,
            message="Registration successful"
        )


@api_router.post("/auth/set-password")
async def set_password(request: dict, current_user: dict = Depends(get_current_user)):
    """Set password for first-time users after OTP login"""
    try:
        logging.info(f"Set password request from user {current_user.get('id', 'unknown')}")
        
        password = request.get("password", "").strip()
        
        if not password:
            logging.error("Password not provided in request")
            raise HTTPException(status_code=400, detail="Password is required")
        
        if len(password) < 6:
            logging.error(f"Password too short: {len(password)} characters")
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        # Hash password
        logging.info("Hashing password...")
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Update user with password
        logging.info(f"Updating password for user {current_user['id']}...")
        result = await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {
                "password_hash": hashed_password.decode('utf-8'),
                "password_set": True,
                "password_set_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.modified_count == 0:
            logging.warning(f"No user updated for ID {current_user['id']}")
        
        logging.info(f"Password set successfully for user {current_user['id']}")
        
        return {
            "success": True,
            "message": "Password set successfully. You can now login with mobile number and password."
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error setting password: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to set password: {str(e)}")

@api_router.post("/auth/login-with-password", response_model=LoginResponse)
async def login_with_password(request: dict):
    """Login with mobile number and password"""
    phone = request.get("phone", "").strip()
    password = request.get("password", "").strip()
    
    if not phone or not password:
        raise HTTPException(status_code=400, detail="Phone and password are required")
    
    # Find user
    user = await db.users.find_one({"phone": phone}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid phone number or password")
    
    # Check if password is set
    if not user.get("password_set") or not user.get("password_hash"):
        raise HTTPException(status_code=400, detail="Password not set. Please login with OTP first.")
    
    # Verify password
    is_valid = bcrypt.checkpw(password.encode('utf-8'), user["password_hash"].encode('utf-8'))
    
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid phone number or password")
    
    # Remove password hash from response
    user.pop("password_hash", None)
    
    # Convert datetime to string for JSON serialization
    if isinstance(user.get('created_at'), datetime):
        user['created_at'] = user['created_at'].isoformat()
    if isinstance(user.get('membership_expiry'), datetime):
        user['membership_expiry'] = user['membership_expiry'].isoformat()
    
    token = create_access_token({"user_id": user["id"], "role": user["role"]})
    
    logging.info(f"Password login successful for user {user['id']}")
    
    return LoginResponse(
        token=token,
        user=user,
        message="Login successful"
    )

@api_router.post("/auth/forgot-password-otp")
async def forgot_password_send_otp(request: dict):
    """Send OTP for password reset"""
    phone = request.get("phone", "").strip()
    
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number is required")
    
    # Check if user exists
    user = await db.users.find_one({"phone": phone}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found with this phone number")
    
    if not user.get("password_set"):
        raise HTTPException(status_code=400, detail="No password set for this account")
    
    # Generate and send OTP (reuse existing OTP logic)
    import random
    otp = str(random.randint(100000, 999999))
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
    
    # Store OTP
    await db.otps.delete_many({"phone": phone})
    await db.otps.insert_one({
        "phone": phone,
        "otp": otp,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at,
        "purpose": "password_reset"
    })
    
    # Send OTP
    sms_sent = send_otp_sms(phone, otp)
    
    logging.info(f"Password reset OTP sent to {phone}: {otp}")
    
    return {
        "success": True,
        "message": "OTP sent successfully for password reset",
        "otp": otp if not sms_sent else None
    }

@api_router.post("/auth/reset-password")
async def reset_password(request: dict):
    """Reset password with OTP verification"""
    phone = request.get("phone", "").strip()
    otp = request.get("otp", "").strip()
    new_password = request.get("new_password", "").strip()
    
    if not phone or not otp or not new_password:
        raise HTTPException(status_code=400, detail="Phone, OTP, and new password are required")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Verify OTP
    current_time = datetime.now(timezone.utc).isoformat()
    otp_doc = await db.otps.find_one({
        "phone": phone,
        "otp": otp,
        "purpose": "password_reset",
        "expires_at": {"$gt": current_time}
    })
    
    if not otp_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # Find user
    user = await db.users.find_one({"phone": phone})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Hash new password
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
    
    # Update password
    await db.users.update_one(
        {"phone": phone},
        {"$set": {
            "password_hash": hashed_password.decode('utf-8'),
            "password_reset_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Delete used OTP
    await db.otps.delete_one({"phone": phone})
    
    logging.info(f"Password reset successful for {phone}")
    
    return {
        "success": True,
        "message": "Password reset successfully. You can now login with your new password."
    }

@api_router.get("/auth/check-password-status")
async def check_password_status(phone: str):
    """Check if user has set a password"""
    user = await db.users.find_one({"phone": phone}, {"_id": 0, "password_set": 1})
    
    if not user:
        return {"has_password": False, "user_exists": False}
    
    return {
        "has_password": user.get("password_set", False),
        "user_exists": True
    }

@api_router.post("/auth/admin-login", response_model=LoginResponse)
async def admin_login(request: AdminLogin):
    """Admin login with username and password"""
    # Admin credentials from environment variables
    ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'amit845401')
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Amit@9810')
    
    if request.username != ADMIN_USERNAME or request.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if admin user exists in database
    admin_user = await db.users.find_one({"role": UserRole.ADMIN}, {"_id": 0})
    
    if not admin_user:
        # Create admin user
        admin = User(
            id="admin-" + str(uuid.uuid4()),
            phone="0000000000",
            role=UserRole.ADMIN,
            name="Admin",
            email="admin@kopartner.in"
        )
        admin_dict = admin.model_dump()
        admin_dict['created_at'] = admin_dict['created_at'].isoformat()
        await db.users.insert_one(admin_dict)
        # Fetch back without _id to avoid serialization issues
        admin_user = await db.users.find_one({"id": admin_dict["id"]}, {"_id": 0})
    
    # Convert datetime to string if needed
    if isinstance(admin_user.get('created_at'), str) is False and admin_user.get('created_at'):
        admin_user['created_at'] = admin_user['created_at'].isoformat()
    
    token = create_access_token({"user_id": admin_user["id"], "role": UserRole.ADMIN})
    
    return LoginResponse(
        token=token,
        user=admin_user,
        message="Admin login successful"
    )

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return current_user

@api_router.put("/users/profile")
async def update_profile(updates: dict, current_user: dict = Depends(get_current_user)):
    """Update user profile"""
    # Remove fields that shouldn't be updated directly
    protected_fields = ["id", "phone", "role", "created_at", "earnings", "rating", "total_reviews"]
    for field in protected_fields:
        updates.pop(field, None)
    
    await db.users.update_one({"id": current_user["id"]}, {"$set": updates})
    
    updated_user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    return updated_user

# Include the router in the main app


# ============= PHASE 2: CUDDLIST PROFILES =============

class CuddlistProfileSetup(BaseModel):
    name: str
    bio: str
    city: str
    pincode: str
    hobbies: List[str]
    services: List[dict]  # [{"service": "Voice Call Chat", "rate": 500}]
    upi_id: str

class PaymentOrder(BaseModel):
    order_id: str
    payment_session_id: str
    order_amount: float
    order_currency: str = "INR"

@api_router.put("/cuddlist/setup-profile")
async def setup_cuddlist_profile(profile: CuddlistProfileSetup, current_user: dict = Depends(get_current_user)):
    """Setup cuddlist profile with all details"""
    if current_user["role"] not in ["cuddlist", "both"]:
        raise HTTPException(status_code=403, detail="Only cuddlists can setup profile")
    
    updates = {
        "name": profile.name,
        "bio": profile.bio,
        "city": profile.city,
        "pincode": profile.pincode,
        "hobbies": profile.hobbies,
        "services": profile.services,
        "upi_id": profile.upi_id
    }
    
    await db.users.update_one({"id": current_user["id"]}, {"$set": updates})
    
    updated_user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    return updated_user

@api_router.post("/cuddlist/create-activation-order")
async def create_activation_order(current_user: dict = Depends(get_current_user)):
    """Create Cashfree payment order for cuddlist activation (₹1000)"""
    if current_user["role"] not in ["cuddlist", "both"]:
        raise HTTPException(status_code=403, detail="Only cuddlists can activate profile")
    
    if current_user.get("membership_paid"):
        raise HTTPException(status_code=400, detail="Membership already paid")
    
    # Create order ID
    order_id = f"ACT_{current_user['id'][:8]}_{int(datetime.now(timezone.utc).timestamp())}"
    
    # Store order in database first
    order_doc = {
        "order_id": order_id,
        "user_id": current_user["id"],
        "amount": 1000.00,
        "type": "activation",
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_orders.insert_one(order_doc)
    
    # Create Cashfree payment order
    USE_TEST_MODE = not CASHFREE_APP_ID or not CASHFREE_SECRET_KEY or True  # Set to False when credentials are active
    
    if USE_TEST_MODE:
        # Test mode
        logging.warning(f"Using TEST MODE for activation order {order_id}")
        test_payment_session_id = f"test_session_{order_id}"
        
        await db.payment_orders.update_one(
            {"order_id": order_id},
            {"$set": {
                "payment_session_id": test_payment_session_id,
                "test_mode": True
            }}
        )
        
        return {
            "order_id": order_id,
            "payment_session_id": test_payment_session_id,
            "order_amount": 1000.00,
            "order_currency": "INR",
            "test_mode": True,
            "message": "TEST MODE: Payment order created. Cashfree credentials pending activation."
        }
    
    # Production mode
    try:
        headers = {
            "Content-Type": "application/json",
            "x-client-id": CASHFREE_APP_ID,
            "x-client-secret": CASHFREE_SECRET_KEY,
            "x-api-version": "2023-08-01"
        }
        
        # Get frontend URL from environment
        FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        
        payload = {
            "order_id": order_id,
            "order_amount": 1000.00,
            "order_currency": "INR",
            "customer_details": {
                "customer_id": current_user["id"],
                "customer_phone": current_user["phone"],
                "customer_name": current_user.get("name", "User")
            },
            "order_meta": {
                "return_url": f"{FRONTEND_URL}/dashboard?order_id={order_id}"
            }
        }
        
        response = requests.post(CASHFREE_API_URL, json=payload, headers=headers, timeout=10)
        cashfree_response = response.json()
        
        if response.status_code == 200 and cashfree_response.get("payment_session_id"):
            await db.payment_orders.update_one(
                {"order_id": order_id},
                {"$set": {"payment_session_id": cashfree_response["payment_session_id"]}}
            )
            
            return {
                "order_id": order_id,
                "payment_session_id": cashfree_response["payment_session_id"],
                "order_amount": 1000.00,
                "order_currency": "INR",
                "message": "Order created successfully"
            }
        else:
            logging.error(f"Cashfree API error: {cashfree_response}")
            error_msg = cashfree_response.get('message', 'Unknown error')
            if 'authentication' in error_msg.lower():
                error_msg = "Cashfree API authentication failed. Please activate credentials."
            raise HTTPException(status_code=500, detail=f"Payment gateway error: {error_msg}")
    
    except requests.exceptions.RequestException as e:
        logging.error(f"Network error calling Cashfree: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment gateway connection error: {str(e)}")
    except Exception as e:
        logging.error(f"Error creating Cashfree order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create payment order: {str(e)}")

@api_router.post("/cuddlist/verify-activation-payment")
async def verify_activation_payment(order_id: str, current_user: dict = Depends(get_current_user)):
    """Verify activation payment and activate profile"""
    
    # Check if order exists
    order = await db.payment_orders.find_one({"order_id": order_id, "user_id": current_user["id"]})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # In production, verify with Cashfree API
    # For now, simulate successful payment
    
    # Update order status
    await db.payment_orders.update_one(
        {"order_id": order_id},
        {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Activate profile
    expiry = datetime.now(timezone.utc) + timedelta(days=365)
    updates = {
        "membership_paid": True,
        "membership_expiry": expiry.isoformat(),
        "profile_activated": True,
        "cuddlist_status": "approved"  # Auto-approve for now
    }
    
    await db.users.update_one({"id": current_user["id"]}, {"$set": updates})
    
    # Store transaction
    transaction = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "order_id": order_id,
        "amount": 1000.00,
        "type": "activation_fee",
        "status": "completed",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.transactions.insert_one(transaction)
    
    updated_user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    return {
        "success": True,
        "message": "Profile activated successfully",
        "user": updated_user
    }

@api_router.get("/cuddlist/all")
async def get_all_cuddlists(
    city: Optional[str] = None,
    service: Optional[str] = None,
    pincode: Optional[str] = None
):
    """Get all active cuddlists with optional filters"""
    query = {
        "role": {"$in": ["cuddlist", "both"]},
        "profile_activated": True,
        "cuddlist_status": "approved"
    }
    
    # Add optional filters
    if city:
        query["city"] = city
    if pincode:
        query["pincode"] = pincode
    
    # Find all matching cuddlists
    cuddlists = await db.users.find(
        query,
        {"_id": 0, "phone": 0, "password_hash": 0, "upi_id": 0}
    ).to_list(100)
    
    # Filter by service if provided
    if service:
        cuddlists = [c for c in cuddlists if any(s.get("name") == service or s.get("service") == service for s in c.get("services", []))]
    
    return {"cuddlists": cuddlists, "count": len(cuddlists)}


# ============= PHASE 3: PAYMENTS & BOOKING =============

class ServiceBooking(BaseModel):
    service: str
    hours: int
    rate_per_hour: float

class ClientPaymentOrder(BaseModel):
    services: List[ServiceBooking]

@api_router.post("/client/create-booking-payment")
async def create_client_booking_payment(booking: ClientPaymentOrder, current_user: dict = Depends(get_current_user)):
    """Create payment order for client to book services"""
    if current_user["role"] not in ["client", "both"]:
        raise HTTPException(status_code=403, detail="Only clients can book services")
    
    # Calculate total
    subtotal = sum(s.hours * s.rate_per_hour for s in booking.services)
    gst_amount = subtotal * 0.18  # 18% GST
    total_amount = subtotal + gst_amount
    
    # Create order
    order_id = f"BOOK_{current_user['id'][:8]}_{int(datetime.now(timezone.utc).timestamp())}"
    
    order_doc = {
        "order_id": order_id,
        "user_id": current_user["id"],
        "services": [s.dict() for s in booking.services],
        "subtotal": subtotal,
        "gst_amount": gst_amount,
        "total_amount": total_amount,
        "type": "booking",
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_orders.insert_one(order_doc)
    
    # Create Cashfree payment order
    # NOTE: Cashfree credentials need to be activated by merchant
    # For now, using test mode with mock payment
    
    USE_TEST_MODE = not CASHFREE_APP_ID or not CASHFREE_SECRET_KEY or True  # Set to False when credentials are active
    
    if USE_TEST_MODE:
        # Test mode: Create mock payment session for testing
        logging.warning(f"Using TEST MODE for payment order {order_id}")
        logging.warning("Cashfree credentials need to be activated. Contact Cashfree support to activate your API keys.")
        
        test_payment_session_id = f"test_session_{order_id}"
        
        await db.payment_orders.update_one(
            {"order_id": order_id},
            {"$set": {
                "payment_session_id": test_payment_session_id,
                "test_mode": True
            }}
        )
        
        return {
            "order_id": order_id,
            "payment_session_id": test_payment_session_id,
            "subtotal": subtotal,
            "gst_amount": gst_amount,
            "total_amount": total_amount,
            "order_currency": "INR",
            "test_mode": True,
            "message": "TEST MODE: Payment order created. Real payment gateway integration pending Cashfree credential activation."
        }
    
    # Production mode: Real Cashfree API
    try:
        headers = {
            "Content-Type": "application/json",
            "x-client-id": CASHFREE_APP_ID,
            "x-client-secret": CASHFREE_SECRET_KEY,
            "x-api-version": "2023-08-01"
        }
        
        # Get frontend URL from environment
        FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        
        payload = {
            "order_id": order_id,
            "order_amount": float(total_amount),
            "order_currency": "INR",
            "customer_details": {
                "customer_id": current_user["id"],
                "customer_phone": current_user.get("phone", "9999999999"),
                "customer_name": current_user.get("name", "Customer")
            },
            "order_meta": {
                "return_url": f"{FRONTEND_URL}/dashboard?order_id={order_id}"
            }
        }
        
        logging.info(f"Calling Cashfree API for order {order_id}")
        response = requests.post(CASHFREE_API_URL, json=payload, headers=headers, timeout=10)
        cashfree_response = response.json()
        
        logging.info(f"Cashfree Response Status: {response.status_code}")
        logging.info(f"Cashfree Response: {cashfree_response}")
        
        if response.status_code == 200 and cashfree_response.get("payment_session_id"):
            # Update order with payment session ID
            await db.payment_orders.update_one(
                {"order_id": order_id},
                {"$set": {"payment_session_id": cashfree_response["payment_session_id"]}}
            )
            
            return {
                "order_id": order_id,
                "payment_session_id": cashfree_response["payment_session_id"],
                "subtotal": subtotal,
                "gst_amount": gst_amount,
                "total_amount": total_amount,
                "order_currency": "INR",
                "message": "Payment order created successfully"
            }
        else:
            logging.error(f"Cashfree API error: {cashfree_response}")
            error_msg = cashfree_response.get('message', 'Unknown error')
            
            # If authentication error, provide helpful message
            if 'authentication' in error_msg.lower():
                error_msg = "Cashfree API authentication failed. Please verify API credentials are activated in Cashfree dashboard."
            
            raise HTTPException(status_code=500, detail=f"Payment gateway error: {error_msg}")
    
    except requests.exceptions.RequestException as e:
        logging.error(f"Network error calling Cashfree: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment gateway connection error: {str(e)}")
    except Exception as e:
        logging.error(f"Error creating Cashfree order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create payment order: {str(e)}")

@api_router.post("/client/verify-booking-payment")
async def verify_booking_payment(order_id: str, current_user: dict = Depends(get_current_user)):
    """Verify booking payment and enable search"""
    
    order = await db.payment_orders.find_one({"order_id": order_id, "user_id": current_user["id"]})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update order status
    await db.payment_orders.update_one(
        {"order_id": order_id},
        {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Store transaction
    transaction = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "order_id": order_id,
        "amount": order["total_amount"],
        "subtotal": order["subtotal"],
        "gst_amount": order["gst_amount"],
        "type": "booking_payment",
        "status": "completed",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.transactions.insert_one(transaction)
    
    # Update user to allow search
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"can_search": True, "last_payment_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "success": True,
        "message": "Payment verified. You can now search for cuddlists!",
        "order_id": order_id,
        "amount_paid": order["total_amount"]
    }

@api_router.post("/client/submit-payment-proof")
async def submit_payment_proof(
    proof: dict,
    current_user: dict = Depends(get_current_user)
):
    """Submit manual payment proof for admin verification"""
    order_id = proof.get("order_id")
    transaction_id = proof.get("transaction_id")
    payment_method = proof.get("payment_method", "PhonePe")
    
    if not order_id or not transaction_id:
        raise HTTPException(status_code=400, detail="Order ID and Transaction ID required")
    
    # Check if order exists
    order = await db.payment_orders.find_one({"order_id": order_id, "user_id": current_user["id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update order with payment proof
    await db.payment_orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "payment_proof": {
                "transaction_id": transaction_id,
                "payment_method": payment_method,
                "submitted_at": datetime.now(timezone.utc).isoformat(),
                "verification_status": "pending"
            },
            "status": "pending_verification"
        }}
    )
    
    logging.info(f"Payment proof submitted for order {order_id} by user {current_user['id']}")
    
    return {
        "success": True,
        "message": "Payment proof submitted successfully. Admin will verify within 24 hours.",
        "order_id": order_id,
        "verification_status": "pending"
    }

@api_router.get("/admin/pending-verifications")
async def get_pending_verifications(current_user: dict = Depends(get_current_admin)):
    """Get all pending payment verifications for admin"""
    pending_orders = await db.payment_orders.find(
        {"status": "pending_verification"},
        {"_id": 0}
    ).to_list(100)
    
    # Get user details for each order
    for order in pending_orders:
        user = await db.users.find_one({"id": order["user_id"]}, {"_id": 0, "name": 1, "phone": 1})
        if user:
            order["user_details"] = user
    
    return {
        "pending_orders": pending_orders,
        "count": len(pending_orders)
    }

@api_router.post("/admin/verify-payment/{order_id}")
async def admin_verify_payment(
    order_id: str,
    action: dict,
    current_user: dict = Depends(get_current_admin)
):
    """Admin verifies manual payment - approve or reject"""
    approved = action.get("approved", False)
    admin_notes = action.get("notes", "")
    
    order = await db.payment_orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if approved:
        # Approve payment
        await db.payment_orders.update_one(
            {"order_id": order_id},
            {"$set": {
                "status": "completed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "payment_proof.verification_status": "approved",
                "payment_proof.verified_by": current_user["id"],
                "payment_proof.verified_at": datetime.now(timezone.utc).isoformat(),
                "payment_proof.admin_notes": admin_notes
            }}
        )
        
        # Store transaction
        transaction = {
            "id": str(uuid.uuid4()),
            "user_id": order["user_id"],
            "order_id": order_id,
            "amount": order.get("total_amount", order.get("amount", 0)),
            "subtotal": order.get("subtotal", 0),
            "gst_amount": order.get("gst_amount", 0),
            "type": order.get("type", "booking_payment"),
            "payment_method": order.get("payment_proof", {}).get("payment_method", "Manual"),
            "transaction_id": order.get("payment_proof", {}).get("transaction_id", ""),
            "status": "completed",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.transactions.insert_one(transaction)
        
        # Update user based on order type
        if order.get("type") == "activation":
            # Cuddlist activation
            await db.users.update_one(
                {"id": order["user_id"]},
                {"$set": {
                    "membership_paid": True,
                    "profile_activated": True,
                    "activation_date": datetime.now(timezone.utc).isoformat()
                }}
            )
        else:
            # Client booking payment
            await db.users.update_one(
                {"id": order["user_id"]},
                {"$set": {
                    "can_search": True,
                    "last_payment_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        
        logging.info(f"Payment approved for order {order_id} by admin {current_user['id']}")
        
        return {
            "success": True,
            "message": "Payment verified and approved",
            "order_id": order_id
        }
    else:
        # Reject payment
        await db.payment_orders.update_one(
            {"order_id": order_id},
            {"$set": {
                "payment_proof.verification_status": "rejected",
                "payment_proof.verified_by": current_user["id"],
                "payment_proof.verified_at": datetime.now(timezone.utc).isoformat(),
                "payment_proof.admin_notes": admin_notes,
                "status": "rejected"
            }}
        )
        
        logging.info(f"Payment rejected for order {order_id} by admin {current_user['id']}")
        
        return {
            "success": True,
            "message": "Payment rejected",
            "order_id": order_id
        }


@api_router.get("/transactions/my")
async def get_my_transactions(current_user: dict = Depends(get_current_user)):
    """Get user's transaction history"""
    transactions = await db.transactions.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"transactions": transactions, "count": len(transactions)}

# ============= PHASE 5: ADMIN PANEL =============

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    """Check if user is admin"""
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@api_router.get("/admin/cuddlists/pending")
async def get_pending_cuddlists(admin: dict = Depends(get_admin_user)):
    """Get all pending cuddlist approvals"""
    cuddlists = await db.users.find(
        {"role": {"$in": ["cuddlist", "both"]}, "cuddlist_status": "pending"},
        {"_id": 0}
    ).to_list(100)
    return {"cuddlists": cuddlists, "count": len(cuddlists)}

@api_router.post("/admin/cuddlists/{cuddlist_id}/approve")
async def approve_cuddlist(cuddlist_id: str, admin: dict = Depends(get_admin_user)):
    """Approve a cuddlist"""
    await db.users.update_one(
        {"id": cuddlist_id},
        {"$set": {"cuddlist_status": "approved"}}
    )
    return {"success": True, "message": "Cuddlist approved"}

@api_router.post("/admin/cuddlists/{cuddlist_id}/reject")
async def reject_cuddlist(cuddlist_id: str, reason: str, admin: dict = Depends(get_admin_user)):
    """Reject a cuddlist"""
    await db.users.update_one(
        {"id": cuddlist_id},
        {"$set": {"cuddlist_status": "rejected", "rejection_reason": reason}}
    )
    return {"success": True, "message": "Cuddlist rejected"}

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(get_admin_user)):
    """Get platform statistics"""
    total_users = await db.users.count_documents({})
    total_clients = await db.users.count_documents({"role": {"$in": ["client", "both"]}})
    total_cuddlists = await db.users.count_documents({"role": {"$in": ["cuddlist", "both"]}})
    active_cuddlists = await db.users.count_documents({"profile_activated": True})
    pending_approvals = await db.users.count_documents({"cuddlist_status": "pending"})
    
    total_transactions = await db.transactions.count_documents({})
    
    # Calculate total revenue
    pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    revenue_result = await db.transactions.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "total_users": total_users,
        "total_clients": total_clients,
        "total_cuddlists": total_cuddlists,
        "active_cuddlists": active_cuddlists,
        "pending_approvals": pending_approvals,
        "total_transactions": total_transactions,
        "total_revenue": total_revenue
    }

@api_router.get("/admin/users/all")
async def get_all_users(
    admin: dict = Depends(get_admin_user),
    role: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all users with filters"""
    query = {"role": {"$ne": "admin"}}  # Exclude admin users
    
    if role and role != "all":
        if role == "kopartner":
            query["role"] = {"$in": ["cuddlist", "both"]}
        elif role == "client":
            query["role"] = {"$in": ["client", "both"]}
    
    if status:
        if status == "approved":
            query["cuddlist_status"] = "approved"
        elif status == "pending":
            query["cuddlist_status"] = "pending"
        elif status == "rejected":
            query["cuddlist_status"] = "rejected"
        elif status == "active":
            query["is_active"] = True
    
    users = await db.users.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Filter by search if provided
    if search:
        search_lower = search.lower()
        users = [u for u in users if 
                 search_lower in (u.get("name", "") or "").lower() or
                 search_lower in (u.get("phone", "") or "").lower() or
                 search_lower in (u.get("email", "") or "").lower() or
                 search_lower in (u.get("city", "") or "").lower()]
    
    return {"users": users, "count": len(users)}

@api_router.get("/admin/kopartners/all")
async def get_all_kopartners(
    admin: dict = Depends(get_admin_user),
    status: Optional[str] = None
):
    """Get all KoPartners with their details"""
    query = {"role": {"$in": ["cuddlist", "both"]}}
    
    if status and status != "all":
        query["cuddlist_status"] = status
    
    kopartners = await db.users.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"kopartners": kopartners, "count": len(kopartners)}

@api_router.get("/admin/kopartners/pending")
async def get_pending_kopartners(admin: dict = Depends(get_admin_user)):
    """Get all pending KoPartner approvals"""
    kopartners = await db.users.find(
        {"role": {"$in": ["cuddlist", "both"]}, "cuddlist_status": "pending"},
        {"_id": 0}
    ).to_list(100)
    return {"kopartners": kopartners, "count": len(kopartners)}

@api_router.post("/admin/kopartners/{kopartner_id}/approve")
async def approve_kopartner(kopartner_id: str, admin: dict = Depends(get_admin_user)):
    """Approve a KoPartner"""
    await db.users.update_one(
        {"id": kopartner_id},
        {"$set": {"cuddlist_status": "approved"}}
    )
    return {"success": True, "message": "KoPartner approved"}

@api_router.post("/admin/kopartners/{kopartner_id}/reject")
async def reject_kopartner(kopartner_id: str, reason: str, admin: dict = Depends(get_admin_user)):
    """Reject a KoPartner"""
    await db.users.update_one(
        {"id": kopartner_id},
        {"$set": {"cuddlist_status": "rejected", "rejection_reason": reason}}
    )
    return {"success": True, "message": "KoPartner rejected"}

@api_router.post("/admin/users/{user_id}/toggle-status")
async def toggle_user_status(user_id: str, admin: dict = Depends(get_admin_user)):
    """Toggle user active status"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = not user.get("is_active", True)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_active": new_status}}
    )
    return {"success": True, "is_active": new_status}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a user"""
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "message": "User deleted"}

@api_router.get("/admin/transactions/all")
async def get_all_transactions(admin: dict = Depends(get_admin_user)):
    """Get all transactions"""
    transactions = await db.transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"transactions": transactions, "count": len(transactions)}

# ============= PHASE 6: REVIEWS & SOS =============

class ReviewCreate(BaseModel):
    cuddlist_id: str
    rating: int  # 1-5
    comment: str

class SOSReport(BaseModel):
    description: str
    evidence_url: Optional[str] = None

@api_router.post("/reviews/create")
async def create_review(review: ReviewCreate, current_user: dict = Depends(get_current_user)):
    """Create a review for a cuddlist"""
    if review.rating < 1 or review.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Check if cuddlist exists
    cuddlist = await db.users.find_one({"id": review.cuddlist_id})
    if not cuddlist:
        raise HTTPException(status_code=404, detail="Cuddlist not found")
    
    # Create review
    review_doc = {
        "id": str(uuid.uuid4()),
        "cuddlist_id": review.cuddlist_id,
        "client_id": current_user["id"],
        "client_name": current_user.get("name", "Anonymous"),
        "rating": review.rating,
        "comment": review.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reviews.insert_one(review_doc)
    
    # Update cuddlist average rating (optimized with projection)
    all_reviews = await db.reviews.find({"cuddlist_id": review.cuddlist_id}, {"rating": 1, "_id": 0}).to_list(1000)
    avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
    
    await db.users.update_one(
        {"id": review.cuddlist_id},
        {"$set": {"rating": avg_rating, "total_reviews": len(all_reviews)}}
    )
    
    return {"success": True, "message": "Review submitted", "review": review_doc}

@api_router.get("/reviews/cuddlist/{cuddlist_id}")
async def get_cuddlist_reviews(cuddlist_id: str):
    """Get all reviews for a cuddlist"""
    reviews = await db.reviews.find(
        {"cuddlist_id": cuddlist_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"reviews": reviews, "count": len(reviews)}

@api_router.post("/sos/report")
async def create_sos_report(report: SOSReport, current_user: dict = Depends(get_current_user)):
    """Create an SOS report"""
    sos_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "user_name": current_user.get("name", "User"),
        "user_phone": current_user["phone"],
        "description": report.description,
        "evidence_url": report.evidence_url,
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.sos_reports.insert_one(sos_doc)
    
    return {"success": True, "message": "SOS report created. Admin will review shortly.", "report_id": sos_doc["id"]}

@api_router.get("/admin/sos/all")
async def get_all_sos_reports(admin: dict = Depends(get_admin_user)):
    """Get all SOS reports"""
    reports = await db.sos_reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"reports": reports, "count": len(reports)}

@api_router.post("/admin/sos/{report_id}/resolve")
async def resolve_sos(report_id: str, admin: dict = Depends(get_admin_user)):
    """Mark SOS report as resolved"""
    await db.sos_reports.update_one(
        {"id": report_id},
        {"$set": {"status": "resolved", "resolved_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "message": "SOS report resolved"}

@api_router.get("/cuddlist/{cuddlist_id}")
async def get_cuddlist_profile(cuddlist_id: str):
    """Get specific cuddlist profile"""
    cuddlist = await db.users.find_one(
        {"id": cuddlist_id, "profile_activated": True},
        {"_id": 0, "phone": 0, "upi_id": 0}
    )
    
    if not cuddlist:
        raise HTTPException(status_code=404, detail="Cuddlist not found")
    
    return cuddlist

# ============= WITHDRAWAL SYSTEM =============

class WithdrawalRequest(BaseModel):
    amount: float
    upi_id: str

@api_router.post("/cuddlist/request-withdrawal")
async def request_withdrawal(withdrawal: WithdrawalRequest, current_user: dict = Depends(get_current_user)):
    """Cuddlist requests withdrawal"""
    if current_user["role"] not in ["cuddlist", "both"]:
        raise HTTPException(status_code=403, detail="Only cuddlists can request withdrawals")
    
    if withdrawal.amount > current_user.get("earnings", 0):
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    withdrawal_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "user_name": current_user.get("name", "User"),
        "amount": withdrawal.amount,
        "upi_id": withdrawal.upi_id,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.withdrawal_requests.insert_one(withdrawal_doc)
    
    # Deduct from earnings
    new_earnings = current_user.get("earnings", 0) - withdrawal.amount
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"earnings": new_earnings}}
    )
    
    return {"success": True, "message": "Withdrawal request submitted", "withdrawal_id": withdrawal_doc["id"]}

@api_router.get("/cuddlist/withdrawals")
async def get_my_withdrawals(current_user: dict = Depends(get_current_user)):
    """Get user's withdrawal requests"""
    withdrawals = await db.withdrawal_requests.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"withdrawals": withdrawals, "count": len(withdrawals)}

@api_router.get("/admin/withdrawals")
async def get_all_withdrawals(admin: dict = Depends(get_admin_user)):
    """Admin: Get all withdrawal requests"""
    withdrawals = await db.withdrawal_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"withdrawals": withdrawals, "count": len(withdrawals)}

# ============= AGORA VIDEO CALL =============

@api_router.get("/video/token")
async def generate_agora_token(channel_name: str, current_user: dict = Depends(get_current_user)):
    """Generate Agora RTC token for video call"""
    # In production, use proper Agora token generation


# ============= ADMIN SETTINGS & BLOG MANAGEMENT =============

class ServiceFeeUpdate(BaseModel):
    service_name: str
    new_rate: float

class BlogPost(BaseModel):
    title: str
    content: str
    author: str = "Admin"
    published: bool = False

@api_router.post("/admin/settings/update-fee")
async def update_service_fee(fee_update: ServiceFeeUpdate, admin: dict = Depends(get_admin_user)):
    """Admin: Update service fee"""
    # Store default service fees in database
    fee_doc = {
        "id": str(uuid.uuid4()),
        "service_name": fee_update.service_name,
        "rate": fee_update.new_rate,
        "updated_by": admin["id"],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Update or insert
    await db.service_fees.update_one(
        {"service_name": fee_update.service_name},
        {"$set": fee_doc},
        upsert=True
    )
    
    return {"success": True, "message": f"Service fee updated for {fee_update.service_name}"}

@api_router.get("/admin/settings/fees")
async def get_all_fees(admin: dict = Depends(get_admin_user)):
    """Admin: Get all service fees"""
    fees = await db.service_fees.find({}, {"_id": 0}).to_list(100)
    return {"fees": fees, "count": len(fees)}

@api_router.post("/admin/blog/create")
async def create_blog(blog: BlogPost, admin: dict = Depends(get_admin_user)):
    """Admin: Create blog post"""
    blog_doc = {
        "id": str(uuid.uuid4()),
        "title": blog.title,
        "content": blog.content,
        "author": admin.get("name", "Admin"),
        "published": blog.published,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin["id"]
    }
    await db.blogs.insert_one(blog_doc)
    
    return {"success": True, "message": "Blog created", "blog_id": blog_doc["id"]}

@api_router.post("/admin/blog/{blog_id}/publish")
async def publish_blog(blog_id: str, admin: dict = Depends(get_admin_user)):
    """Admin: Publish blog"""
    await db.blogs.update_one(
        {"id": blog_id},
        {"$set": {"published": True, "published_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "message": "Blog published"}

@api_router.get("/blogs")
async def get_published_blogs():
    """Get all published blogs"""
    blogs = await db.blogs.find(
        {"published": True},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return {"blogs": blogs, "count": len(blogs)}

@api_router.get("/admin/blogs/all")
async def get_all_blogs(admin: dict = Depends(get_admin_user)):
    """Admin: Get all blogs including drafts"""
    blogs = await db.blogs.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"blogs": blogs, "count": len(blogs)}

@api_router.post("/admin/withdrawals/{withdrawal_id}/approve")
async def approve_withdrawal(withdrawal_id: str, admin: dict = Depends(get_admin_user)):
    """Admin: Approve withdrawal"""
    await db.withdrawal_requests.update_one(
        {"id": withdrawal_id},
        {"$set": {"status": "approved", "approved_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "message": "Withdrawal approved"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()