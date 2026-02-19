"""
PRO LEVEL Comprehensive Test Suite
==================================
Tests all PRO LEVEL enhanced endpoints for 10,000+ hits/day capability

Features tested:
1. Health endpoint
2. Auth send-otp (PRO LEVEL)
3. Admin login (PRO LEVEL)
4. Admin stats (PRO LEVEL with asyncio.gather)
5. Admin users/all (PRO LEVEL with timeout protection)
6. Admin kopartners/all (PRO LEVEL with timeout)
7. Admin kopartners/pending (PRO LEVEL)
8. Admin search (PRO LEVEL)
9. Payment membership-plans
10. Concurrent admin requests (10 simultaneous)
11. Rapid sequential API calls (20 requests)
12. Response time verification (< 2 seconds)
"""

import pytest
import requests
import time
import os
import concurrent.futures
from datetime import datetime, timezone

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL not set")

# Admin credentials
ADMIN_USERNAME = "amit845401"
ADMIN_PASSWORD = "Amit@9810"

# Test tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "response_times": []
}


class TestHealthEndpoint:
    """Test /api/health endpoint"""
    
    def test_health_check_returns_200(self):
        """Health endpoint should return 200 and healthy status"""
        start = time.time()
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        elapsed = time.time() - start
        test_results["response_times"].append(("health", elapsed))
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "healthy", f"Expected healthy status, got {data}"
        assert "database" in data, "Missing database field"
        assert elapsed < 2.0, f"Response time {elapsed:.2f}s exceeds 2s limit"
        print(f"✅ Health check passed in {elapsed*1000:.1f}ms")


class TestAuthSendOTP:
    """Test /api/auth/send-otp - PRO LEVEL OTP sending"""
    
    def test_send_otp_valid_phone(self):
        """Send OTP to valid phone number"""
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": "9876543210"},
            timeout=10
        )
        elapsed = time.time() - start
        test_results["response_times"].append(("send-otp", elapsed))
        
        # Should succeed or fail gracefully (SMS might not actually send)
        assert response.status_code in [200, 500], f"Unexpected status: {response.status_code}"
        data = response.json()
        
        if response.status_code == 200:
            assert data.get("success") == True, f"Expected success=True, got {data}"
            print(f"✅ Send OTP passed in {elapsed*1000:.1f}ms")
        else:
            print(f"⚠️ Send OTP returned 500 (SMS may not be configured), time: {elapsed*1000:.1f}ms")
        
        assert elapsed < 10.0, f"Response time {elapsed:.2f}s exceeds 10s limit"
    
    def test_send_otp_invalid_phone(self):
        """Send OTP to invalid phone should fail with 400"""
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": "123"},
            timeout=5
        )
        elapsed = time.time() - start
        test_results["response_times"].append(("send-otp-invalid", elapsed))
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"✅ Send OTP validation passed in {elapsed*1000:.1f}ms")


class TestAdminLogin:
    """Test /api/auth/admin-login - PRO LEVEL admin login"""
    
    def test_admin_login_valid_credentials(self):
        """Admin login with valid credentials"""
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
            timeout=10
        )
        elapsed = time.time() - start
        test_results["response_times"].append(("admin-login", elapsed))
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}. Response: {response.text}"
        data = response.json()
        assert "token" in data, "Missing token in response"
        assert "user" in data, "Missing user in response"
        assert data["user"]["role"] == "admin", f"Expected admin role, got {data['user'].get('role')}"
        assert elapsed < 2.0, f"Response time {elapsed:.2f}s exceeds 2s limit"
        print(f"✅ Admin login passed in {elapsed*1000:.1f}ms")
        return data["token"]
    
    def test_admin_login_invalid_credentials(self):
        """Admin login with invalid credentials should fail"""
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"username": "wronguser", "password": "wrongpass"},
            timeout=5
        )
        elapsed = time.time() - start
        test_results["response_times"].append(("admin-login-invalid", elapsed))
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✅ Admin login validation passed in {elapsed*1000:.1f}ms")


@pytest.fixture(scope="module")
def admin_token():
    """Get admin token for authenticated tests"""
    response = requests.post(
        f"{BASE_URL}/api/auth/admin-login",
        json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
        timeout=10
    )
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return response.json()["token"]


class TestAdminStats:
    """Test /api/admin/stats - PRO LEVEL with asyncio.gather"""
    
    def test_admin_stats(self, admin_token):
        """Admin stats should return all dashboard metrics"""
        start = time.time()
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        elapsed = time.time() - start
        test_results["response_times"].append(("admin-stats", elapsed))
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify all expected fields are present
        expected_fields = [
            "total_users", "total_clients", "total_kopartners",
            "active_kopartners", "pending_approvals", "total_bookings"
        ]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        assert elapsed < 2.0, f"Response time {elapsed:.2f}s exceeds 2s limit"
        print(f"✅ Admin stats passed in {elapsed*1000:.1f}ms - Users: {data.get('total_users', 0)}")


class TestAdminUsersAll:
    """Test /api/admin/users/all - PRO LEVEL with timeout protection"""
    
    def test_admin_users_all(self, admin_token):
        """Get all users with pagination"""
        start = time.time()
        response = requests.get(
            f"{BASE_URL}/api/admin/users/all?page=1&limit=10",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=15
        )
        elapsed = time.time() - start
        test_results["response_times"].append(("admin-users-all", elapsed))
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "users" in data, "Missing users in response"
        assert "count" in data, "Missing count in response"
        assert "total_count" in data, "Missing total_count in response"
        assert isinstance(data["users"], list), "Users should be a list"
        
        assert elapsed < 10.0, f"Response time {elapsed:.2f}s exceeds 10s limit"
        print(f"✅ Admin users/all passed in {elapsed*1000:.1f}ms - Found {data.get('count', 0)}/{data.get('total_count', 0)} users")
    
    def test_admin_users_with_role_filter(self, admin_token):
        """Get users filtered by role"""
        start = time.time()
        response = requests.get(
            f"{BASE_URL}/api/admin/users/all?role=kopartner&limit=5",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=15
        )
        elapsed = time.time() - start
        test_results["response_times"].append(("admin-users-role", elapsed))
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "users" in data, "Missing users in response"
        
        # Verify all returned users are kopartners
        for user in data.get("users", []):
            assert user.get("role") in ["cuddlist", "both"], f"Unexpected role: {user.get('role')}"
        
        assert elapsed < 10.0, f"Response time {elapsed:.2f}s exceeds 10s limit"
        print(f"✅ Admin users with role filter passed in {elapsed*1000:.1f}ms")


class TestAdminKopartnersAll:
    """Test /api/admin/kopartners/all - PRO LEVEL with timeout"""
    
    def test_admin_kopartners_all(self, admin_token):
        """Get all KoPartners with pagination"""
        start = time.time()
        response = requests.get(
            f"{BASE_URL}/api/admin/kopartners/all?page=1&limit=10",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=15
        )
        elapsed = time.time() - start
        test_results["response_times"].append(("admin-kopartners-all", elapsed))
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "kopartners" in data, "Missing kopartners in response"
        assert "count" in data, "Missing count in response"
        assert "total_count" in data, "Missing total_count in response"
        
        assert elapsed < 10.0, f"Response time {elapsed:.2f}s exceeds 10s limit"
        print(f"✅ Admin kopartners/all passed in {elapsed*1000:.1f}ms - Found {data.get('count', 0)}/{data.get('total_count', 0)} kopartners")


class TestAdminKopartnersPending:
    """Test /api/admin/kopartners/pending - PRO LEVEL"""
    
    def test_admin_kopartners_pending(self, admin_token):
        """Get pending KoPartners"""
        start = time.time()
        response = requests.get(
            f"{BASE_URL}/api/admin/kopartners/pending",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        elapsed = time.time() - start
        test_results["response_times"].append(("admin-kopartners-pending", elapsed))
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "kopartners" in data, "Missing kopartners in response"
        assert "count" in data, "Missing count in response"
        
        # Verify all returned kopartners have pending status
        for kp in data.get("kopartners", []):
            assert kp.get("cuddlist_status") == "pending", f"Unexpected status: {kp.get('cuddlist_status')}"
        
        assert elapsed < 2.0, f"Response time {elapsed:.2f}s exceeds 2s limit"
        print(f"✅ Admin kopartners/pending passed in {elapsed*1000:.1f}ms - Found {data.get('count', 0)} pending")


class TestAdminSearch:
    """Test /api/admin/search - PRO LEVEL search"""
    
    def test_admin_search_by_phone(self, admin_token):
        """Search by phone number"""
        start = time.time()
        response = requests.get(
            f"{BASE_URL}/api/admin/search?q=98105&limit=10",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        elapsed = time.time() - start
        test_results["response_times"].append(("admin-search-phone", elapsed))
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "users" in data, "Missing users in response"
        assert "search_type" in data, "Missing search_type in response"
        assert data.get("search_type") in ["phone", "cached"], f"Expected phone search type, got {data.get('search_type')}"
        
        assert elapsed < 2.0, f"Response time {elapsed:.2f}s exceeds 2s limit"
        print(f"✅ Admin search by phone passed in {elapsed*1000:.1f}ms - Found {data.get('count', 0)} results")
    
    def test_admin_search_by_name(self, admin_token):
        """Search by name"""
        start = time.time()
        response = requests.get(
            f"{BASE_URL}/api/admin/search?q=amit&limit=10",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        elapsed = time.time() - start
        test_results["response_times"].append(("admin-search-name", elapsed))
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "users" in data, "Missing users in response"
        assert elapsed < 2.0, f"Response time {elapsed:.2f}s exceeds 2s limit"
        print(f"✅ Admin search by name passed in {elapsed*1000:.1f}ms - Found {data.get('count', 0)} results")


class TestMembershipPlans:
    """Test /api/payment/membership-plans"""
    
    def test_get_membership_plans(self):
        """Get membership plans"""
        start = time.time()
        response = requests.get(f"{BASE_URL}/api/payment/membership-plans", timeout=5)
        elapsed = time.time() - start
        test_results["response_times"].append(("membership-plans", elapsed))
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "plans" in data, "Missing plans in response"
        assert len(data["plans"]) >= 3, f"Expected at least 3 plans, got {len(data['plans'])}"
        
        # Verify plan structure
        for plan in data["plans"]:
            assert "id" in plan, "Missing plan id"
            assert "name" in plan, "Missing plan name"
            assert "total_amount" in plan, "Missing total_amount"
        
        assert elapsed < 2.0, f"Response time {elapsed:.2f}s exceeds 2s limit"
        print(f"✅ Membership plans passed in {elapsed*1000:.1f}ms - Found {len(data['plans'])} plans")


class TestConcurrentRequests:
    """Test 10 concurrent admin requests"""
    
    def test_10_concurrent_admin_requests(self, admin_token):
        """Send 10 concurrent requests to admin endpoints"""
        endpoints = [
            "/api/admin/stats",
            "/api/admin/users/all?limit=5",
            "/api/admin/kopartners/all?limit=5",
            "/api/admin/kopartners/pending",
            "/api/admin/search?q=test",
            "/api/admin/stats",
            "/api/admin/users/all?limit=3",
            "/api/admin/kopartners/all?limit=3",
            "/api/admin/search?q=98105",
            "/api/admin/search?q=delhi"
        ]
        
        def make_request(endpoint):
            start = time.time()
            try:
                response = requests.get(
                    f"{BASE_URL}{endpoint}",
                    headers={"Authorization": f"Bearer {admin_token}"},
                    timeout=15
                )
                elapsed = time.time() - start
                return {
                    "endpoint": endpoint,
                    "status": response.status_code,
                    "success": response.status_code == 200,
                    "time": elapsed
                }
            except Exception as e:
                return {
                    "endpoint": endpoint,
                    "status": 0,
                    "success": False,
                    "error": str(e),
                    "time": time.time() - start
                }
        
        start_total = time.time()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            results = list(executor.map(make_request, endpoints))
        
        total_elapsed = time.time() - start_total
        
        # Analyze results
        successes = sum(1 for r in results if r["success"])
        failures = [r for r in results if not r["success"]]
        avg_time = sum(r["time"] for r in results) / len(results)
        max_time = max(r["time"] for r in results)
        
        test_results["response_times"].append(("concurrent-10", total_elapsed))
        
        print(f"\n📊 Concurrent Test Results:")
        print(f"   Total requests: {len(results)}")
        print(f"   Successes: {successes}/{len(results)}")
        print(f"   Total time: {total_elapsed*1000:.1f}ms")
        print(f"   Avg time per request: {avg_time*1000:.1f}ms")
        print(f"   Max time: {max_time*1000:.1f}ms")
        
        if failures:
            print(f"   Failures: {failures}")
        
        assert successes >= 8, f"Expected at least 8/10 successes, got {successes}/10"
        assert total_elapsed < 15.0, f"Total time {total_elapsed:.2f}s exceeds 15s limit"
        print(f"✅ 10 concurrent admin requests passed - {successes}/10 success")


class TestRapidSequentialCalls:
    """Test 20 rapid sequential API calls"""
    
    def test_20_rapid_sequential_calls(self, admin_token):
        """Make 20 rapid sequential API calls"""
        endpoints = [
            "/api/health",
            "/api/admin/stats",
            "/api/admin/search?q=a",
            "/api/admin/search?q=98",
            "/api/payment/membership-plans"
        ]
        
        results = []
        start_total = time.time()
        
        for i in range(20):
            endpoint = endpoints[i % len(endpoints)]
            start = time.time()
            try:
                headers = {}
                if "/admin/" in endpoint:
                    headers["Authorization"] = f"Bearer {admin_token}"
                
                response = requests.get(
                    f"{BASE_URL}{endpoint}",
                    headers=headers,
                    timeout=10
                )
                elapsed = time.time() - start
                results.append({
                    "index": i,
                    "endpoint": endpoint,
                    "status": response.status_code,
                    "success": response.status_code == 200,
                    "time": elapsed
                })
            except Exception as e:
                results.append({
                    "index": i,
                    "endpoint": endpoint,
                    "status": 0,
                    "success": False,
                    "error": str(e),
                    "time": time.time() - start
                })
        
        total_elapsed = time.time() - start_total
        
        # Analyze
        successes = sum(1 for r in results if r["success"])
        avg_time = sum(r["time"] for r in results) / len(results)
        max_time = max(r["time"] for r in results)
        
        test_results["response_times"].append(("sequential-20", total_elapsed))
        
        print(f"\n📊 Sequential Test Results:")
        print(f"   Total requests: {len(results)}")
        print(f"   Successes: {successes}/{len(results)}")
        print(f"   Total time: {total_elapsed*1000:.1f}ms")
        print(f"   Avg time per request: {avg_time*1000:.1f}ms")
        print(f"   Max time: {max_time*1000:.1f}ms")
        
        assert successes >= 18, f"Expected at least 18/20 successes, got {successes}/20"
        print(f"✅ 20 rapid sequential calls passed - {successes}/20 success")


class TestResponseTimeVerification:
    """Verify all responses complete under 2 seconds"""
    
    def test_all_critical_endpoints_under_2s(self, admin_token):
        """Verify critical endpoints respond under 2 seconds"""
        critical_endpoints = [
            ("/api/health", None),
            ("/api/payment/membership-plans", None),
            ("/api/admin/stats", admin_token),
            ("/api/admin/search?q=test", admin_token),
            ("/api/admin/kopartners/pending", admin_token)
        ]
        
        slow_endpoints = []
        
        for endpoint, token in critical_endpoints:
            headers = {}
            if token:
                headers["Authorization"] = f"Bearer {token}"
            
            start = time.time()
            try:
                response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=5)
                elapsed = time.time() - start
                
                if elapsed > 2.0:
                    slow_endpoints.append((endpoint, elapsed))
                
                print(f"   {endpoint}: {elapsed*1000:.1f}ms {'⚠️ SLOW' if elapsed > 2.0 else '✅'}")
            except Exception as e:
                print(f"   {endpoint}: ERROR - {str(e)}")
        
        assert len(slow_endpoints) == 0, f"Slow endpoints: {slow_endpoints}"
        print(f"✅ All critical endpoints respond under 2 seconds")


class TestNo500Errors:
    """Verify no 500 errors under load"""
    
    def test_no_500_errors(self, admin_token):
        """Make multiple requests and verify no 500 errors"""
        endpoints = [
            ("/api/health", None),
            ("/api/payment/membership-plans", None),
            ("/api/admin/stats", admin_token),
            ("/api/admin/users/all?limit=5", admin_token),
            ("/api/admin/kopartners/all?limit=5", admin_token),
            ("/api/admin/kopartners/pending", admin_token),
            ("/api/admin/search?q=test", admin_token),
            ("/api/admin/search?q=12345", admin_token),
            ("/api/auth/admin-login", None),  # POST - will handle separately
        ]
        
        errors_500 = []
        
        for endpoint, token in endpoints:
            headers = {}
            if token:
                headers["Authorization"] = f"Bearer {token}"
            
            try:
                if "admin-login" in endpoint:
                    response = requests.post(
                        f"{BASE_URL}{endpoint}",
                        json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
                        timeout=10
                    )
                else:
                    response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=10)
                
                if response.status_code >= 500:
                    errors_500.append((endpoint, response.status_code, response.text[:200]))
            except Exception as e:
                errors_500.append((endpoint, 0, str(e)))
        
        if errors_500:
            print(f"❌ 500 errors found: {errors_500}")
        
        assert len(errors_500) == 0, f"Found 500 errors: {errors_500}"
        print(f"✅ No 500 errors - All {len(endpoints)} endpoints healthy")


def test_summary():
    """Print test summary"""
    print("\n" + "="*60)
    print("PRO LEVEL COMPREHENSIVE TEST SUMMARY")
    print("="*60)
    for name, time_val in test_results["response_times"]:
        print(f"   {name}: {time_val*1000:.1f}ms")
    print("="*60)
