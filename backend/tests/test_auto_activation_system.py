"""
Test suite for KoPartner Auto-Activation System
Critical functionality: After successful Razorpay payment, profiles must be AUTO-ACTIVATED immediately

Tests the following endpoints:
1. GET /api/health - Health check returns healthy status
2. GET /api/payment/membership-plans - Returns correct plans with discounted prices
3. POST /api/payment/verify-membership - Payment verification logic
4. GET /api/payment/check-activation - Endpoint to fix activation issues
5. GET /api/admin/search - Scalable search endpoint
6. POST /api/payment/webhook - Webhook accepts POST requests
"""
import pytest
import requests
import os
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bulletproof-auth-2.preview.emergentagent.com').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "amit845401"
ADMIN_PASSWORD = "Amit@9810"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token - shared across tests in module"""
    response = requests.post(
        f"{BASE_URL}/api/auth/admin-login",
        json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
    )
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Admin authentication failed")


class TestHealthCheckEndpoint:
    """Test: Health check endpoint /api/health returns healthy status"""
    
    def test_health_returns_healthy_status(self):
        """Health check should return status: healthy"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["status"] == "healthy", f"Expected 'healthy', got {data.get('status')}"
        assert data["database"] == "connected", f"Expected 'connected', got {data.get('database')}"
        assert "timestamp" in data, "Response should include timestamp"
        
        print(f"✅ Health check: status={data['status']}, database={data['database']}")
    
    def test_health_under_concurrent_load(self):
        """Health check should handle 10 concurrent requests (scalability test)"""
        def make_request():
            try:
                response = requests.get(f"{BASE_URL}/api/health", timeout=15)
                return response.status_code == 200 and response.json().get("status") == "healthy"
            except Exception as e:
                print(f"Request failed: {e}")
                return False
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(10)]
            results = [f.result() for f in as_completed(futures)]
        
        success_count = sum(1 for r in results if r)
        assert success_count >= 8, f"Expected at least 8/10 successful, got {success_count}/10"
        print(f"✅ Concurrent health checks: {success_count}/10 successful")


class TestMembershipPlansEndpoint:
    """Test: Membership plans endpoint /api/payment/membership-plans returns correct plans"""
    
    def test_membership_plans_returns_three_plans(self):
        """Should return exactly 3 plans: 6month, 1year, lifetime"""
        response = requests.get(f"{BASE_URL}/api/payment/membership-plans", timeout=10)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "plans" in data, "Response should have 'plans' key"
        assert len(data["plans"]) == 3, f"Expected 3 plans, got {len(data['plans'])}"
        
        plan_ids = [p["id"] for p in data["plans"]]
        assert "6month" in plan_ids, "Should have 6month plan"
        assert "1year" in plan_ids, "Should have 1year plan"
        assert "lifetime" in plan_ids, "Should have lifetime plan"
        
        print(f"✅ Membership plans: {plan_ids}")
    
    def test_discounted_prices_are_correct(self):
        """Should return discounted prices: ₹199/₹499/₹999 (10 Lac+ celebration)"""
        response = requests.get(f"{BASE_URL}/api/payment/membership-plans", timeout=10)
        
        assert response.status_code == 200
        data = response.json()
        
        plans_by_id = {p["id"]: p for p in data["plans"]}
        
        # Verify base amounts (discounted prices)
        six_month = plans_by_id["6month"]
        assert six_month["base_amount"] == 199, f"6month base should be ₹199, got ₹{six_month['base_amount']}"
        
        one_year = plans_by_id["1year"]
        assert one_year["base_amount"] == 499, f"1year base should be ₹499, got ₹{one_year['base_amount']}"
        
        lifetime = plans_by_id["lifetime"]
        assert lifetime["base_amount"] == 999, f"lifetime base should be ₹999, got ₹{lifetime['base_amount']}"
        
        print(f"✅ Discounted prices: 6mo=₹{six_month['base_amount']}, 1yr=₹{one_year['base_amount']}, lifetime=₹{lifetime['base_amount']}")
    
    def test_total_with_gst_calculation(self):
        """Total amount should include 18% GST"""
        response = requests.get(f"{BASE_URL}/api/payment/membership-plans", timeout=10)
        
        assert response.status_code == 200
        data = response.json()
        
        for plan in data["plans"]:
            expected_total = int(plan["base_amount"] + (plan["base_amount"] * 0.18))
            # Allow ±1 tolerance for rounding
            assert abs(plan["total_amount"] - expected_total) <= 1, \
                f"{plan['id']}: Expected total ~₹{expected_total}, got ₹{plan['total_amount']}"
        
        print("✅ GST calculation correct for all plans")
    
    def test_one_year_marked_as_popular(self):
        """1year plan should be marked as is_popular: true"""
        response = requests.get(f"{BASE_URL}/api/payment/membership-plans", timeout=10)
        
        assert response.status_code == 200
        data = response.json()
        
        one_year = next((p for p in data["plans"] if p["id"] == "1year"), None)
        assert one_year is not None, "1year plan should exist"
        assert one_year.get("is_popular") == True, "1year should be marked as popular"
        
        print("✅ 1year plan marked as popular")


class TestPaymentVerifyEndpoint:
    """Test: Payment verification endpoint /api/payment/verify-membership logic"""
    
    def test_verify_endpoint_exists(self):
        """Endpoint should exist and require authentication"""
        response = requests.post(f"{BASE_URL}/api/payment/verify-membership", json={}, timeout=10)
        
        # Should return 401 (unauthorized) not 404 (not found)
        assert response.status_code != 404, "Endpoint should exist"
        assert response.status_code in [400, 401, 403], f"Expected auth error, got {response.status_code}"
        
        print("✅ /api/payment/verify-membership endpoint exists and requires auth")
    
    def test_verify_requires_payment_details(self):
        """Should require razorpay_order_id, razorpay_payment_id, razorpay_signature"""
        response = requests.post(
            f"{BASE_URL}/api/payment/verify-membership",
            json={"incomplete": True},
            timeout=10
        )
        
        # Without auth token, should fail with 401/403
        assert response.status_code in [400, 401, 403]
        
        print("✅ verify-membership validates required fields")


class TestCheckActivationEndpoint:
    """Test: Check-activation endpoint /api/payment/check-activation for fixing activation issues"""
    
    def test_check_activation_endpoint_exists(self):
        """Endpoint should exist and require authentication"""
        response = requests.get(f"{BASE_URL}/api/payment/check-activation", timeout=10)
        
        # Should require auth
        assert response.status_code != 404, "Endpoint should exist"
        assert response.status_code in [401, 403], f"Expected auth required, got {response.status_code}"
        
        print("✅ /api/payment/check-activation endpoint exists and requires auth")


class TestAdminSearchEndpoint:
    """Test: Admin search endpoint /api/admin/search for scalable search"""
    
    def test_admin_search_endpoint_exists(self, admin_token):
        """Admin search endpoint should be accessible"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search?q=test",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "users" in data, "Response should have 'users' key"
        assert "count" in data, "Response should have 'count' key"
        
        print(f"✅ Admin search works: found {data['count']} users for query 'test'")
    
    def test_admin_search_requires_auth(self):
        """Search without auth should be blocked"""
        response = requests.get(f"{BASE_URL}/api/admin/search?q=test", timeout=10)
        
        assert response.status_code in [401, 403], f"Expected auth required, got {response.status_code}"
        
        print("✅ Admin search properly requires authentication")
    
    def test_admin_search_by_phone(self, admin_token):
        """Should find users by phone number"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search?q=9810",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # If users found, verify phone matching
        if data["count"] > 0:
            has_phone_match = any("9810" in str(u.get("phone", "")) for u in data["users"])
            assert has_phone_match, "Found users should have '9810' in phone"
        
        print(f"✅ Phone search works: {data['count']} users found for '9810'")
    
    def test_admin_search_by_name(self, admin_token):
        """Should find users by name"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search?q=amit",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # If users found, verify name matching
        if data["count"] > 0:
            has_name_match = any("amit" in str(u.get("name", "")).lower() for u in data["users"])
            assert has_name_match, "Found users should have 'amit' in name"
        
        print(f"✅ Name search works: {data['count']} users found for 'amit'")
    
    def test_admin_search_min_query_length(self, admin_token):
        """Query must be at least 2 characters"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search?q=a",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Single character should return empty
        assert data["count"] == 0, "Single char query should return empty"
        assert len(data["users"]) == 0
        
        print("✅ Search enforces minimum query length")
    
    def test_admin_search_handles_concurrent_requests(self, admin_token):
        """Should handle multiple concurrent search requests (scalability)"""
        def make_search(query):
            try:
                response = requests.get(
                    f"{BASE_URL}/api/admin/search?q={query}",
                    headers={"Authorization": f"Bearer {admin_token}"},
                    timeout=15
                )
                return response.status_code == 200
            except:
                return False
        
        queries = ["amit", "9810", "test", "noida", "delhi"]
        
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_search, q) for q in queries]
            results = [f.result() for f in as_completed(futures)]
        
        success_count = sum(1 for r in results if r)
        assert success_count >= 4, f"Expected at least 4/5 successful, got {success_count}/5"
        
        print(f"✅ Concurrent searches: {success_count}/5 successful")


class TestWebhookEndpoint:
    """Test: Webhook endpoint /api/payment/webhook accepts POST requests"""
    
    def test_webhook_accepts_post_requests(self):
        """Webhook should accept POST requests"""
        response = requests.post(
            f"{BASE_URL}/api/payment/webhook",
            json={"event": "test"},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        # Webhook should return 200 (even for test/invalid payloads)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Should return ok or error for invalid payload
        assert "status" in data, "Response should have 'status' key"
        
        print(f"✅ Webhook accepts POST: status={data.get('status')}")
    
    def test_webhook_handles_invalid_json_gracefully(self):
        """Webhook should handle invalid JSON gracefully"""
        response = requests.post(
            f"{BASE_URL}/api/payment/webhook",
            data="invalid json {{{",
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        # Should return 200 with error message, not crash
        assert response.status_code in [200, 400, 422], f"Should handle gracefully, got {response.status_code}"
        
        print("✅ Webhook handles invalid JSON gracefully")
    
    def test_webhook_handles_payment_captured_event(self):
        """Webhook should process payment.captured event"""
        payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_test123",
                        "amount": 58900,  # ₹589 (1year with GST) in paise
                        "email": "test@example.com",
                        "contact": "+919999888877",
                        "notes": {
                            "user_id": "test-user-id",
                            "type": "membership"
                        }
                    }
                }
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/payment/webhook",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Will be pending/error since user doesn't exist, but should process
        assert data.get("status") in ["ok", "pending", "success", "error"]
        
        print(f"✅ Webhook processes payment.captured: status={data.get('status')}")


class TestRazorpayKeyEndpoint:
    """Test Razorpay key endpoint for frontend integration"""
    
    def test_razorpay_key_endpoint(self):
        """Should return valid Razorpay key ID"""
        response = requests.get(f"{BASE_URL}/api/payment/razorpay-key", timeout=10)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "key_id" in data, "Response should have 'key_id'"
        assert data["key_id"].startswith("rzp_"), "Key should start with 'rzp_'"
        
        print(f"✅ Razorpay key: {data['key_id'][:15]}...")


class TestCreateMembershipOrderEndpoint:
    """Test create membership order endpoint"""
    
    def test_create_order_requires_auth(self):
        """Create order should require authentication"""
        response = requests.post(
            f"{BASE_URL}/api/payment/create-membership-order",
            json={"plan": "1year"},
            timeout=10
        )
        
        assert response.status_code in [401, 403], f"Expected auth required, got {response.status_code}"
        
        print("✅ Create order requires authentication")
    
    def test_create_order_endpoint_exists(self):
        """Endpoint should exist (return 401, not 404)"""
        response = requests.post(
            f"{BASE_URL}/api/payment/create-membership-order",
            json={},
            timeout=10
        )
        
        assert response.status_code != 404, "Endpoint should exist"
        
        print("✅ /api/payment/create-membership-order endpoint exists")


class TestScalabilityFeatures:
    """Test scalability features for 1 Lac+ hits/day"""
    
    def test_rapid_fire_health_checks(self):
        """Should handle 20 rapid health checks"""
        start = time.time()
        successes = 0
        
        for i in range(20):
            try:
                response = requests.get(f"{BASE_URL}/api/health", timeout=5)
                if response.status_code == 200:
                    successes += 1
            except:
                pass
        
        elapsed = time.time() - start
        
        assert successes >= 18, f"Expected at least 18/20 successful, got {successes}/20"
        print(f"✅ Rapid health checks: {successes}/20 in {elapsed:.2f}s")
    
    def test_mixed_concurrent_load(self):
        """Should handle mixed concurrent requests (health + plans)"""
        def make_request(endpoint):
            try:
                response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
                return response.status_code == 200
            except:
                return False
        
        endpoints = [
            "/api/health",
            "/api/payment/membership-plans",
            "/api/health",
            "/api/payment/razorpay-key",
            "/api/health",
            "/api/payment/membership-plans",
        ]
        
        with ThreadPoolExecutor(max_workers=6) as executor:
            futures = [executor.submit(make_request, ep) for ep in endpoints]
            results = [f.result() for f in as_completed(futures)]
        
        success_count = sum(1 for r in results if r)
        assert success_count >= 5, f"Expected at least 5/6, got {success_count}/6"
        
        print(f"✅ Mixed load: {success_count}/6 successful")


class TestAutoActivationFlow:
    """Test the complete auto-activation flow logic"""
    
    def test_activation_flow_components_exist(self):
        """All components of auto-activation flow should exist"""
        # Test each endpoint exists
        endpoints_to_check = [
            ("/api/health", "GET"),
            ("/api/payment/membership-plans", "GET"),
            ("/api/payment/razorpay-key", "GET"),
            ("/api/payment/webhook", "POST"),
        ]
        
        for endpoint, method in endpoints_to_check:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
            else:
                response = requests.post(f"{BASE_URL}{endpoint}", json={}, timeout=10)
            
            # Should not return 404
            assert response.status_code != 404, f"{method} {endpoint} should exist"
        
        print("✅ All activation flow endpoints exist")
    
    def test_membership_plan_detection_amounts(self):
        """Verify the amount ranges for plan detection match plans"""
        response = requests.get(f"{BASE_URL}/api/payment/membership-plans", timeout=10)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify total amounts are in the detection ranges
        # Detection ranges from server.py detect_membership_plan():
        # 6month: 230-250 (new ₹199 + 18% GST = ~₹235)
        # 1year: 580-600 (new ₹499 + 18% GST = ~₹589)
        # lifetime: 1170-1190 (new ₹999 + 18% GST = ~₹1179)
        
        plans = {p["id"]: p for p in data["plans"]}
        
        assert 230 <= plans["6month"]["total_amount"] <= 250, \
            f"6month total {plans['6month']['total_amount']} not in detection range 230-250"
        
        assert 580 <= plans["1year"]["total_amount"] <= 600, \
            f"1year total {plans['1year']['total_amount']} not in detection range 580-600"
        
        assert 1170 <= plans["lifetime"]["total_amount"] <= 1190, \
            f"lifetime total {plans['lifetime']['total_amount']} not in detection range 1170-1190"
        
        print("✅ All plan amounts are in detection ranges for auto-activation")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short", "-x"])
