"""
Test Authentication Flows for KoPartner
- Login with Password (error handling for non-existing user, wrong password, password not set)
- Send OTP endpoint
- Verify OTP with wrong code
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPasswordLogin:
    """Test Password Login endpoint error handling"""
    
    def test_password_login_account_not_found(self):
        """
        Test: Login with password for non-existing account
        Expected: 401 with "Account not found. Please signup first or login with OTP."
        """
        # Phone number that doesn't exist in the database
        response = requests.post(f"{BASE_URL}/api/auth/password-login", json={
            "phone": "8865910544",  # Non-existing user
            "password": "Ayushsaini"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "detail" in data, "Response should have 'detail' field"
        
        # Verify the error message is user-friendly
        error_msg = data["detail"]
        print(f"✅ Password login (account not found) returned: {error_msg}")
        assert "Account not found" in error_msg or "signup" in error_msg.lower(), \
            f"Error should mention account not found or signup, got: {error_msg}"
    
    def test_password_login_invalid_phone(self):
        """
        Test: Login with invalid phone number format
        Expected: 400 with validation error
        """
        response = requests.post(f"{BASE_URL}/api/auth/password-login", json={
            "phone": "12345",  # Invalid - not 10 digits
            "password": "TestPassword"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"✅ Invalid phone validation: {data['detail']}")
    
    def test_password_login_empty_password(self):
        """
        Test: Login with empty password
        Expected: 400 with validation error
        """
        response = requests.post(f"{BASE_URL}/api/auth/password-login", json={
            "phone": "8865910544",
            "password": ""
        })
        
        # Should return 400 for empty password or 422 for validation error
        assert response.status_code in [400, 422], f"Expected 400 or 422, got {response.status_code}"
        print(f"✅ Empty password validation: status {response.status_code}")


class TestSendOTP:
    """Test Send OTP endpoint"""
    
    def test_send_otp_success(self):
        """
        Test: Send OTP to a valid phone number
        Expected: 200 with success message
        """
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": "8865910544"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify response contains success indication
        assert data.get("success") == True or "message" in data, \
            f"Response should indicate success, got: {data}"
        
        print(f"✅ Send OTP response: {data}")
    
    def test_send_otp_invalid_phone(self):
        """
        Test: Send OTP to invalid phone number
        Expected: 400 with validation error
        """
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": "123"  # Invalid - not 10 digits
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"✅ Send OTP invalid phone: {data['detail']}")


class TestVerifyOTP:
    """Test Verify OTP endpoint"""
    
    def test_verify_otp_wrong_code(self):
        """
        Test: Verify OTP with wrong code
        Expected: 400 with "Incorrect OTP" message
        """
        # First, send OTP to get a valid OTP session
        send_response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": "8865910544"
        })
        
        if send_response.status_code != 200:
            pytest.skip(f"Could not send OTP: {send_response.status_code}")
        
        # Now try to verify with wrong OTP
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "8865910544",
            "otp": "000000",  # Wrong OTP
            "role": "client",
            "name": "Test User",
            "email": "test@test.com",
            "city": "Delhi"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        
        error_msg = data["detail"]
        print(f"✅ Wrong OTP verification: {error_msg}")
        
        # Error should indicate incorrect OTP or attempts remaining
        assert "Incorrect OTP" in error_msg or "attempts" in error_msg.lower(), \
            f"Error should indicate incorrect OTP, got: {error_msg}"
    
    def test_verify_otp_expired_or_not_found(self):
        """
        Test: Verify OTP that doesn't exist
        Expected: 400 with "OTP expired or not found" message
        """
        # Try to verify without sending OTP first (using different phone)
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "9999999999",  # Phone with no OTP sent
            "otp": "123456",
            "role": "client",
            "name": "Test User",
            "email": "test@test.com",
            "city": "Delhi"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        
        error_msg = data["detail"]
        print(f"✅ OTP not found verification: {error_msg}")


class TestHealthAndBasicAPI:
    """Test basic API endpoints"""
    
    def test_health_check(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        data = response.json()
        assert data.get("status") == "healthy", f"Health not healthy: {data}"
        print(f"✅ Health check: {data}")
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"API root failed: {response.status_code}"
        data = response.json()
        print(f"✅ API root: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
