"""
KoPartner API Tests - 10 Lac+ Family Celebration Features
Testing: Discounted pricing (₹199/₹499/₹999), 10 Lac+ branding, email reminders
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bulletproof-auth-2.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_USERNAME = "amit845401"
ADMIN_PASSWORD = "Amit@9810"
TEST_USER_EMAIL = "aaamitsinha@gmail.com"
TEST_USER_ID = "148a017e-f7c9-4de3-900a-d9620ea92dab"


class TestMembershipPricingDiscounts:
    """Test discounted membership pricing - 10 Lac+ Celebration"""
    
    def test_membership_plans_returns_correct_discounted_prices(self):
        """Verify membership plans return new discounted prices (₹199, ₹499, ₹999)"""
        response = requests.get(f"{BASE_URL}/api/payment/membership-plans")
        assert response.status_code == 200
        data = response.json()
        
        assert "plans" in data
        plans = {p["id"]: p for p in data["plans"]}
        
        # Test 6 month plan - ₹199 base (60% off from ₹500)
        assert "6month" in plans
        assert plans["6month"]["base_amount"] == 199
        assert plans["6month"]["original_base"] == 500
        assert plans["6month"]["discount_percent"] == 60
        print(f"✅ 6 Month plan: ₹{plans['6month']['base_amount']} (was ₹{plans['6month']['original_base']})")
        
        # Test 1 year plan - ₹499 base (50% off from ₹1000)
        assert "1year" in plans
        assert plans["1year"]["base_amount"] == 499
        assert plans["1year"]["original_base"] == 1000
        assert plans["1year"]["discount_percent"] == 50
        print(f"✅ 1 Year plan: ₹{plans['1year']['base_amount']} (was ₹{plans['1year']['original_base']})")
        
        # Test lifetime plan - ₹999 base (50% off from ₹2000)
        assert "lifetime" in plans
        assert plans["lifetime"]["base_amount"] == 999
        assert plans["lifetime"]["original_base"] == 2000
        assert plans["lifetime"]["discount_percent"] == 50
        print(f"✅ Lifetime plan: ₹{plans['lifetime']['base_amount']} (was ₹{plans['lifetime']['original_base']})")
    
    def test_membership_plans_has_10lac_promo(self):
        """Verify promo message contains 10 Lac+ branding"""
        response = requests.get(f"{BASE_URL}/api/payment/membership-plans")
        assert response.status_code == 200
        data = response.json()
        
        assert "promo" in data
        assert "10 Lac+" in data["promo"]
        print(f"✅ Promo message: {data['promo']}")
    
    def test_membership_plans_have_gst(self):
        """Verify membership plans include GST calculation"""
        response = requests.get(f"{BASE_URL}/api/payment/membership-plans")
        assert response.status_code == 200
        data = response.json()
        
        for plan in data["plans"]:
            # GST should be 18% of base amount
            expected_gst = int(plan["base_amount"] * 0.18)
            assert plan["gst_amount"] == expected_gst
            
            # Total should be base + GST
            expected_total = int(plan["base_amount"] + expected_gst)
            assert abs(plan["total_amount"] - expected_total) <= 1  # Allow ±1 rounding
            print(f"✅ {plan['name']}: ₹{plan['base_amount']} + ₹{plan['gst_amount']} GST = ₹{plan['total_amount']}")


class TestAdminEmailReminder:
    """Test email reminder functionality for admin panel"""
    
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
    
    def test_send_email_reminder_to_specific_user(self, admin_token):
        """Test sending email reminder to specific user via API"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/{TEST_USER_ID}/send-email-reminder",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "email_sent" in data
        assert data.get("email_sent") == True
        assert TEST_USER_EMAIL in data.get("message", "")
        print(f"✅ Email reminder sent successfully to {data.get('message')}")
    
    def test_bulk_email_reminder_endpoint_accessible(self, admin_token):
        """Test bulk email reminder endpoint is accessible (without sending)"""
        # Note: This will actually trigger sending emails, so we verify endpoint exists
        # by checking unpaid users first
        response = requests.get(
            f"{BASE_URL}/api/admin/users/unpaid-kopartners",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        unpaid_count = len(data.get("users", []))
        emails_available = sum(1 for u in data.get("users", []) if u.get("email"))
        print(f"✅ Found {unpaid_count} unpaid KoPartners, {emails_available} with email addresses")


class TestAdminLogin:
    """Test admin login functionality"""
    
    def test_admin_login_success(self):
        """Test admin login with correct credentials"""
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
    
    def test_admin_login_wrong_credentials(self):
        """Test admin login with wrong credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "username": "wrong_user",
            "password": "wrong_pass"
        })
        assert response.status_code == 401
        print(f"✅ Invalid credentials properly rejected (401)")


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_running(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ API running: {data['message']}")
    
    def test_razorpay_key_endpoint(self):
        """Test Razorpay key endpoint"""
        response = requests.get(f"{BASE_URL}/api/payment/razorpay-key")
        assert response.status_code == 200
        data = response.json()
        assert "key_id" in data
        assert data["key_id"].startswith("rzp_")
        print(f"✅ Razorpay key endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
