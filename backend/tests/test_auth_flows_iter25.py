"""
KoPartner Authentication Flows - Iteration 25
Tests all authentication endpoints per the review request:
- Send OTP (/api/auth/send-otp)
- Verify OTP (/api/auth/verify-otp) 
- Password Login (/api/auth/password-login)
- Admin Login (/api/auth/admin-login)
- Auth/me (/api/auth/me)
"""
import pytest
import requests
import os
import random
import time

# Get BASE_URL from environment - production preview URL
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bulletproof-auth-2.preview.emergentagent.com').rstrip('/')

# Test credentials from review request
ADMIN_USERNAME = "amit845401"
ADMIN_PASSWORD = "Amit@9810"
TEST_PHONE = "9876543210"


class TestHealthCheck:
    """Basic health check to ensure API is accessible"""
    
    def test_health_endpoint_returns_200(self):
        """Health endpoint should return 200 with healthy status"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"
        print(f"✅ Health check passed: {data}")


class TestSendOTP:
    """Tests for /api/auth/send-otp endpoint"""
    
    def test_send_otp_success_with_valid_phone(self):
        """Send OTP with valid 10-digit phone should succeed"""
        response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": TEST_PHONE},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        # Should return 200 with success=True
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got {data}"
        assert "message" in data
        assert "OTP" in data["message"] or "otp" in data["message"].lower()
        print(f"✅ Send OTP success: {data['message']}")
    
    def test_send_otp_invalid_phone_too_short(self):
        """Send OTP with invalid short phone should fail with 400"""
        response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": "123"},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        # Should mention 10-digit requirement
        assert "10" in data["detail"].lower() or "valid" in data["detail"].lower()
        print(f"✅ Invalid phone rejected correctly: {data['detail']}")
    
    def test_send_otp_invalid_phone_non_numeric(self):
        """Send OTP with non-numeric characters should clean and validate"""
        response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": "abc123"},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        # Should fail because after cleaning only 3 digits remain
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"✅ Non-numeric phone handled: {data['detail']}")
    
    def test_send_otp_cleans_country_code(self):
        """Send OTP should clean +91 country code and accept"""
        response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": "+91" + TEST_PHONE},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        # Should succeed - +91 stripped, 10 digits remain
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✅ Country code cleaned: {data['message']}")
    
    def test_send_otp_empty_phone(self):
        """Send OTP with empty phone should fail with 400"""
        response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": ""},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"✅ Empty phone rejected: {data['detail']}")


class TestVerifyOTP:
    """Tests for /api/auth/verify-otp endpoint"""
    
    def test_verify_otp_wrong_otp_shows_attempts(self):
        """Verify OTP with wrong code should show remaining attempts"""
        # First send OTP to ensure there's a valid one
        requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": TEST_PHONE},
            timeout=30
        )
        
        # Wait a moment
        time.sleep(1)
        
        # Try wrong OTP
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={
                "phone": TEST_PHONE,
                "otp": "000000",  # Wrong OTP
                "role": "client",
                "name": "Test User",
                "city": "Delhi"
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        
        # Should mention incorrect or attempts
        detail_lower = data["detail"].lower()
        is_valid_error = "incorrect" in detail_lower or "attempt" in detail_lower or "invalid" in detail_lower or "expired" in detail_lower or "request a new" in detail_lower
        assert is_valid_error, f"Expected error about OTP, got: {data['detail']}"
        print(f"✅ Wrong OTP handled: {data['detail']}")
    
    def test_verify_otp_expired_shows_error(self):
        """Verify OTP with no prior OTP should show expired/not found"""
        # Use a phone that hasn't requested OTP
        random_phone = f"99{random.randint(10000000, 99999999)}"
        
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={
                "phone": random_phone,
                "otp": "123456",
                "role": "client",
                "name": "Test",
                "city": "Mumbai"
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        # Should mention expired or not found
        detail_lower = data["detail"].lower()
        assert "expired" in detail_lower or "not found" in detail_lower or "request" in detail_lower
        print(f"✅ Expired/not found OTP handled: {data['detail']}")
    
    def test_verify_otp_invalid_format(self):
        """Verify OTP with invalid format should fail"""
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={
                "phone": TEST_PHONE,
                "otp": "12345",  # Only 5 digits
                "role": "client",
                "name": "Test",
                "city": "Delhi"
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "6" in data["detail"] or "valid" in data["detail"].lower()
        print(f"✅ Invalid OTP format rejected: {data['detail']}")


class TestPasswordLogin:
    """Tests for /api/auth/password-login endpoint"""
    
    def test_password_login_account_not_found(self):
        """Password login with non-existent phone should fail with account not found"""
        random_phone = f"19{random.randint(10000000, 99999999)}"  # Unlikely to exist
        
        response = requests.post(
            f"{BASE_URL}/api/auth/password-login",
            json={
                "phone": random_phone,
                "password": "testpass123"
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        detail_lower = data["detail"].lower()
        assert "not found" in detail_lower or "signup" in detail_lower
        print(f"✅ Account not found handled: {data['detail']}")
    
    def test_password_login_invalid_phone(self):
        """Password login with invalid phone should fail with 400"""
        response = requests.post(
            f"{BASE_URL}/api/auth/password-login",
            json={
                "phone": "123",
                "password": "testpass"
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "10" in data["detail"] or "valid" in data["detail"].lower()
        print(f"✅ Invalid phone for login rejected: {data['detail']}")
    
    def test_password_login_empty_password(self):
        """Password login with empty password should fail with 400"""
        response = requests.post(
            f"{BASE_URL}/api/auth/password-login",
            json={
                "phone": TEST_PHONE,
                "password": ""
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "password" in data["detail"].lower()
        print(f"✅ Empty password rejected: {data['detail']}")
    
    def test_password_login_wrong_password(self):
        """Password login with wrong password should fail with 401"""
        # This test requires an existing user with password set
        # Try with a phone that may exist
        response = requests.post(
            f"{BASE_URL}/api/auth/password-login",
            json={
                "phone": TEST_PHONE,
                "password": "wrongpassword123"
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        # Could be 400 (password not set), 401 (wrong password or account not found)
        assert response.status_code in [400, 401]
        data = response.json()
        assert "detail" in data
        print(f"✅ Wrong/missing password handled: {data['detail']}")


class TestAdminLogin:
    """Tests for /api/auth/admin-login endpoint"""
    
    def test_admin_login_success(self):
        """Admin login with correct credentials should succeed"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert "message" in data, "Response should contain message"
        
        # Verify user data
        user = data["user"]
        assert user["role"] == "admin"
        
        # Verify token is a valid JWT format (3 parts separated by dots)
        token = data["token"]
        assert len(token.split(".")) == 3, "Token should be valid JWT format"
        
        print(f"✅ Admin login successful: {data['message']}")
        return token
    
    def test_admin_login_wrong_username(self):
        """Admin login with wrong username should fail with 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={
                "username": "wrongadmin",
                "password": ADMIN_PASSWORD
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "invalid" in data["detail"].lower()
        print(f"✅ Wrong username rejected: {data['detail']}")
    
    def test_admin_login_wrong_password(self):
        """Admin login with wrong password should fail with 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={
                "username": ADMIN_USERNAME,
                "password": "wrongpass"
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "invalid" in data["detail"].lower()
        print(f"✅ Wrong password rejected: {data['detail']}")
    
    def test_admin_login_case_insensitive_username(self):
        """Admin login should accept username case-insensitively"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={
                "username": ADMIN_USERNAME.upper(),
                "password": ADMIN_PASSWORD
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print(f"✅ Case-insensitive username accepted")


class TestAuthMe:
    """Tests for /api/auth/me endpoint"""
    
    def test_auth_me_with_valid_token(self):
        """Auth/me with valid token should return user data"""
        # First get a token via admin login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD
            },
            timeout=30
        )
        
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        # Now call /auth/me with the token
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            timeout=10
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify user data
        assert "id" in data
        assert "role" in data
        assert data["role"] == "admin"
        print(f"✅ Auth/me returned user: role={data['role']}")
    
    def test_auth_me_without_token(self):
        """Auth/me without token should fail with 401/403"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            timeout=10
        )
        
        # Should fail with authentication error
        assert response.status_code in [401, 403]
        print(f"✅ No token rejected: {response.status_code}")
    
    def test_auth_me_with_invalid_token(self):
        """Auth/me with invalid token should fail with 401"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={
                "Authorization": "Bearer invalid.token.here",
                "Content-Type": "application/json"
            },
            timeout=10
        )
        
        assert response.status_code == 401
        print(f"✅ Invalid token rejected: {response.status_code}")


class TestOTPFlowE2E:
    """End-to-end OTP flow tests"""
    
    def test_otp_flow_send_and_verify_structure(self):
        """Test that OTP flow endpoints accept correct request structure"""
        # Generate a unique phone for this test
        test_phone = f"98{random.randint(10000000, 99999999)}"
        
        # Step 1: Send OTP
        send_response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": test_phone},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert send_response.status_code == 200
        send_data = send_response.json()
        assert send_data.get("success") == True
        print(f"✅ OTP sent for {test_phone}")
        
        # Step 2: Verify with wrong OTP (we don't know the real one)
        verify_response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={
                "phone": test_phone,
                "otp": "111111",  # Wrong OTP
                "role": "client",
                "name": "E2E Test User",
                "email": "e2etest@example.com",
                "city": "Test City"
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        # Should fail with 400 (wrong OTP)
        assert verify_response.status_code == 400
        verify_data = verify_response.json()
        assert "detail" in verify_data
        
        # The error should be about incorrect OTP or attempts
        detail_lower = verify_data["detail"].lower()
        valid_error = "incorrect" in detail_lower or "attempt" in detail_lower or "invalid" in detail_lower
        assert valid_error, f"Expected OTP error, got: {verify_data['detail']}"
        print(f"✅ Wrong OTP rejected with proper error: {verify_data['detail']}")


# Run tests when executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
