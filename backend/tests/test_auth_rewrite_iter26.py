"""
AUTH REWRITE TEST - Iteration 26
================================
Testing the completely rewritten LoginModal and AdminLogin components.

Tests:
- OTP Login flow: Send OTP, Verify OTP
- Password Login flow
- Admin Login flow
- Error handling for all flows
"""

import pytest
import requests
import os
import random

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSendOTP:
    """Test /api/auth/send-otp endpoint"""
    
    def test_send_otp_success_valid_phone(self):
        """Send OTP to valid 10-digit phone number"""
        test_phone = f"98765{random.randint(10000, 99999)}"
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": test_phone}, timeout=30)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "OTP" in data.get("message", "") or "sent" in data.get("message", "").lower()
        print(f"✅ Send OTP Success: {data.get('message')}")
    
    def test_send_otp_empty_phone(self):
        """Send OTP with empty phone number"""
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": ""}, timeout=30)
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "Mobile number is required" in data.get("detail", "")
        print(f"✅ Empty phone rejected: {data.get('detail')}")
    
    def test_send_otp_short_phone(self):
        """Send OTP with short phone number (< 10 digits)"""
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": "12345"}, timeout=30)
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "10-digit" in data.get("detail", "").lower() or "valid" in data.get("detail", "").lower()
        print(f"✅ Short phone rejected: {data.get('detail')}")
    
    def test_send_otp_with_country_code(self):
        """Send OTP with +91 country code - should extract last 10 digits"""
        test_phone = f"+919876{random.randint(100000, 999999)}"
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": test_phone}, timeout=30)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"✅ Country code handled: {data.get('message')}")


class TestVerifyOTP:
    """Test /api/auth/verify-otp endpoint"""
    
    def test_verify_otp_invalid_format(self):
        """Verify OTP with invalid format (not 6 digits)"""
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "9876543210",
            "otp": "12345",  # Only 5 digits
            "role": "client",
            "name": "Test User",
            "email": "test@example.com",
            "city": "Delhi"
        }, timeout=30)
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "6-digit" in data.get("detail", "").lower() or "valid" in data.get("detail", "").lower()
        print(f"✅ Invalid OTP format rejected: {data.get('detail')}")
    
    def test_verify_otp_expired_or_not_found(self):
        """Verify OTP that doesn't exist"""
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "1234567890",  # Non-existent user
            "otp": "999999",
            "role": "client",
            "name": "Test User",
            "email": "test@example.com",
            "city": "Delhi"
        }, timeout=30)
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "expired" in data.get("detail", "").lower() or "not found" in data.get("detail", "").lower()
        print(f"✅ Non-existent OTP rejected: {data.get('detail')}")
    
    def test_verify_otp_wrong_code_shows_attempts(self):
        """Verify OTP with wrong code and check remaining attempts message"""
        # First send OTP
        test_phone = f"98765{random.randint(10000, 99999)}"
        send_response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": test_phone}, timeout=30)
        assert send_response.status_code == 200, f"Failed to send OTP: {send_response.text}"
        
        # Now verify with wrong OTP
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": test_phone,
            "otp": "000000",  # Wrong OTP
            "role": "client",
            "name": "Test User",
            "email": "test@example.com",
            "city": "Delhi"
        }, timeout=30)
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        # Should show remaining attempts
        assert "attempt" in data.get("detail", "").lower() or "incorrect" in data.get("detail", "").lower()
        print(f"✅ Wrong OTP shows attempts: {data.get('detail')}")


class TestPasswordLogin:
    """Test /api/auth/password-login endpoint"""
    
    def test_password_login_empty_phone(self):
        """Password login with short phone"""
        response = requests.post(f"{BASE_URL}/api/auth/password-login", json={
            "phone": "123",
            "password": "testpass"
        }, timeout=30)
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "10-digit" in data.get("detail", "").lower() or "valid" in data.get("detail", "").lower()
        print(f"✅ Short phone rejected: {data.get('detail')}")
    
    def test_password_login_empty_password(self):
        """Password login with empty password"""
        response = requests.post(f"{BASE_URL}/api/auth/password-login", json={
            "phone": "9876543210",
            "password": ""
        }, timeout=30)
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "password" in data.get("detail", "").lower()
        print(f"✅ Empty password rejected: {data.get('detail')}")
    
    def test_password_login_account_not_found(self):
        """Password login with non-existent account"""
        response = requests.post(f"{BASE_URL}/api/auth/password-login", json={
            "phone": "1111111111",  # Non-existent
            "password": "testpass123"
        }, timeout=30)
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "not found" in data.get("detail", "").lower() or "signup" in data.get("detail", "").lower()
        print(f"✅ Non-existent account rejected: {data.get('detail')}")


class TestAdminLogin:
    """Test /api/auth/admin-login endpoint"""
    
    def test_admin_login_success(self):
        """Admin login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "username": "amit845401",
            "password": "Amit@9810"
        }, timeout=30)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        print(f"✅ Admin login successful: {data.get('message')}")
    
    def test_admin_login_case_insensitive_username(self):
        """Admin login with uppercase username"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "username": "AMIT845401",
            "password": "Amit@9810"
        }, timeout=30)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        print(f"✅ Case-insensitive username works")
    
    def test_admin_login_wrong_username(self):
        """Admin login with wrong username"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "username": "wronguser",
            "password": "Amit@9810"
        }, timeout=30)
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "invalid" in data.get("detail", "").lower()
        print(f"✅ Wrong username rejected: {data.get('detail')}")
    
    def test_admin_login_wrong_password(self):
        """Admin login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "username": "amit845401",
            "password": "wrongpassword"
        }, timeout=30)
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "invalid" in data.get("detail", "").lower()
        print(f"✅ Wrong password rejected: {data.get('detail')}")
    
    def test_admin_login_empty_username(self):
        """Admin login with empty username"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "username": "",
            "password": "Amit@9810"
        }, timeout=30)
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "invalid" in data.get("detail", "").lower()
        print(f"✅ Empty username rejected")


class TestAuthMe:
    """Test /api/auth/me endpoint"""
    
    def test_auth_me_with_valid_token(self):
        """Get current user with valid admin token"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "username": "amit845401",
            "password": "Amit@9810"
        }, timeout=30)
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        token = login_response.json()["token"]
        
        # Now get user
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        }, timeout=30)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("role") == "admin"
        print(f"✅ Auth/me works with valid token")
    
    def test_auth_me_without_token(self):
        """Get current user without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me", timeout=30)
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✅ Auth/me rejects missing token")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
