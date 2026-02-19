"""
KoPartner Auth Testing - Iteration 22
Testing: Admin login, OTP flow, password login, error handling
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bulletproof-auth-2.preview.emergentagent.com').rstrip('/')

class TestHealthEndpoint:
    """Health check endpoint test"""
    
    def test_health_returns_healthy(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"
        print("✅ Health check passed - database connected")


class TestAdminLogin:
    """Admin login flow tests"""
    
    def test_admin_login_success(self):
        """Test admin login with correct credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"username": "amit845401", "password": "Amit@9810"},
            timeout=15
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        assert data["message"] == "Admin login successful"
        print(f"✅ Admin login successful - Token received")
    
    def test_admin_login_wrong_password(self):
        """Test admin login with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"username": "amit845401", "password": "WrongPassword"},
            timeout=15
        )
        assert response.status_code == 401
        data = response.json()
        assert "Invalid" in data["detail"] or "password" in data["detail"].lower()
        print("✅ Admin login with wrong password correctly rejected")
    
    def test_admin_login_wrong_username(self):
        """Test admin login with wrong username"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"username": "wronguser", "password": "Amit@9810"},
            timeout=15
        )
        assert response.status_code == 401
        print("✅ Admin login with wrong username correctly rejected")
    
    def test_admin_login_case_insensitive_username(self):
        """Test admin login username is case-insensitive"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"username": "AMIT845401", "password": "Amit@9810"},
            timeout=15
        )
        assert response.status_code == 200
        print("✅ Admin login works with uppercase username")


class TestSendOTP:
    """Send OTP endpoint tests"""
    
    def test_send_otp_success(self):
        """Test OTP is sent successfully to valid phone"""
        response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": "9876543210"},
            timeout=30
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "OTP sent" in data["message"] or "OTP" in data["message"]
        print("✅ OTP sent successfully")
    
    def test_send_otp_invalid_phone(self):
        """Test OTP fails for invalid phone number"""
        response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": "123"},  # Too short
            timeout=15
        )
        assert response.status_code in [400, 422]
        print("✅ OTP send correctly rejected for invalid phone")


class TestVerifyOTP:
    """Verify OTP endpoint tests"""
    
    def test_verify_otp_wrong_code(self):
        """Test verify OTP with wrong code shows attempts remaining"""
        # First send OTP
        requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": "9876543211"},
            timeout=30
        )
        
        # Try wrong OTP
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={"phone": "9876543211", "otp": "000000", "role": "client"},
            timeout=15
        )
        assert response.status_code == 400
        data = response.json()
        # Should show "Incorrect OTP. X attempts remaining."
        assert "Incorrect" in data["detail"] or "attempts" in data["detail"].lower()
        print(f"✅ Wrong OTP response: {data['detail']}")
    
    def test_verify_otp_expired(self):
        """Test verify OTP for phone without active OTP"""
        # Use valid phone format but without active OTP
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={"phone": "5555555555", "otp": "123456", "role": "client"},
            timeout=15
        )
        assert response.status_code == 400
        data = response.json()
        # Should return "OTP expired or not found" or "Invalid phone number"
        assert "expired" in data["detail"].lower() or "not found" in data["detail"].lower() or "invalid" in data["detail"].lower()
        print(f"✅ No OTP response: {data['detail']}")


class TestPasswordLogin:
    """Password login endpoint tests"""
    
    def test_password_login_account_not_found(self):
        """Test password login for non-existing account"""
        response = requests.post(
            f"{BASE_URL}/api/auth/password-login",
            json={"phone": "1234567890", "password": "SomePassword"},
            timeout=15
        )
        # Should return 401 for account not found
        assert response.status_code in [401, 400, 404]
        data = response.json()
        assert "not found" in data["detail"].lower() or "not exist" in data["detail"].lower()
        print(f"✅ Account not found response: {data['detail']}")
    
    def test_password_login_invalid_phone(self):
        """Test password login with invalid phone format"""
        response = requests.post(
            f"{BASE_URL}/api/auth/password-login",
            json={"phone": "abc", "password": "SomePassword"},
            timeout=15
        )
        assert response.status_code in [400, 422]
        print("✅ Invalid phone format correctly rejected")


class TestNoAutoLogout:
    """Test that auth errors don't cause auto-logout on network issues"""
    
    def test_me_endpoint_returns_401_not_500(self):
        """Test that /auth/me returns 401 for invalid token, not 500"""
        # Try multiple times to handle transient 520 errors from Cloudflare
        for attempt in range(3):
            try:
                response = requests.get(
                    f"{BASE_URL}/api/auth/me",
                    headers={"Authorization": "Bearer invalid_token_123"},
                    timeout=15
                )
                # Should return 401 for invalid token (which triggers logout)
                # NOT 500 (which is network error and shouldn't logout)
                if response.status_code == 401:
                    print("✅ Invalid token returns 401 (triggers proper logout)")
                    return
                elif response.status_code == 520:
                    # Cloudflare transient error, retry
                    import time
                    time.sleep(2)
                    continue
                else:
                    # Accept any 4xx response as proper auth error handling
                    assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
                    print(f"✅ Invalid token returns {response.status_code}")
                    return
            except requests.exceptions.RequestException as e:
                import time
                time.sleep(2)
                continue
        
        # If we get here, skip due to Cloudflare issues
        pytest.skip("Cloudflare returning 520 errors, skipping test")
    
    def test_me_endpoint_without_token(self):
        """Test that /auth/me without token returns proper auth error"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            timeout=15
        )
        # Should return 403 or 401 (not 500)
        assert response.status_code in [401, 403, 422]
        print(f"✅ Missing token returns {response.status_code} (proper auth error)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
