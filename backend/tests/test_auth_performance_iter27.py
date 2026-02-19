"""
Auth Performance Test - Iteration 27
=====================================
Testing that auth endpoints respond in under 500ms as per requirements:
- Send OTP: < 500ms
- Verify OTP: < 500ms  
- Password Login: < 500ms
- Admin Login: < 500ms
"""

import pytest
import requests
import time
import os
import random
import string

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://bulletproof-auth-2.preview.emergentagent.com"

# Performance threshold in ms
PERFORMANCE_THRESHOLD_MS = 500

# Admin credentials
ADMIN_USERNAME = "amit845401"
ADMIN_PASSWORD = "Amit@9810"
TEST_PHONE = "9876543210"


class TestHealthEndpoint:
    """Quick health check to confirm API is up"""
    
    def test_health_check(self):
        start = time.time()
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        elapsed_ms = (time.time() - start) * 1000
        
        assert response.status_code == 200, f"Health check failed with {response.status_code}"
        data = response.json()
        assert data.get("status") == "healthy", f"API unhealthy: {data}"
        print(f"✅ Health check: {elapsed_ms:.0f}ms")


class TestSendOTPPerformance:
    """Test Send OTP endpoint performance - should respond in < 500ms"""
    
    def test_send_otp_performance_valid_phone(self):
        """Send OTP with valid 10-digit phone - should be < 500ms"""
        test_phone = f"9{random.randint(100000000, 999999999)}"  # Random valid phone
        
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": test_phone},
            timeout=15
        )
        elapsed_ms = (time.time() - start) * 1000
        
        # Check response
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Expected success=true: {data}"
        
        # Performance check
        print(f"✅ Send OTP ({test_phone}): {elapsed_ms:.0f}ms")
        assert elapsed_ms < PERFORMANCE_THRESHOLD_MS, f"Send OTP too slow: {elapsed_ms:.0f}ms > {PERFORMANCE_THRESHOLD_MS}ms"
    
    def test_send_otp_performance_with_country_code(self):
        """Send OTP with +91 prefix - should be < 500ms"""
        test_phone = f"+91{random.randint(9000000000, 9999999999)}"
        
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": test_phone},
            timeout=15
        )
        elapsed_ms = (time.time() - start) * 1000
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✅ Send OTP with +91 prefix: {elapsed_ms:.0f}ms")
        assert elapsed_ms < PERFORMANCE_THRESHOLD_MS, f"Too slow: {elapsed_ms:.0f}ms"
    
    def test_send_otp_validation_error_fast(self):
        """Even validation errors should be fast"""
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": "123"},  # Invalid short phone
            timeout=15
        )
        elapsed_ms = (time.time() - start) * 1000
        
        assert response.status_code == 400, f"Expected 400 for invalid phone"
        print(f"✅ Send OTP validation error: {elapsed_ms:.0f}ms")
        assert elapsed_ms < PERFORMANCE_THRESHOLD_MS, f"Validation error too slow: {elapsed_ms:.0f}ms"


class TestVerifyOTPPerformance:
    """Test Verify OTP endpoint performance - should respond in < 500ms"""
    
    def test_verify_otp_expired_fast(self):
        """Verify OTP for non-existent/expired OTP - should be fast"""
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={
                "phone": "9876543210",
                "otp": "123456",
                "role": "client",
                "name": "Test User",
                "email": "test@example.com",
                "city": "Delhi"
            },
            timeout=15
        )
        elapsed_ms = (time.time() - start) * 1000
        
        # Should return 400 for expired/not found OTP
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "expired" in data.get("detail", "").lower() or "not found" in data.get("detail", "").lower(), \
            f"Expected 'expired or not found' error: {data}"
        
        print(f"✅ Verify OTP (expired): {elapsed_ms:.0f}ms")
        assert elapsed_ms < PERFORMANCE_THRESHOLD_MS, f"Verify OTP too slow: {elapsed_ms:.0f}ms"
    
    def test_verify_otp_validation_error_fast(self):
        """Verify OTP with invalid OTP format - should be fast"""
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={
                "phone": "9876543210",
                "otp": "123",  # Invalid - not 6 digits
                "role": "client",
                "name": "Test",
                "city": "Delhi"
            },
            timeout=15
        )
        elapsed_ms = (time.time() - start) * 1000
        
        assert response.status_code == 400
        print(f"✅ Verify OTP validation error: {elapsed_ms:.0f}ms")
        assert elapsed_ms < PERFORMANCE_THRESHOLD_MS, f"Too slow: {elapsed_ms:.0f}ms"


class TestPasswordLoginPerformance:
    """Test Password Login endpoint performance - should respond in < 500ms"""
    
    def test_password_login_account_not_found_fast(self):
        """Password login with non-existent account - should be fast"""
        random_phone = f"9{random.randint(100000000, 999999999)}"
        
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/password-login",
            json={
                "phone": random_phone,
                "password": "TestPass123!"
            },
            timeout=15
        )
        elapsed_ms = (time.time() - start) * 1000
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "not found" in data.get("detail", "").lower(), f"Expected 'not found': {data}"
        
        print(f"✅ Password login (not found): {elapsed_ms:.0f}ms")
        assert elapsed_ms < PERFORMANCE_THRESHOLD_MS, f"Too slow: {elapsed_ms:.0f}ms"
    
    def test_password_login_validation_error_fast(self):
        """Password login with invalid phone - should be fast"""
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/password-login",
            json={
                "phone": "123",  # Invalid
                "password": "TestPass123!"
            },
            timeout=15
        )
        elapsed_ms = (time.time() - start) * 1000
        
        assert response.status_code == 400
        print(f"✅ Password login validation: {elapsed_ms:.0f}ms")
        assert elapsed_ms < PERFORMANCE_THRESHOLD_MS, f"Too slow: {elapsed_ms:.0f}ms"
    
    def test_password_login_empty_password_fast(self):
        """Password login with empty password - should be fast"""
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/password-login",
            json={
                "phone": "9876543210",
                "password": ""
            },
            timeout=15
        )
        elapsed_ms = (time.time() - start) * 1000
        
        assert response.status_code == 400
        print(f"✅ Password login empty password: {elapsed_ms:.0f}ms")
        assert elapsed_ms < PERFORMANCE_THRESHOLD_MS, f"Too slow: {elapsed_ms:.0f}ms"


class TestAdminLoginPerformance:
    """Test Admin Login endpoint performance - should respond in < 500ms"""
    
    def test_admin_login_success_fast(self):
        """Admin login with correct credentials - should be < 500ms"""
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD
            },
            timeout=15
        )
        elapsed_ms = (time.time() - start) * 1000
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data, f"Expected token in response: {data}"
        assert "user" in data, f"Expected user in response: {data}"
        assert data["user"].get("role") == "admin", f"Expected admin role: {data}"
        
        print(f"✅ Admin login SUCCESS: {elapsed_ms:.0f}ms")
        assert elapsed_ms < PERFORMANCE_THRESHOLD_MS, f"Admin login too slow: {elapsed_ms:.0f}ms"
    
    def test_admin_login_wrong_credentials_fast(self):
        """Admin login with wrong credentials - should be fast"""
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={
                "username": "wronguser",
                "password": "wrongpass"
            },
            timeout=15
        )
        elapsed_ms = (time.time() - start) * 1000
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "invalid" in data.get("detail", "").lower(), f"Expected invalid error: {data}"
        
        print(f"✅ Admin login (wrong creds): {elapsed_ms:.0f}ms")
        assert elapsed_ms < PERFORMANCE_THRESHOLD_MS, f"Too slow: {elapsed_ms:.0f}ms"
    
    def test_admin_login_case_insensitive_username_fast(self):
        """Admin login with uppercase username - should be fast"""
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={
                "username": ADMIN_USERNAME.upper(),  # AMIT845401
                "password": ADMIN_PASSWORD
            },
            timeout=15
        )
        elapsed_ms = (time.time() - start) * 1000
        
        assert response.status_code == 200, f"Expected 200 (case-insensitive), got {response.status_code}"
        print(f"✅ Admin login (uppercase): {elapsed_ms:.0f}ms")
        assert elapsed_ms < PERFORMANCE_THRESHOLD_MS, f"Too slow: {elapsed_ms:.0f}ms"


class TestAuthMePerformance:
    """Test auth/me endpoint performance"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated tests"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
            timeout=15
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not get admin token")
    
    def test_auth_me_with_valid_token_fast(self, admin_token):
        """Get current user with valid token - should be fast"""
        start = time.time()
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=15
        )
        elapsed_ms = (time.time() - start) * 1000
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("role") == "admin"
        
        print(f"✅ Auth/me (valid token): {elapsed_ms:.0f}ms")
        assert elapsed_ms < PERFORMANCE_THRESHOLD_MS, f"Too slow: {elapsed_ms:.0f}ms"
    
    def test_auth_me_no_token_fast(self):
        """Get current user without token - should be fast 401"""
        start = time.time()
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            timeout=15
        )
        elapsed_ms = (time.time() - start) * 1000
        
        assert response.status_code in [401, 403]
        print(f"✅ Auth/me (no token): {elapsed_ms:.0f}ms")
        assert elapsed_ms < PERFORMANCE_THRESHOLD_MS, f"Too slow: {elapsed_ms:.0f}ms"


class TestConcurrentPerformance:
    """Test performance under light concurrent load"""
    
    def test_multiple_send_otp_sequential(self):
        """Send 3 OTPs sequentially - all should be < 500ms"""
        phones = [f"9{random.randint(100000000, 999999999)}" for _ in range(3)]
        times = []
        
        for phone in phones:
            start = time.time()
            response = requests.post(
                f"{BASE_URL}/api/auth/send-otp",
                json={"phone": phone},
                timeout=15
            )
            elapsed_ms = (time.time() - start) * 1000
            times.append(elapsed_ms)
            
            assert response.status_code == 200, f"Failed for {phone}"
        
        avg_time = sum(times) / len(times)
        max_time = max(times)
        
        print(f"✅ 3 Send OTPs: avg={avg_time:.0f}ms, max={max_time:.0f}ms")
        for i, t in enumerate(times):
            assert t < PERFORMANCE_THRESHOLD_MS, f"Request {i+1} too slow: {t:.0f}ms"
    
    def test_multiple_admin_logins_sequential(self):
        """3 admin logins sequentially - all should be < 500ms"""
        times = []
        
        for i in range(3):
            start = time.time()
            response = requests.post(
                f"{BASE_URL}/api/auth/admin-login",
                json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
                timeout=15
            )
            elapsed_ms = (time.time() - start) * 1000
            times.append(elapsed_ms)
            
            assert response.status_code == 200, f"Failed attempt {i+1}"
        
        avg_time = sum(times) / len(times)
        max_time = max(times)
        
        print(f"✅ 3 Admin logins: avg={avg_time:.0f}ms, max={max_time:.0f}ms")
        for i, t in enumerate(times):
            assert t < PERFORMANCE_THRESHOLD_MS, f"Request {i+1} too slow: {t:.0f}ms"


class TestErrorMessagesUserFriendly:
    """Verify error messages are user-friendly"""
    
    def test_send_otp_invalid_phone_message(self):
        """Check send-otp error message is user-friendly"""
        response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": "abc"},
            timeout=15
        )
        assert response.status_code == 400
        data = response.json()
        detail = data.get("detail", "")
        assert "valid 10-digit" in detail.lower() or "mobile" in detail.lower(), \
            f"Error message not user-friendly: {detail}"
        print(f"✅ Send OTP error message: '{detail}'")
    
    def test_verify_otp_expired_message(self):
        """Check verify-otp expired error message is user-friendly"""
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={"phone": "9876543210", "otp": "123456", "role": "client", "name": "Test", "city": "Delhi"},
            timeout=15
        )
        assert response.status_code == 400
        data = response.json()
        detail = data.get("detail", "")
        assert "expired" in detail.lower() or "not found" in detail.lower() or "new otp" in detail.lower(), \
            f"Error message not user-friendly: {detail}"
        print(f"✅ Verify OTP error message: '{detail}'")
    
    def test_password_login_not_found_message(self):
        """Check password-login not found error message is user-friendly"""
        response = requests.post(
            f"{BASE_URL}/api/auth/password-login",
            json={"phone": "9999888877", "password": "test123"},
            timeout=15
        )
        assert response.status_code == 401
        data = response.json()
        detail = data.get("detail", "")
        assert "not found" in detail.lower() or "signup" in detail.lower() or "otp" in detail.lower(), \
            f"Error message not user-friendly: {detail}"
        print(f"✅ Password login error message: '{detail}'")
    
    def test_admin_login_invalid_message(self):
        """Check admin-login invalid error message is user-friendly"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"username": "wrong", "password": "wrong"},
            timeout=15
        )
        assert response.status_code == 401
        data = response.json()
        detail = data.get("detail", "")
        assert "invalid" in detail.lower() or "incorrect" in detail.lower() or "password" in detail.lower(), \
            f"Error message not user-friendly: {detail}"
        print(f"✅ Admin login error message: '{detail}'")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
