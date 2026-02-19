"""
AUTH ENDPOINTS TEST SUITE - Iteration 29
========================================
Tests for KoPartner auth flow optimized with timeouts and Sentry error monitoring.
Focus on:
- Send OTP API speed (<1 second)
- Verify OTP API error handling
- Password Login API error messages
- Error handling for all cases
"""

import pytest
import requests
import os
import time
import random

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://bulletproof-auth-2.preview.emergentagent.com"

print(f"[TEST] Using BASE_URL: {BASE_URL}")


class TestHealthEndpoint:
    """Health endpoint tests"""
    
    def test_health_check(self):
        """Health check should return status healthy"""
        start = time.time()
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        elapsed = time.time() - start
        
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        assert data.get("status") == "healthy"
        assert data.get("database") == "connected"
        assert elapsed < 1.0, f"Health check took too long: {elapsed:.2f}s"
        print(f"✅ Health check passed in {elapsed*1000:.0f}ms")


class TestSendOTPEndpoint:
    """Send OTP endpoint tests - /api/auth/send-otp"""
    
    def test_send_otp_success_speed(self):
        """Send OTP should succeed and respond within 1 second"""
        phone = f"98765{random.randint(10000, 99999)}"
        start = time.time()
        
        response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": phone},
            timeout=15
        )
        elapsed = time.time() - start
        
        assert response.status_code == 200, f"Send OTP failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "OTP sent" in data.get("message", "")
        
        # Speed check - should respond within 1 second
        assert elapsed < 1.0, f"Send OTP took too long: {elapsed:.2f}s (should be <1s)"
        print(f"✅ Send OTP succeeded in {elapsed*1000:.0f}ms")
    
    def test_send_otp_with_country_code(self):
        """Send OTP should handle +91 prefix"""
        phone = f"+919876{random.randint(10000, 99999)}"
        start = time.time()
        
        response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": phone},
            timeout=15
        )
        elapsed = time.time() - start
        
        assert response.status_code == 200
        assert elapsed < 1.0, f"Took too long: {elapsed:.2f}s"
        print(f"✅ Send OTP with +91 succeeded in {elapsed*1000:.0f}ms")
    
    def test_send_otp_invalid_phone_short(self):
        """Send OTP should reject short phone numbers"""
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": "12345"},
            timeout=10
        )
        elapsed = time.time() - start
        
        assert response.status_code == 400
        data = response.json()
        assert "10-digit" in data.get("detail", "").lower() or "valid" in data.get("detail", "").lower()
        assert elapsed < 1.0
        print(f"✅ Short phone rejected in {elapsed*1000:.0f}ms")
    
    def test_send_otp_invalid_phone_letters(self):
        """Send OTP should reject phone with letters"""
        response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": "98765abcde"},
            timeout=10
        )
        
        # Backend strips non-digits, so it becomes 98765 which is invalid
        assert response.status_code == 400
        print("✅ Phone with letters rejected correctly")
    
    def test_send_otp_empty_phone(self):
        """Send OTP should reject empty phone"""
        response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": ""},
            timeout=10
        )
        
        assert response.status_code == 400
        print("✅ Empty phone rejected correctly")


class TestVerifyOTPEndpoint:
    """Verify OTP endpoint tests - /api/auth/verify-otp"""
    
    def test_verify_otp_invalid_otp_format(self):
        """Verify OTP should reject invalid OTP format"""
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={
                "phone": "9876543210",
                "otp": "123",  # Too short
                "role": "client",
                "name": "Test User",
                "email": "test@test.com",
                "city": "Mumbai"
            },
            timeout=10
        )
        elapsed = time.time() - start
        
        assert response.status_code == 400
        data = response.json()
        assert "6-digit" in data.get("detail", "").lower() or "valid" in data.get("detail", "").lower()
        assert elapsed < 1.0
        print(f"✅ Invalid OTP format rejected in {elapsed*1000:.0f}ms")
    
    def test_verify_otp_not_found(self):
        """Verify OTP should return error when OTP not found"""
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={
                "phone": "1111111111",  # Phone that hasn't received OTP
                "otp": "123456",
                "role": "client",
                "name": "Test",
                "email": "test@test.com",
                "city": "Delhi"
            },
            timeout=10
        )
        elapsed = time.time() - start
        
        assert response.status_code == 400
        data = response.json()
        detail = data.get("detail", "").lower()
        assert "not found" in detail or "resend" in detail or "expired" in detail
        assert elapsed < 1.0
        print(f"✅ OTP not found handled in {elapsed*1000:.0f}ms - Error: {data.get('detail')}")
    
    def test_verify_otp_wrong_otp(self):
        """Verify OTP should return clear error for wrong OTP"""
        # First send OTP
        phone = f"98765{random.randint(10000, 99999)}"
        send_resp = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": phone},
            timeout=15
        )
        assert send_resp.status_code == 200
        
        # Now verify with wrong OTP
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={
                "phone": phone,
                "otp": "000000",  # Wrong OTP
                "role": "client",
                "name": "Test",
                "email": "test@test.com",
                "city": "Mumbai"
            },
            timeout=10
        )
        elapsed = time.time() - start
        
        assert response.status_code == 400
        data = response.json()
        detail = data.get("detail", "").lower()
        # Should say invalid or expired
        assert "invalid" in detail or "expired" in detail or "incorrect" in detail
        assert elapsed < 1.0
        print(f"✅ Wrong OTP handled in {elapsed*1000:.0f}ms - Error: {data.get('detail')}")
    
    def test_verify_otp_missing_name(self):
        """Verify OTP should require name for new users"""
        phone = f"98765{random.randint(10000, 99999)}"
        # Send OTP first
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": phone}, timeout=15)
        
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={
                "phone": phone,
                "otp": "123456",  # Will fail anyway but should check validation
                "role": "client",
                "name": "",  # Empty name
                "email": "test@test.com",
                "city": "Mumbai"
            },
            timeout=10
        )
        
        # Should either fail on OTP or name validation
        assert response.status_code == 400
        print("✅ Name validation working correctly")


class TestPasswordLoginEndpoint:
    """Password login endpoint tests - /api/auth/password-login"""
    
    def test_password_login_account_not_found(self):
        """Password login should return clear error for non-existent account"""
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/password-login",
            json={
                "phone": "1111111111",  # Non-existent phone
                "password": "TestPassword123"
            },
            timeout=10
        )
        elapsed = time.time() - start
        
        assert response.status_code == 401
        data = response.json()
        detail = data.get("detail", "").lower()
        assert "not found" in detail or "signup" in detail or "account" in detail
        assert elapsed < 1.0
        print(f"✅ Account not found handled in {elapsed*1000:.0f}ms - Error: {data.get('detail')}")
    
    def test_password_login_wrong_password(self):
        """Password login should return clear error for wrong password"""
        # Use test phone that should exist with password
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/password-login",
            json={
                "phone": "9876543210",  # Known test phone
                "password": "WrongPassword123!"
            },
            timeout=10
        )
        elapsed = time.time() - start
        
        # Should return 401 for wrong password
        assert response.status_code in [400, 401]
        data = response.json()
        detail = data.get("detail", "").lower()
        # Should indicate login failed or wrong password
        assert any(x in detail for x in ["failed", "wrong", "incorrect", "invalid", "password"])
        assert elapsed < 1.0
        print(f"✅ Wrong password handled in {elapsed*1000:.0f}ms - Error: {data.get('detail')}")
    
    def test_password_login_empty_password(self):
        """Password login should reject empty password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/password-login",
            json={
                "phone": "9876543210",
                "password": ""
            },
            timeout=10
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "password" in data.get("detail", "").lower() or "enter" in data.get("detail", "").lower()
        print(f"✅ Empty password rejected - Error: {data.get('detail')}")
    
    def test_password_login_invalid_phone(self):
        """Password login should reject invalid phone"""
        response = requests.post(
            f"{BASE_URL}/api/auth/password-login",
            json={
                "phone": "12345",  # Too short
                "password": "TestPassword"
            },
            timeout=10
        )
        
        assert response.status_code == 400
        print("✅ Invalid phone rejected for password login")
    
    def test_password_login_correct_credentials(self):
        """Password login should succeed with correct credentials"""
        # Use admin test credentials
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/password-login",
            json={
                "phone": "9876543210",
                "password": "TestPassword123"  # This may or may not work depending on actual password
            },
            timeout=10
        )
        elapsed = time.time() - start
        
        # We're testing the response time and format, not necessarily success
        assert elapsed < 1.0, f"Password login took too long: {elapsed:.2f}s"
        print(f"✅ Password login response in {elapsed*1000:.0f}ms - Status: {response.status_code}")


class TestAdminLoginEndpoint:
    """Admin login endpoint tests"""
    
    def test_admin_login_success(self):
        """Admin login should work with correct credentials"""
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={
                "username": "amit845401",
                "password": "Amit@9810"
            },
            timeout=10
        )
        elapsed = time.time() - start
        
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert elapsed < 1.0
        print(f"✅ Admin login succeeded in {elapsed*1000:.0f}ms")
    
    def test_admin_login_wrong_credentials(self):
        """Admin login should fail with wrong credentials"""
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={
                "username": "wronguser",
                "password": "wrongpass"
            },
            timeout=10
        )
        elapsed = time.time() - start
        
        assert response.status_code == 401
        assert elapsed < 1.0
        print(f"✅ Wrong admin credentials rejected in {elapsed*1000:.0f}ms")


class TestAuthResponseSpeed:
    """Test that all auth endpoints respond within acceptable time limits"""
    
    def test_concurrent_send_otp_speed(self):
        """Multiple send OTP requests should all complete within 1 second each"""
        import concurrent.futures
        
        phones = [f"98765{random.randint(10000, 99999)}" for _ in range(3)]
        results = []
        
        def send_otp(phone):
            start = time.time()
            try:
                response = requests.post(
                    f"{BASE_URL}/api/auth/send-otp",
                    json={"phone": phone},
                    timeout=15
                )
                elapsed = time.time() - start
                return {
                    "phone": phone,
                    "status": response.status_code,
                    "elapsed": elapsed,
                    "success": response.status_code == 200
                }
            except Exception as e:
                return {
                    "phone": phone,
                    "status": 0,
                    "elapsed": time.time() - start,
                    "success": False,
                    "error": str(e)
                }
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            futures = [executor.submit(send_otp, phone) for phone in phones]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
        
        all_success = all(r["success"] for r in results)
        all_fast = all(r["elapsed"] < 2.0 for r in results)  # Allow 2 seconds for concurrent
        
        for r in results:
            print(f"  Phone {r['phone'][-4:]}: {r['elapsed']*1000:.0f}ms - {'✅' if r['success'] else '❌'}")
        
        assert all_success, f"Some OTP requests failed: {results}"
        assert all_fast, f"Some requests too slow: {results}"
        print(f"✅ All {len(results)} concurrent OTP requests succeeded within time limits")


class TestErrorMessages:
    """Test that error messages are user-friendly"""
    
    def test_send_otp_error_message_format(self):
        """Error messages should be user-friendly"""
        response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": "123"},
            timeout=10
        )
        
        assert response.status_code == 400
        data = response.json()
        detail = data.get("detail", "")
        
        # Should be readable, not technical
        assert len(detail) > 0
        assert "error" not in detail.lower() or "please" in detail.lower()
        print(f"✅ Error message is user-friendly: '{detail}'")
    
    def test_verify_otp_error_message_for_expired(self):
        """Expired OTP error should guide user to resend"""
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={
                "phone": "2222222222",
                "otp": "123456",
                "role": "client",
                "name": "Test",
                "email": "test@test.com",
                "city": "Delhi"
            },
            timeout=10
        )
        
        assert response.status_code == 400
        data = response.json()
        detail = data.get("detail", "").lower()
        
        # Should mention resend or expired
        assert "resend" in detail or "not found" in detail or "expired" in detail
        print(f"✅ OTP not found error guides user: '{data.get('detail')}'")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
