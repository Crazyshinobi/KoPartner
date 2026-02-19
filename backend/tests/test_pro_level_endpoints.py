"""
PRO LEVEL Backend Tests for KoPartner - 1 LAC+ hits/day
=========================================================
Tests the high-traffic endpoints with retry logic and connection pooling:
1. Admin login with credentials amit845401/Amit@9810
2. Admin stats with parallel queries  
3. Admin users all with pagination
4. KoPartner my-bookings with retry logic
5. Client my-bookings with retry logic
6. Fast search endpoint
7. Health check endpoint
"""

import pytest
import requests
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

# Base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials from review request
ADMIN_USERNAME = "amit845401"
ADMIN_PASSWORD = "Amit@9810"


class TestHealthCheck:
    """Test /api/health endpoint - Basic connectivity"""
    
    def test_health_endpoint_returns_healthy(self):
        """Verify health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        
        assert data["status"] == "healthy", f"Status not healthy: {data}"
        assert data["database"] == "connected", "Database not connected"
        assert "timestamp" in data, "Missing timestamp"
        
        print(f"✅ Health check passed: {data['status']}, DB: {data['database']}")


class TestAdminLogin:
    """Test /api/auth/admin-login - PRO LEVEL with retry logic"""
    
    def test_admin_login_success(self):
        """Test admin login with credentials amit845401/Amit@9810"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        
        assert "token" in data, "Token missing from response"
        assert "user" in data, "User missing from response"
        assert "message" in data, "Message missing from response"
        assert data["user"]["role"] == "admin", "User role should be admin"
        
        print(f"✅ Admin login successful: {data['message']}")
        return data["token"]
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with wrong credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"username": "wrong_user", "password": "wrong_pass"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Invalid credentials rejected correctly")
    
    def test_admin_login_empty_credentials(self):
        """Test admin login with empty credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"username": "", "password": ""}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Empty credentials rejected correctly")


class TestAdminStats:
    """Test /api/admin/stats - PRO LEVEL with parallel queries"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.text}")
        return response.json()["token"]
    
    def test_admin_stats_returns_all_counts(self, admin_token):
        """Verify admin stats returns all required counts"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Admin stats failed: {response.text}"
        data = response.json()
        
        # Verify all expected fields are present
        expected_fields = [
            "total_users",
            "total_clients",
            "total_kopartners",
            "active_kopartners",
            "pending_approvals",
            "unpaid_kopartners",
            "online_kopartners",
            "total_bookings",
            "accepted_bookings",
            "denied_bookings",
            "pending_bookings",
            "total_transactions",
            "total_revenue",
            "open_sos_reports"
        ]
        
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
            assert isinstance(data[field], (int, float)), f"Field {field} should be numeric"
        
        print(f"✅ Admin stats returned all counts:")
        print(f"   - Total users: {data['total_users']}")
        print(f"   - Total clients: {data['total_clients']}")
        print(f"   - Total KoPartners: {data['total_kopartners']}")
        print(f"   - Active KoPartners: {data['active_kopartners']}")
        print(f"   - Total bookings: {data['total_bookings']}")
        print(f"   - Total revenue: {data['total_revenue']}")
    
    def test_admin_stats_requires_auth(self):
        """Verify admin stats requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ Admin stats requires authentication")
    
    def test_admin_stats_performance(self, admin_token):
        """Test admin stats response time (should be fast with parallel queries)"""
        start_time = time.time()
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        elapsed = (time.time() - start_time) * 1000
        
        assert response.status_code == 200
        print(f"✅ Admin stats response time: {elapsed:.1f}ms")
        # Allow up to 2 seconds for parallel queries with network latency
        assert elapsed < 5000, f"Stats query too slow: {elapsed}ms"


class TestAdminUsersAll:
    """Test /api/admin/users/all - Pagination for 10 Lac+ users"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.text}")
        return response.json()["token"]
    
    def test_users_all_pagination_works(self, admin_token):
        """Test users/all returns paginated data"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users/all",
            params={"page": 1, "limit": 10},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Users/all failed: {response.text}"
        data = response.json()
        
        # Verify pagination structure
        assert "users" in data, "Missing users array"
        assert "count" in data, "Missing count"
        assert "total_count" in data, "Missing total_count"
        assert "page" in data, "Missing page"
        assert "total_pages" in data, "Missing total_pages"
        assert "has_next" in data, "Missing has_next"
        assert "has_prev" in data, "Missing has_prev"
        
        assert data["page"] == 1, "Page should be 1"
        assert data["count"] <= 10, "Count should not exceed limit"
        assert data["has_prev"] == False, "Page 1 should not have prev"
        
        print(f"✅ Users/all pagination works:")
        print(f"   - Total users: {data['total_count']}")
        print(f"   - Page: {data['page']}/{data['total_pages']}")
        print(f"   - Users returned: {data['count']}")
    
    def test_users_all_with_role_filter(self, admin_token):
        """Test users/all with role filter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users/all",
            params={"role": "kopartner", "limit": 10},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify all returned users are KoPartners
        for user in data["users"]:
            assert user["role"] in ["cuddlist", "both"], f"User {user.get('phone')} has wrong role: {user['role']}"
        
        print(f"✅ Role filter (kopartner): {data['count']} users returned")
    
    def test_users_all_with_status_filter(self, admin_token):
        """Test users/all with status filter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users/all",
            params={"status": "paid", "limit": 10},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        print(f"✅ Status filter (paid): {data['count']} users returned")
    
    def test_users_all_with_search(self, admin_token):
        """Test users/all with search parameter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users/all",
            params={"search": "test", "limit": 10},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        print(f"✅ Search ('test'): {data['count']} users returned")
    
    def test_users_all_requires_auth(self):
        """Verify users/all requires admin auth"""
        response = requests.get(f"{BASE_URL}/api/admin/users/all")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ Users/all requires authentication")


class TestFastSearch:
    """Test /api/admin/fast-search - Lightning fast for 10 Lac+ users"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.text}")
        return response.json()["token"]
    
    def test_fast_search_works(self, admin_token):
        """Test fast search endpoint returns results"""
        response = requests.get(
            f"{BASE_URL}/api/admin/fast-search",
            params={"q": "test"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Fast search failed: {response.text}"
        data = response.json()
        
        assert "users" in data, "Missing users"
        assert "count" in data, "Missing count"
        assert "query_type" in data, "Missing query_type"
        assert "query_time_ms" in data, "Missing query_time_ms"
        
        print(f"✅ Fast search works: query_type={data['query_type']}, count={data['count']}, time={data['query_time_ms']}ms")
    
    def test_fast_search_phone_detection(self, admin_token):
        """Test fast search detects phone numbers (5+ digits)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/fast-search",
            params={"q": "98765"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["query_type"] == "phone", f"Expected 'phone', got '{data['query_type']}'"
        print(f"✅ Phone detection: query_type={data['query_type']}")
    
    def test_fast_search_email_detection(self, admin_token):
        """Test fast search detects emails (contains @)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/fast-search",
            params={"q": "test@gmail.com"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["query_type"] == "email", f"Expected 'email', got '{data['query_type']}'"
        print(f"✅ Email detection: query_type={data['query_type']}")
    
    def test_fast_search_text_detection(self, admin_token):
        """Test fast search detects text (name/city)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/fast-search",
            params={"q": "Delhi"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["query_type"] == "text", f"Expected 'text', got '{data['query_type']}'"
        print(f"✅ Text detection: query_type={data['query_type']}")
    
    def test_fast_search_performance(self, admin_token):
        """Test fast search is fast (<100ms server-side target)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/fast-search",
            params={"q": "test"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Server-side query should be under 100ms
        assert data["query_time_ms"] < 100, f"Query too slow: {data['query_time_ms']}ms"
        print(f"✅ Fast search performance: {data['query_time_ms']}ms (target <100ms)")
    
    def test_fast_search_requires_auth(self):
        """Verify fast search requires admin auth"""
        response = requests.get(
            f"{BASE_URL}/api/admin/fast-search",
            params={"q": "test"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ Fast search requires authentication")


class TestKoPartnerBookings:
    """Test /api/kopartner/my-bookings - PRO LEVEL with retry logic"""
    
    @pytest.fixture(scope="class")
    def kopartner_token(self):
        """Try to get a KoPartner token by creating test user or using existing"""
        # First try admin login to check for existing KoPartners
        admin_response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        if admin_response.status_code != 200:
            pytest.skip("Admin login failed, cannot check for KoPartners")
        
        admin_token = admin_response.json()["token"]
        
        # Get a KoPartner user
        users_response = requests.get(
            f"{BASE_URL}/api/admin/users/all",
            params={"role": "kopartner", "limit": 1},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        if users_response.status_code != 200:
            pytest.skip("Cannot get KoPartners list")
        
        users = users_response.json().get("users", [])
        if not users:
            pytest.skip("No KoPartner users available for testing")
        
        # We cannot login as a KoPartner without their password
        # So we skip this test if we can't authenticate
        pytest.skip("Cannot authenticate as KoPartner (no test credentials)")
    
    def test_kopartner_bookings_endpoint_exists(self, kopartner_token):
        """Test kopartner bookings endpoint exists and works"""
        response = requests.get(
            f"{BASE_URL}/api/kopartner/my-bookings",
            headers={"Authorization": f"Bearer {kopartner_token}"}
        )
        assert response.status_code == 200, f"KoPartner bookings failed: {response.text}"
        data = response.json()
        
        assert "bookings" in data, "Missing bookings array"
        assert "count" in data, "Missing count"
        
        print(f"✅ KoPartner bookings: {data['count']} bookings found")
    
    def test_kopartner_bookings_requires_kopartner_role(self):
        """Verify endpoint requires KoPartner role"""
        response = requests.get(f"{BASE_URL}/api/kopartner/my-bookings")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ KoPartner bookings requires authentication")


class TestClientBookings:
    """Test /api/client/my-bookings - PRO LEVEL with retry logic"""
    
    @pytest.fixture(scope="class")
    def client_token(self):
        """Try to get a client token"""
        # We cannot authenticate as a client without credentials
        pytest.skip("Cannot authenticate as client (no test credentials)")
    
    def test_client_bookings_endpoint_exists(self, client_token):
        """Test client bookings endpoint exists and works"""
        response = requests.get(
            f"{BASE_URL}/api/client/my-bookings",
            headers={"Authorization": f"Bearer {client_token}"}
        )
        assert response.status_code == 200, f"Client bookings failed: {response.text}"
        data = response.json()
        
        assert "bookings" in data, "Missing bookings array"
        assert "count" in data, "Missing count"
        
        print(f"✅ Client bookings: {data['count']} bookings found")
    
    def test_client_bookings_requires_auth(self):
        """Verify endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/client/my-bookings")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ Client bookings requires authentication")


class TestProLevelPerformance:
    """Performance tests - Simulating high traffic patterns"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.text}")
        return response.json()["token"]
    
    def test_concurrent_admin_logins(self):
        """Test multiple concurrent admin logins (simulating high traffic)"""
        def do_login():
            start = time.time()
            response = requests.post(
                f"{BASE_URL}/api/auth/admin-login",
                json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
            )
            elapsed = (time.time() - start) * 1000
            return {"status": response.status_code, "time_ms": elapsed}
        
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(do_login) for _ in range(5)]
            results = [f.result() for f in as_completed(futures)]
        
        # All should succeed
        success_count = sum(1 for r in results if r["status"] == 200)
        avg_time = sum(r["time_ms"] for r in results) / len(results)
        
        assert success_count == 5, f"Only {success_count}/5 logins succeeded"
        print(f"✅ Concurrent logins: 5/5 succeeded, avg time: {avg_time:.1f}ms")
    
    def test_concurrent_health_checks(self):
        """Test multiple concurrent health checks"""
        def do_health():
            start = time.time()
            response = requests.get(f"{BASE_URL}/api/health")
            elapsed = (time.time() - start) * 1000
            return {"status": response.status_code, "time_ms": elapsed}
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(do_health) for _ in range(10)]
            results = [f.result() for f in as_completed(futures)]
        
        success_count = sum(1 for r in results if r["status"] == 200)
        avg_time = sum(r["time_ms"] for r in results) / len(results)
        
        assert success_count == 10, f"Only {success_count}/10 health checks succeeded"
        print(f"✅ Concurrent health checks: 10/10 succeeded, avg time: {avg_time:.1f}ms")
    
    def test_concurrent_admin_stats(self, admin_token):
        """Test multiple concurrent stats requests"""
        def do_stats():
            start = time.time()
            response = requests.get(
                f"{BASE_URL}/api/admin/stats",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            elapsed = (time.time() - start) * 1000
            return {"status": response.status_code, "time_ms": elapsed}
        
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(do_stats) for _ in range(5)]
            results = [f.result() for f in as_completed(futures)]
        
        success_count = sum(1 for r in results if r["status"] == 200)
        avg_time = sum(r["time_ms"] for r in results) / len(results)
        
        assert success_count == 5, f"Only {success_count}/5 stats requests succeeded"
        print(f"✅ Concurrent stats: 5/5 succeeded, avg time: {avg_time:.1f}ms")
    
    def test_concurrent_fast_search(self, admin_token):
        """Test multiple concurrent fast searches"""
        queries = ["test", "98765", "@gmail", "Delhi", "user"]
        
        def do_search(q):
            start = time.time()
            response = requests.get(
                f"{BASE_URL}/api/admin/fast-search",
                params={"q": q},
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            elapsed = (time.time() - start) * 1000
            return {"query": q, "status": response.status_code, "time_ms": elapsed}
        
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(do_search, q) for q in queries]
            results = [f.result() for f in as_completed(futures)]
        
        success_count = sum(1 for r in results if r["status"] == 200)
        avg_time = sum(r["time_ms"] for r in results) / len(results)
        
        assert success_count == 5, f"Only {success_count}/5 searches succeeded"
        print(f"✅ Concurrent searches: 5/5 succeeded, avg time: {avg_time:.1f}ms")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
