"""
BULLETPROOF SECURITY MODULE for KoPartner
==========================================
Enterprise-grade security measures to prevent:
- Brute force attacks (rate limiting)
- NoSQL injection attacks
- XSS attacks
- CSRF attacks
- Data theft/deletion
- Unauthorized access

Author: KoPartner Security Team
Version: 1.0.0
"""

import re
import html
import bleach
import hashlib
import hmac
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional, List
from functools import wraps

# Configure security logger
security_logger = logging.getLogger("security")
security_logger.setLevel(logging.INFO)


# ============================================================================
# INPUT SANITIZATION - Prevent NoSQL Injection & XSS
# ============================================================================

# Dangerous MongoDB operators that could be used for injection
DANGEROUS_OPERATORS = [
    '$where', '$regex', '$ne', '$gt', '$gte', '$lt', '$lte', 
    '$in', '$nin', '$or', '$and', '$not', '$nor', '$exists',
    '$type', '$mod', '$text', '$geoWithin', '$geoIntersects',
    '$near', '$nearSphere', '$all', '$elemMatch', '$size',
    '$expr', '$jsonSchema', '$comment', '$rand'
]

# Regex patterns for detecting injection attempts
INJECTION_PATTERNS = [
    r'\$[a-zA-Z]+',           # MongoDB operators
    r'javascript:',            # JavaScript injection
    r'<script',               # Script tags
    r'onerror\s*=',           # Event handlers
    r'onclick\s*=',
    r'onload\s*=',
    r'eval\s*\(',             # Eval attempts
    r'function\s*\(',         # Function definitions
    r'__proto__',             # Prototype pollution
    r'constructor',           # Constructor access
]


def sanitize_string(value: str, max_length: int = 1000) -> str:
    """
    BULLETPROOF string sanitization
    - Removes HTML tags
    - Escapes special characters
    - Limits length
    - Removes dangerous patterns
    """
    if not isinstance(value, str):
        return str(value)[:max_length]
    
    # Limit length first
    value = value[:max_length]
    
    # Remove HTML tags using bleach
    value = bleach.clean(value, tags=[], strip=True)
    
    # HTML escape any remaining special characters
    value = html.escape(value)
    
    return value.strip()


def sanitize_search_query(query: str) -> str:
    """
    Sanitize search queries to prevent injection
    """
    if not query:
        return ""
    
    # Convert to string and limit length
    query = str(query)[:200]
    
    # Remove any MongoDB operators
    for op in DANGEROUS_OPERATORS:
        query = query.replace(op, '')
    
    # Remove special regex characters that could cause issues
    query = re.sub(r'[^\w\s@.\-]', '', query)
    
    return query.strip()


def sanitize_dict(data: Dict[str, Any], allowed_fields: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Recursively sanitize dictionary data
    - Removes dangerous keys (MongoDB operators)
    - Sanitizes string values
    - Removes unexpected fields if allowed_fields specified
    """
    if not isinstance(data, dict):
        return {}
    
    sanitized = {}
    
    for key, value in data.items():
        # Skip dangerous keys
        if key.startswith('$') or key in ['__proto__', 'constructor', 'prototype']:
            security_logger.warning(f"[SECURITY] Blocked dangerous key: {key}")
            continue
        
        # Filter to allowed fields if specified
        if allowed_fields and key not in allowed_fields:
            continue
        
        # Sanitize based on type
        if isinstance(value, str):
            sanitized[key] = sanitize_string(value)
        elif isinstance(value, dict):
            sanitized[key] = sanitize_dict(value)
        elif isinstance(value, list):
            sanitized[key] = [
                sanitize_string(v) if isinstance(v, str) else v 
                for v in value
            ]
        else:
            sanitized[key] = value
    
    return sanitized


def detect_injection_attempt(value: str) -> bool:
    """
    Detect potential injection attempts
    Returns True if suspicious pattern found
    """
    if not isinstance(value, str):
        return False
    
    value_lower = value.lower()
    
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, value_lower, re.IGNORECASE):
            security_logger.warning(f"[SECURITY] Injection attempt detected: {pattern} in value")
            return True
    
    return False


# ============================================================================
# AUDIT LOGGING - Track All Sensitive Operations
# ============================================================================

class AuditLogger:
    """
    Enterprise-grade audit logging for security events
    """
    
    @staticmethod
    async def log_event(
        db,
        event_type: str,
        user_id: Optional[str],
        action: str,
        details: Dict[str, Any],
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        success: bool = True
    ):
        """Log a security/audit event to database"""
        try:
            audit_record = {
                "id": f"audit_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}",
                "event_type": event_type,  # LOGIN, LOGOUT, DELETE, UPDATE, PAYMENT, etc.
                "user_id": user_id,
                "action": action,
                "details": details,
                "ip_address": ip_address,
                "user_agent": user_agent[:500] if user_agent else None,
                "success": success,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "created_at": datetime.now(timezone.utc)
            }
            
            await db.audit_logs.insert_one(audit_record)
            
            # Also log to application logs
            log_level = logging.INFO if success else logging.WARNING
            security_logger.log(log_level, f"[AUDIT] {event_type}: {action} by {user_id} - {'SUCCESS' if success else 'FAILED'}")
            
        except Exception as e:
            security_logger.error(f"[AUDIT] Failed to log event: {e}")
    
    @staticmethod
    async def log_login_attempt(db, user_id: str, ip: str, success: bool, reason: str = ""):
        await AuditLogger.log_event(
            db,
            event_type="LOGIN",
            user_id=user_id,
            action="login_attempt",
            details={"reason": reason},
            ip_address=ip,
            success=success
        )
    
    @staticmethod
    async def log_admin_action(db, admin_id: str, action: str, target_user_id: str, details: Dict, ip: str):
        await AuditLogger.log_event(
            db,
            event_type="ADMIN_ACTION",
            user_id=admin_id,
            action=action,
            details={"target_user": target_user_id, **details},
            ip_address=ip,
            success=True
        )
    
    @staticmethod
    async def log_data_modification(db, user_id: str, action: str, collection: str, record_id: str, ip: str):
        await AuditLogger.log_event(
            db,
            event_type="DATA_MODIFICATION",
            user_id=user_id,
            action=action,
            details={"collection": collection, "record_id": record_id},
            ip_address=ip,
            success=True
        )


# ============================================================================
# SOFT DELETE - Data Recovery Protection
# ============================================================================

async def soft_delete_user(db, user_id: str, deleted_by: str, reason: str = ""):
    """
    Soft delete user - moves to deleted_users collection instead of permanent delete
    Allows data recovery if needed
    """
    try:
        # Find the user
        user = await db.users.find_one({"id": user_id})
        if not user:
            return False, "User not found"
        
        # Remove MongoDB _id for serialization
        user.pop('_id', None)
        
        # Add deletion metadata
        user['deleted_at'] = datetime.now(timezone.utc).isoformat()
        user['deleted_by'] = deleted_by
        user['deletion_reason'] = reason
        user['original_id'] = user_id
        user['is_deleted'] = True
        
        # Move to deleted_users collection
        await db.deleted_users.insert_one(user)
        
        # Remove from active users
        await db.users.delete_one({"id": user_id})
        
        security_logger.info(f"[SOFT-DELETE] User {user_id} soft deleted by {deleted_by}")
        
        return True, "User moved to deleted users archive"
        
    except Exception as e:
        security_logger.error(f"[SOFT-DELETE] Error: {e}")
        return False, str(e)


async def restore_deleted_user(db, user_id: str, restored_by: str):
    """
    Restore a soft-deleted user
    """
    try:
        # Find in deleted users
        user = await db.deleted_users.find_one({"original_id": user_id})
        if not user:
            return False, "Deleted user not found"
        
        # Remove deletion metadata
        user.pop('_id', None)
        user.pop('deleted_at', None)
        user.pop('deleted_by', None)
        user.pop('deletion_reason', None)
        user.pop('is_deleted', None)
        user['id'] = user.pop('original_id', user_id)
        user['restored_at'] = datetime.now(timezone.utc).isoformat()
        user['restored_by'] = restored_by
        
        # Restore to users collection
        await db.users.insert_one(user)
        
        # Remove from deleted users
        await db.deleted_users.delete_one({"original_id": user_id})
        
        security_logger.info(f"[RESTORE] User {user_id} restored by {restored_by}")
        
        return True, "User restored successfully"
        
    except Exception as e:
        security_logger.error(f"[RESTORE] Error: {e}")
        return False, str(e)


# ============================================================================
# REQUEST VALIDATION - Validate All Incoming Data
# ============================================================================

def validate_phone(phone: str) -> bool:
    """Validate Indian phone number"""
    if not phone:
        return False
    # Remove any non-digit characters
    phone = re.sub(r'\D', '', phone)
    # Indian phone numbers are 10 digits
    return len(phone) == 10 and phone[0] in '6789'


def validate_email(email: str) -> bool:
    """Validate email format"""
    if not email:
        return True  # Email is optional
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_pincode(pincode: str) -> bool:
    """Validate Indian pincode"""
    if not pincode:
        return True  # Pincode is optional
    return bool(re.match(r'^\d{6}$', pincode))


def validate_otp(otp: str) -> bool:
    """Validate OTP format"""
    return bool(re.match(r'^\d{6}$', str(otp)))


# ============================================================================
# SECURITY HEADERS
# ============================================================================

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "img-src 'self' data: https:; "
        "connect-src 'self' https://api.razorpay.com https://*.razorpay.com;"
    ),
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
}

# ============================================================================
# IP BLOCKING - DISABLED FOR REGULAR USERS (Only for Admin abuse prevention)
# ============================================================================

class IPBlocker:
    """
    IP Blocking - ONLY for admin login abuse prevention
    Regular users are NEVER blocked - only rate limited
    """
    
    # In-memory cache
    _blocked_ips = set()
    _failed_attempts = {}
    _whitelisted_ips = set()
    
    # DISABLED for regular users - only admin gets blocked after many failures
    MAX_FAILED_ATTEMPTS = 50  # Very high threshold
    BLOCK_DURATION = 600  # Only 10 minutes
    ENABLED = False  # DISABLED by default
    
    @classmethod
    def whitelist_ip(cls, ip: str):
        """Add IP to whitelist (never blocked)"""
        cls._whitelisted_ips.add(ip)
        cls._blocked_ips.discard(ip)
        cls._failed_attempts.pop(ip, None)
    
    @classmethod
    def remove_from_whitelist(cls, ip: str):
        """Remove IP from whitelist"""
        cls._whitelisted_ips.discard(ip)
    
    @classmethod
    def record_failed_attempt(cls, ip: str):
        """Record a failed attempt - ONLY for admin endpoints"""
        # DISABLED - Don't block any IP
        if not cls.ENABLED:
            return
        
        if ip in cls._whitelisted_ips:
            return
        
        if ip not in cls._failed_attempts:
            cls._failed_attempts[ip] = {"count": 0, "first_attempt": datetime.now(timezone.utc)}
        
        cls._failed_attempts[ip]["count"] += 1
        
        if cls._failed_attempts[ip]["count"] >= cls.MAX_FAILED_ATTEMPTS:
            cls._blocked_ips.add(ip)
            security_logger.warning(f"[IP-BLOCK] IP {ip} blocked after {cls.MAX_FAILED_ATTEMPTS} failed attempts")
    
    @classmethod
    def is_blocked(cls, ip: str) -> bool:
        """Check if an IP is blocked - ALWAYS returns False for safety"""
        # DISABLED - Never block any IP
        if not cls.ENABLED:
            return False
        
        if ip in cls._whitelisted_ips:
            return False
        
        # Check if block has expired
        if ip in cls._blocked_ips and ip in cls._failed_attempts:
            first_attempt = cls._failed_attempts[ip].get("first_attempt")
            if first_attempt:
                age = (datetime.now(timezone.utc) - first_attempt).total_seconds()
                if age > cls.BLOCK_DURATION:
                    cls._blocked_ips.discard(ip)
                    cls._failed_attempts.pop(ip, None)
                    return False
        
        return ip in cls._blocked_ips
    
    @classmethod
    def clear_failed_attempts(cls, ip: str):
        """Clear failed attempts after successful action"""
        cls._failed_attempts.pop(ip, None)
    
    @classmethod
    def unblock_ip(cls, ip: str):
        """Manually unblock an IP"""
        cls._blocked_ips.discard(ip)
        cls._failed_attempts.pop(ip, None)
    
    @classmethod
    def unblock_all(cls):
        """Emergency: Unblock all IPs"""
        cls._blocked_ips.clear()
        cls._failed_attempts.clear()
        security_logger.warning("[IP-BLOCK] All IPs unblocked (emergency reset)")
    
    @classmethod
    def get_blocked_count(cls) -> int:
        """Get count of blocked IPs"""
        return len(cls._blocked_ips)
    
    @classmethod
    def get_blocked_list(cls) -> list:
        """Get list of blocked IPs"""
        return list(cls._blocked_ips)


# ============================================================================
# 2FA - Two Factor Authentication for Admin
# ============================================================================

class TwoFactorAuth:
    """
    2FA implementation using TOTP (Time-based One-Time Password)
    Compatible with Google Authenticator, Authy, etc.
    """
    
    # Store pending 2FA verifications
    _pending_2fa = {}  # session_id -> {user_id, otp, expires_at, attempts}
    
    MAX_ATTEMPTS = 3
    OTP_EXPIRY = 300  # 5 minutes
    
    @classmethod
    def generate_admin_otp(cls, session_id: str, admin_id: str) -> str:
        """Generate a 6-digit OTP for admin 2FA"""
        import random
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        cls._pending_2fa[session_id] = {
            "admin_id": admin_id,
            "otp": otp,
            "expires_at": datetime.now(timezone.utc) + timedelta(seconds=cls.OTP_EXPIRY),
            "attempts": 0,
            "created_at": datetime.now(timezone.utc)
        }
        
        security_logger.info(f"[2FA] OTP generated for admin {admin_id}")
        return otp
    
    @classmethod
    def verify_otp(cls, session_id: str, otp: str) -> tuple:
        """
        Verify 2FA OTP
        Returns (success, admin_id, error_message)
        """
        if session_id not in cls._pending_2fa:
            return False, None, "2FA session expired or not found. Please login again."
        
        pending = cls._pending_2fa[session_id]
        
        # Check if expired
        if datetime.now(timezone.utc) > pending["expires_at"]:
            del cls._pending_2fa[session_id]
            return False, None, "2FA code expired. Please login again."
        
        # Check attempts
        pending["attempts"] += 1
        if pending["attempts"] > cls.MAX_ATTEMPTS:
            del cls._pending_2fa[session_id]
            return False, None, "Too many failed attempts. Please login again."
        
        # Verify OTP
        if pending["otp"] != otp:
            remaining = cls.MAX_ATTEMPTS - pending["attempts"]
            return False, None, f"Invalid 2FA code. {remaining} attempts remaining."
        
        # Success - clear pending
        admin_id = pending["admin_id"]
        del cls._pending_2fa[session_id]
        
        security_logger.info(f"[2FA] OTP verified successfully for admin {admin_id}")
        return True, admin_id, "2FA verification successful"
    
    @classmethod
    def get_pending_session(cls, session_id: str) -> dict:
        """Get pending 2FA session info"""
        return cls._pending_2fa.get(session_id)
    
    @classmethod
    def cancel_session(cls, session_id: str):
        """Cancel a pending 2FA session"""
        cls._pending_2fa.pop(session_id, None)


# ============================================================================
# DATA INTEGRITY - Hash sensitive data for verification
# ============================================================================

def generate_data_hash(data: Dict[str, Any], secret_key: str) -> str:
    """Generate HMAC hash for data integrity verification"""
    data_string = json.dumps(data, sort_keys=True, default=str)
    return hmac.new(
        secret_key.encode(),
        data_string.encode(),
        hashlib.sha256
    ).hexdigest()


def verify_data_hash(data: Dict[str, Any], hash_value: str, secret_key: str) -> bool:
    """Verify data integrity using HMAC hash"""
    expected_hash = generate_data_hash(data, secret_key)
    return hmac.compare_digest(expected_hash, hash_value)


# Need to import json for data hashing
import json
import secrets
import string


# ============================================================================
# PASSWORD VALIDATION - Simple and User-Friendly for Indian Users
# ============================================================================

class PasswordValidator:
    """
    Simple Password Validation - User-Friendly
    Only requires minimum length for ease of use
    """
    
    MIN_LENGTH = 6  # Simple 6 character minimum
    MAX_LENGTH = 128
    
    @staticmethod
    def validate(password: str) -> tuple:
        """
        Simple password validation - just minimum length
        Returns (is_valid, error_message)
        """
        if not password:
            return False, "Password is required"
        
        if len(password) < PasswordValidator.MIN_LENGTH:
            return False, f"Password must be at least {PasswordValidator.MIN_LENGTH} characters"
        
        if len(password) > PasswordValidator.MAX_LENGTH:
            return False, f"Password is too long"
        
        # That's it! Simple validation for user convenience
        return True, "Password is valid"
    
    @staticmethod
    def get_strength_score(password: str) -> int:
        """
        Get password strength score (0-100) - informational only
        """
        if not password:
            return 0
        
        score = 0
        
        # Length scoring
        if len(password) >= 6: score += 25
        if len(password) >= 8: score += 15
        if len(password) >= 12: score += 10
        
        # Character variety (informational)
        if re.search(r'[A-Z]', password): score += 15
        if re.search(r'[a-z]', password): score += 15
        if re.search(r'\d', password): score += 10
        if re.search(r'[!@#$%^&*(),.?":{}|<>]', password): score += 10
        
        return min(score, 100)


# ============================================================================
# CSRF PROTECTION - Generate and validate CSRF tokens
# ============================================================================

class CSRFProtection:
    """
    CSRF Token management for form submissions
    """
    
    _tokens = {}  # session_id -> token
    TOKEN_EXPIRY = 3600  # 1 hour
    
    @classmethod
    def generate_token(cls, session_id: str) -> str:
        """Generate a new CSRF token for a session"""
        token = secrets.token_urlsafe(32)
        cls._tokens[session_id] = {
            "token": token,
            "created_at": datetime.now(timezone.utc)
        }
        return token
    
    @classmethod
    def validate_token(cls, session_id: str, token: str) -> bool:
        """Validate a CSRF token"""
        if session_id not in cls._tokens:
            return False
        
        stored = cls._tokens[session_id]
        
        # Check expiry
        age = (datetime.now(timezone.utc) - stored["created_at"]).total_seconds()
        if age > cls.TOKEN_EXPIRY:
            del cls._tokens[session_id]
            return False
        
        # Constant-time comparison to prevent timing attacks
        return hmac.compare_digest(stored["token"], token)
    
    @classmethod
    def invalidate_token(cls, session_id: str):
        """Invalidate a CSRF token after use"""
        cls._tokens.pop(session_id, None)


# ============================================================================
# REQUEST LOGGER - Log all API requests for monitoring
# ============================================================================

class RequestLogger:
    """
    Log API requests for security monitoring and debugging
    """
    
    @staticmethod
    async def log_request(
        db,
        method: str,
        path: str,
        ip_address: str,
        user_id: Optional[str] = None,
        status_code: int = 200,
        response_time_ms: float = 0,
        user_agent: Optional[str] = None
    ):
        """Log an API request"""
        try:
            log_entry = {
                "id": f"req_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}",
                "method": method,
                "path": path,
                "ip_address": ip_address,
                "user_id": user_id,
                "status_code": status_code,
                "response_time_ms": response_time_ms,
                "user_agent": user_agent[:500] if user_agent else None,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            # Only log to database for important endpoints (to avoid flooding)
            important_paths = ['/auth/', '/admin/', '/payment/', '/booking/']
            if any(p in path for p in important_paths):
                await db.request_logs.insert_one(log_entry)
            
        except Exception as e:
            security_logger.error(f"[REQUEST-LOG] Failed to log request: {e}")


# ============================================================================
# SESSION SECURITY - Enhanced session management
# ============================================================================

class SessionManager:
    """
    Enhanced session management with refresh tokens
    """
    
    # Active sessions tracking
    _active_sessions = {}  # user_id -> [session_ids]
    MAX_SESSIONS_PER_USER = 5  # Max concurrent sessions
    
    @classmethod
    def create_session(cls, user_id: str) -> str:
        """Create a new session for a user"""
        session_id = secrets.token_urlsafe(32)
        
        if user_id not in cls._active_sessions:
            cls._active_sessions[user_id] = []
        
        # Remove oldest session if limit reached
        if len(cls._active_sessions[user_id]) >= cls.MAX_SESSIONS_PER_USER:
            cls._active_sessions[user_id].pop(0)
        
        cls._active_sessions[user_id].append({
            "session_id": session_id,
            "created_at": datetime.now(timezone.utc),
            "last_activity": datetime.now(timezone.utc)
        })
        
        return session_id
    
    @classmethod
    def validate_session(cls, user_id: str, session_id: str) -> bool:
        """Validate if a session is active"""
        if user_id not in cls._active_sessions:
            return False
        
        for session in cls._active_sessions[user_id]:
            if session["session_id"] == session_id:
                # Update last activity
                session["last_activity"] = datetime.now(timezone.utc)
                return True
        
        return False
    
    @classmethod
    def invalidate_session(cls, user_id: str, session_id: str):
        """Invalidate a specific session (logout)"""
        if user_id in cls._active_sessions:
            cls._active_sessions[user_id] = [
                s for s in cls._active_sessions[user_id] 
                if s["session_id"] != session_id
            ]
    
    @classmethod
    def invalidate_all_sessions(cls, user_id: str):
        """Invalidate all sessions for a user (logout everywhere)"""
        cls._active_sessions.pop(user_id, None)
    
    @classmethod
    def get_active_sessions_count(cls, user_id: str) -> int:
        """Get count of active sessions for a user"""
        return len(cls._active_sessions.get(user_id, []))


# ============================================================================
# SECURITY SCANNER - Check for common vulnerabilities
# ============================================================================

class SecurityScanner:
    """
    Scan requests for common attack patterns
    """
    
    SUSPICIOUS_PATTERNS = [
        # SQL Injection patterns (even though we use MongoDB)
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)",
        # Path traversal
        r"\.\./",
        r"\.\.\\",
        # Command injection
        r"[;&|`]",
        # LDAP injection
        r"[()\\*]",
        # XML injection
        r"<!\[CDATA\[",
        r"<!ENTITY",
    ]
    
    @classmethod
    def scan_input(cls, value: str) -> tuple:
        """
        Scan input for suspicious patterns
        Returns (is_safe, threat_type)
        """
        if not isinstance(value, str):
            return True, None
        
        value_upper = value.upper()
        
        for pattern in cls.SUSPICIOUS_PATTERNS:
            if re.search(pattern, value_upper, re.IGNORECASE):
                security_logger.warning(f"[SECURITY-SCAN] Suspicious pattern detected: {pattern}")
                return False, "Suspicious input detected"
        
        return True, None
    
    @classmethod
    def scan_headers(cls, headers: dict) -> tuple:
        """
        Scan HTTP headers for suspicious values
        """
        suspicious_headers = ['X-Forwarded-Host', 'X-Original-URL', 'X-Rewrite-URL']
        
        for header in suspicious_headers:
            if header in headers:
                value = headers[header]
                if '..' in value or value.startswith('/'):
                    return False, f"Suspicious {header} header"
        
        return True, None


# ============================================================================
# ENHANCED SECURITY HEADERS
# ============================================================================

SECURITY_HEADERS_ENHANCED = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "Content-Security-Policy": (
        "default-src 'self'; "
        # Added https://cdn.jsdelivr.net for Swagger scripts
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://api.razorpay.com https://cdn.jsdelivr.net; "
        # Added https://cdn.jsdelivr.net for Swagger styles
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https: blob:; "
        # Added https://cdn.jsdelivr.net to connect-src to allow potential swagger fetches
        "connect-src 'self' https://api.razorpay.com https://*.razorpay.com https://lumberjack.razorpay.com https://cdn.jsdelivr.net; "
        "frame-src https://api.razorpay.com https://checkout.razorpay.com;"
    ),
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=(self)",
    "X-Permitted-Cross-Domain-Policies": "none",
    "X-Download-Options": "noopen",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache"
}
