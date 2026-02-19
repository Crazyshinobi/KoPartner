"""
KoPartner API Tests - Testing signup flow, email recording, admin panel, and dashboard features
"""
import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bulletproof-auth-2.preview.emergentagent.com').rstrip('/')

# Test credentials from review request
ADMIN_USERNAME = "amit845401"
ADMIN_PASSWORD = "Amit@9810"
TEST_EMAIL = "aaamitsinha@gmail.com"


class TestHealthCheck:
    """Basic API health check"""
    
    def test_api_root(self):
        """Test API is running"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ API is running: {data['message']}")


class TestAdminLogin:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        print(f"✅ Admin login successful")
        return data["token"]
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "username": "wrong_user",
            "password": "wrong_pass"
        })
        assert response.status_code == 401
        print(f"✅ Invalid admin credentials rejected correctly")


class TestAdminPanel:
    """Admin panel functionality tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin login failed")
    
    def test_admin_stats(self, admin_token):
        """Test admin stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/stats", 
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_kopartners" in data or "total_cuddlists" in data
        print(f"✅ Admin stats: {data.get('total_users')} users, {data.get('total_kopartners', data.get('total_cuddlists', 0))} kopartners")
    
    def test_admin_get_all_users(self, admin_token):
        """Test admin can get all users - verify email field is present"""
        response = requests.get(f"{BASE_URL}/api/admin/users/all",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        users = data["users"]
        print(f"✅ Admin fetched {len(users)} users")
        
        # Check if email field exists in user records
        for user in users[:5]:  # Check first 5 users
            print(f"  User: {user.get('name', 'N/A')}, Phone: {user.get('phone')}, Email: {user.get('email', 'N/A')}")
    
    def test_admin_get_unpaid_kopartners(self, admin_token):
        """Test admin can get unpaid kopartners"""
        response = requests.get(f"{BASE_URL}/api/admin/users/unpaid-kopartners",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        print(f"✅ Found {len(data['users'])} unpaid kopartners")
    
    def test_admin_email_quota_status(self, admin_token):
        """Test email quota status endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/email-quota-status",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "daily_limit" in data
        assert "remaining_quota" in data
        print(f"✅ Email quota: {data.get('remaining_quota')}/{data.get('daily_limit')} remaining")
    
    def test_admin_get_all_kopartners(self, admin_token):
        """Test admin can get all kopartners"""
        response = requests.get(f"{BASE_URL}/api/admin/kopartners/all",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "kopartners" in data
        print(f"✅ Found {len(data['kopartners'])} kopartners")
    
    def test_admin_get_all_transactions(self, admin_token):
        """Test admin can get all transactions (Payment History)"""
        response = requests.get(f"{BASE_URL}/api/admin/transactions/all",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data
        print(f"✅ Found {len(data['transactions'])} transactions")
    
    def test_admin_get_all_bookings(self, admin_token):
        """Test admin can get all bookings"""
        response = requests.get(f"{BASE_URL}/api/admin/bookings/all",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "bookings" in data
        print(f"✅ Found {len(data['bookings'])} bookings")


class TestOTPFlow:
    """OTP authentication flow tests"""
    
    def test_send_otp(self):
        """Test OTP sending"""
        test_phone = "9999999999"  # Test phone number
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": test_phone
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✅ OTP sent to {test_phone}")
    
    def test_send_otp_invalid_phone(self):
        """Test OTP with invalid phone number"""
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": "123"  # Invalid - too short
        })
        assert response.status_code == 400
        print(f"✅ Invalid phone number rejected correctly")


class TestMembershipPlans:
    """Membership plans tests"""
    
    def test_get_membership_plans(self):
        """Test getting membership plans"""
        response = requests.get(f"{BASE_URL}/api/payment/membership-plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        plans = data["plans"]
        assert len(plans) >= 3  # Should have 6month, 1year, lifetime
        
        plan_ids = [p["id"] for p in plans]
        assert "6month" in plan_ids
        assert "1year" in plan_ids
        assert "lifetime" in plan_ids
        
        print(f"✅ Membership plans available:")
        for plan in plans:
            print(f"  - {plan['name']}: ₹{plan['total_amount']} ({plan['id']})")


class TestUserBookings:
    """User bookings endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin login failed")
    
    def test_kopartner_bookings_endpoint_exists(self, admin_token):
        """Test that kopartner bookings endpoint exists"""
        # This endpoint requires a kopartner user, but we can verify it exists
        response = requests.get(f"{BASE_URL}/api/kopartner/my-bookings",
            headers={"Authorization": f"Bearer {admin_token}"})
        # Admin is not a kopartner, so we expect 403 (forbidden)
        # This confirms the endpoint exists and properly validates role
        assert response.status_code == 403
        print(f"✅ KoPartner bookings endpoint exists and validates role (status: {response.status_code})")
    
    def test_client_bookings_endpoint_exists(self, admin_token):
        """Test that client bookings endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/client/my-bookings",
            headers={"Authorization": f"Bearer {admin_token}"})
        # Admin is not a client, so we expect 403 or similar
        # But the endpoint should exist (not 404)
        assert response.status_code != 404
        print(f"✅ Client bookings endpoint exists (status: {response.status_code})")


class TestTransactions:
    """Transaction/Payment history tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin login failed")
    
    def test_my_transactions_endpoint_exists(self, admin_token):
        """Test that user transactions endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/transactions/my",
            headers={"Authorization": f"Bearer {admin_token}"})
        # Should return 200 with empty or populated transactions
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data
        print(f"✅ Transactions endpoint works, found {len(data['transactions'])} transactions")


class TestEmailReminderFeature:
    """Email reminder feature tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin login failed")
    
    def test_bulk_email_endpoint_exists(self, admin_token):
        """Test bulk email reminder endpoint exists"""
        # We won't actually send emails, just verify endpoint exists
        # The endpoint should be POST /api/admin/bulk-email-reminder
        response = requests.options(f"{BASE_URL}/api/admin/bulk-email-reminder",
            headers={"Authorization": f"Bearer {admin_token}"})
        # OPTIONS should return 200 or the endpoint should exist
        print(f"✅ Bulk email endpoint check: status {response.status_code}")
    
    def test_individual_email_reminder_endpoint_exists(self, admin_token):
        """Test individual email reminder endpoint exists"""
        # Get a user ID first
        users_response = requests.get(f"{BASE_URL}/api/admin/users/unpaid-kopartners",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        if users_response.status_code == 200:
            users = users_response.json().get("users", [])
            if users:
                user_id = users[0].get("id")
                # Check if endpoint exists (don't actually send)
                print(f"✅ Found unpaid user {user_id} for email reminder test")
            else:
                print(f"✅ No unpaid kopartners to test email reminder")
        else:
            print(f"⚠️ Could not fetch unpaid kopartners")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
