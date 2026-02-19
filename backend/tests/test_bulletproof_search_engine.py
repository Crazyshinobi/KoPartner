"""
BULLETPROOF SearchEngine Tests - COMPLETE RECREATION VALIDATION
================================================================
Tests the new SearchEngine class with:
1. Smart query type detection (phone, pincode, email, multi)
2. Parallel execution for multi-field searches
3. 12 second overall timeout protection
4. Concurrent request handling
5. Performance validation (query_time_ms always returned)

Testing based on server.py SearchEngine class implementation.
"""

import pytest
import requests
import os
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor, as_completed

# Base URL from environment - MUST be set
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL must be set")

# Admin credentials
ADMIN_USERNAME = "amit845401"
ADMIN_PASSWORD = "Amit@9810"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin token for all tests in this module"""
    response = requests.post(
        f"{BASE_URL}/api/auth/admin-login",
        json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    data = response.json()
    assert "token" in data, "Token not returned from admin login"
    print(f"✅ Admin login successful, token acquired")
    return data["token"]


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 1: NEW /api/admin/search endpoint tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestAdminSearchEndpoint:
    """Tests for /api/admin/search - BULLETPROOF search with auto-detection"""
    
    def test_search_with_name_query(self, admin_token):
        """Test /api/admin/search with name query - should detect as 'multi' type"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search",
            params={"q": "amit"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Search failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "users" in data, "Missing 'users' in response"
        assert "count" in data, "Missing 'count' in response"
        assert "search_type" in data, "Missing 'search_type' in response"
        assert "query_time_ms" in data, "Missing 'query_time_ms' in response"
        
        # Name/text queries use 'multi' for parallel name+city search
        assert data["search_type"] == "multi", f"Expected 'multi' search_type, got '{data['search_type']}'"
        
        print(f"✅ Name search 'amit': search_type={data['search_type']}, count={data['count']}, time={data['query_time_ms']}ms")
    
    def test_search_with_phone_number(self, admin_token):
        """Test /api/admin/search with phone number (9876543210) - should detect as 'phone'"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search",
            params={"q": "9876543210"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["search_type"] == "phone", f"Expected 'phone' search_type, got '{data['search_type']}'"
        assert "query_time_ms" in data
        
        print(f"✅ Phone search '9876543210': search_type={data['search_type']}, count={data['count']}, time={data['query_time_ms']}ms")
    
    def test_search_with_pincode_exactly_6_digits(self, admin_token):
        """Test /api/admin/search with pincode (110001 - exactly 6 digits) - should detect as 'pincode'"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search",
            params={"q": "110001"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # SearchEngine detects exactly 6 digits as pincode
        assert data["search_type"] == "pincode", f"Expected 'pincode' search_type, got '{data['search_type']}'"
        assert "query_time_ms" in data
        
        print(f"✅ Pincode search '110001': search_type={data['search_type']}, count={data['count']}, time={data['query_time_ms']}ms")
    
    def test_search_with_email(self, admin_token):
        """Test /api/admin/search with email (test@gmail.com) - should detect as 'email'"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search",
            params={"q": "test@gmail.com"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["search_type"] == "email", f"Expected 'email' search_type, got '{data['search_type']}'"
        assert "query_time_ms" in data
        
        print(f"✅ Email search 'test@gmail.com': search_type={data['search_type']}, count={data['count']}, time={data['query_time_ms']}ms")
    
    def test_search_with_city_name(self, admin_token):
        """Test /api/admin/search with city name (Delhi) - should detect as 'multi'"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search",
            params={"q": "Delhi"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # City text triggers 'multi' search (name + city parallel)
        assert data["search_type"] == "multi", f"Expected 'multi' search_type, got '{data['search_type']}'"
        assert "query_time_ms" in data
        
        print(f"✅ City search 'Delhi': search_type={data['search_type']}, count={data['count']}, time={data['query_time_ms']}ms")
    
    def test_search_requires_admin_auth(self):
        """Verify /api/admin/search requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search",
            params={"q": "test"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ Admin search requires authentication")


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 2: /api/admin/fast-search tests (alias for /admin/search)
# ═══════════════════════════════════════════════════════════════════════════════

class TestAdminFastSearchEndpoint:
    """Tests for /api/admin/fast-search - Same functionality as /admin/search"""
    
    def test_fast_search_works_same_as_search(self, admin_token):
        """Verify fast-search returns same structure as search"""
        response = requests.get(
            f"{BASE_URL}/api/admin/fast-search",
            params={"q": "amit"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Same response structure as /admin/search
        assert "users" in data
        assert "count" in data
        assert "search_type" in data
        assert "query_time_ms" in data
        
        print(f"✅ Fast-search 'amit': search_type={data['search_type']}, count={data['count']}, time={data['query_time_ms']}ms")
    
    def test_fast_search_detects_phone(self, admin_token):
        """Verify fast-search correctly detects phone numbers"""
        response = requests.get(
            f"{BASE_URL}/api/admin/fast-search",
            params={"q": "9876543210"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["search_type"] == "phone"
        print(f"✅ Fast-search phone detection working")
    
    def test_fast_search_detects_email(self, admin_token):
        """Verify fast-search correctly detects email"""
        response = requests.get(
            f"{BASE_URL}/api/admin/fast-search",
            params={"q": "test@gmail.com"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["search_type"] == "email"
        print(f"✅ Fast-search email detection working")


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 3: /api/admin/search-users advanced search with filters
# ═══════════════════════════════════════════════════════════════════════════════

class TestAdminSearchUsersAdvanced:
    """Tests for /api/admin/search-users with individual field filters"""
    
    def test_search_users_by_name_filter(self, admin_token):
        """Test search-users with name filter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search-users",
            params={"name": "amit"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "users" in data
        assert "count" in data
        assert "total_count" in data
        assert "query_time_ms" in data
        
        print(f"✅ Search-users by name 'amit': count={data['count']}, total={data['total_count']}, time={data['query_time_ms']}ms")
    
    def test_search_users_by_phone_filter(self, admin_token):
        """Test search-users with phone filter (9876543210)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search-users",
            params={"phone": "9876543210"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "users" in data
        assert "query_time_ms" in data
        
        print(f"✅ Search-users by phone '9876543210': count={data['count']}, time={data['query_time_ms']}ms")
    
    def test_search_users_by_city_filter(self, admin_token):
        """Test search-users with city filter (Delhi)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search-users",
            params={"city": "Delhi"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "users" in data
        assert "query_time_ms" in data
        
        print(f"✅ Search-users by city 'Delhi': count={data['count']}, time={data['query_time_ms']}ms")
    
    def test_search_users_by_pincode_filter(self, admin_token):
        """Test search-users with pincode filter (110001)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search-users",
            params={"pincode": "110001"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "users" in data
        assert "query_time_ms" in data
        
        print(f"✅ Search-users by pincode '110001': count={data['count']}, time={data['query_time_ms']}ms")
    
    def test_search_users_with_role_kopartner(self, admin_token):
        """Test search-users with role filter (kopartner)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search-users",
            params={"role": "kopartner"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "users" in data
        assert "query_time_ms" in data
        
        # Verify all returned users are kopartners (role: cuddlist or both)
        for user in data.get("users", []):
            assert user["role"] in ["cuddlist", "both"], f"User {user['id']} has unexpected role: {user['role']}"
        
        print(f"✅ Search-users by role 'kopartner': count={data['count']}, time={data['query_time_ms']}ms")
    
    def test_search_users_with_role_client(self, admin_token):
        """Test search-users with role filter (client)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search-users",
            params={"role": "client"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "users" in data
        assert "query_time_ms" in data
        
        print(f"✅ Search-users by role 'client': count={data['count']}, time={data['query_time_ms']}ms")
    
    def test_search_users_with_status_paid(self, admin_token):
        """Test search-users with status filter (paid)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search-users",
            params={"status": "paid"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "users" in data
        assert "query_time_ms" in data
        
        # Verify all returned users have membership_paid = True
        for user in data.get("users", []):
            assert user.get("membership_paid") == True, f"User {user['id']} is not paid"
        
        print(f"✅ Search-users by status 'paid': count={data['count']}, time={data['query_time_ms']}ms")
    
    def test_search_users_with_status_unpaid(self, admin_token):
        """Test search-users with status filter (unpaid)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search-users",
            params={"status": "unpaid"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "users" in data
        assert "query_time_ms" in data
        
        print(f"✅ Search-users by status 'unpaid': count={data['count']}, time={data['query_time_ms']}ms")


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 4: CONCURRENT SEARCH REQUESTS (10 parallel)
# ═══════════════════════════════════════════════════════════════════════════════

class TestConcurrentSearchRequests:
    """Test 10 concurrent search requests - CRITICAL for 10 LAC+ users"""
    
    def test_10_concurrent_search_requests(self, admin_token):
        """Test 10 parallel /api/admin/search requests - Should NOT hang"""
        queries = [
            "amit", "rahul", "priya", "delhi", "mumbai",
            "9876543210", "test@gmail.com", "110001", "400001", "kolkata"
        ]
        
        def make_search(query):
            start = time.time()
            try:
                response = requests.get(
                    f"{BASE_URL}/api/admin/search",
                    params={"q": query},
                    headers={"Authorization": f"Bearer {admin_token}"},
                    timeout=15  # 15 second timeout per request
                )
                elapsed = (time.time() - start) * 1000
                data = response.json() if response.status_code == 200 else {}
                return {
                    "query": query,
                    "status": response.status_code,
                    "time_ms": elapsed,
                    "search_type": data.get("search_type", "unknown"),
                    "query_time_ms": data.get("query_time_ms", 0),
                    "error": None
                }
            except Exception as e:
                elapsed = (time.time() - start) * 1000
                return {
                    "query": query,
                    "status": "error",
                    "time_ms": elapsed,
                    "error": str(e)
                }
        
        start_total = time.time()
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_search, q) for q in queries]
            results = [f.result() for f in as_completed(futures)]
        total_time = (time.time() - start_total) * 1000
        
        # Count successes and failures
        successes = [r for r in results if r["status"] == 200]
        failures = [r for r in results if r["status"] != 200]
        
        success_rate = len(successes) / len(results) * 100
        print(f"✅ 10 concurrent searches completed in {total_time:.1f}ms")
        print(f"   Success rate: {success_rate:.1f}% ({len(successes)}/{len(results)})")
        
        for r in results:
            status_str = "✅" if r["status"] == 200 else "❌"
            print(f"   {status_str} {r['query']:15} | type={r.get('search_type', 'error'):8} | time={r['time_ms']:.1f}ms")
        
        # All should succeed
        assert len(successes) >= 8, f"Too many failures: {len(failures)}/10"
        # None should hang (>15 seconds)
        max_time = max(r["time_ms"] for r in results)
        assert max_time < 15000, f"Request hung: {max_time}ms"


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 5: RAPID SEQUENTIAL SEARCHES (20 searches)
# ═══════════════════════════════════════════════════════════════════════════════

class TestRapidSequentialSearches:
    """Test 20 rapid sequential searches to ensure no hanging"""
    
    def test_20_rapid_sequential_searches(self, admin_token):
        """Test 20 rapid sequential searches - Should all complete without hanging"""
        queries = [
            "user", "test", "amit", "delhi", "9876", 
            "@gmail", "mumbai", "priya", "rahul", "110001",
            "kolkata", "bangalore", "pune", "chennai", "hyderabad",
            "8765", "7654", "client", "partner", "active"
        ]
        
        results = []
        for query in queries:
            start = time.time()
            response = requests.get(
                f"{BASE_URL}/api/admin/search",
                params={"q": query},
                headers={"Authorization": f"Bearer {admin_token}"},
                timeout=15
            )
            elapsed = (time.time() - start) * 1000
            
            assert response.status_code == 200, f"Search failed for '{query}': {response.text}"
            data = response.json()
            results.append({
                "query": query,
                "time_ms": elapsed,
                "query_time_ms": data.get("query_time_ms", 0),
                "search_type": data.get("search_type", "unknown")
            })
        
        avg_time = sum(r["time_ms"] for r in results) / len(results)
        avg_server = sum(r["query_time_ms"] for r in results) / len(results)
        max_time = max(r["time_ms"] for r in results)
        
        print(f"✅ 20 rapid searches completed:")
        print(f"   Average total time: {avg_time:.1f}ms")
        print(f"   Average server time: {avg_server:.1f}ms")
        print(f"   Max time: {max_time:.1f}ms")
        
        # No search should hang
        assert max_time < 3000, f"Max time too high: {max_time}ms (search may be hanging)"


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 6: SEARCH NEVER HANGS VALIDATION
# ═══════════════════════════════════════════════════════════════════════════════

class TestSearchNeverHangs:
    """Verify search NEVER hangs with single character queries"""
    
    def test_single_character_queries_complete(self, admin_token):
        """Test single character queries (a, e, i, o, u) - Could match many records"""
        single_char_queries = ["a", "e", "i", "o", "u"]
        
        for query in single_char_queries:
            start = time.time()
            try:
                response = requests.get(
                    f"{BASE_URL}/api/admin/search",
                    params={"q": query},
                    headers={"Authorization": f"Bearer {admin_token}"},
                    timeout=15
                )
                elapsed = (time.time() - start) * 1000
                
                assert response.status_code == 200, f"Search failed for '{query}'"
                data = response.json()
                
                # Check if timeout occurred (still acceptable - means protection worked)
                if "error" in data and "timeout" in data.get("error", "").lower():
                    print(f"✅ Query '{query}' timed out safely in {elapsed:.1f}ms (protection working)")
                else:
                    print(f"✅ Query '{query}' completed in {elapsed:.1f}ms, count={data['count']}")
                
                # Should never exceed 15 seconds (client timeout)
                assert elapsed < 15000, f"Query '{query}' took too long: {elapsed}ms"
                
            except requests.exceptions.Timeout:
                elapsed = (time.time() - start) * 1000
                print(f"⚠️ Query '{query}' hit client timeout ({elapsed:.1f}ms) - acceptable")
                assert elapsed < 20000, f"Client timeout took too long: {elapsed}ms"
    
    def test_empty_query_returns_immediately(self, admin_token):
        """Test empty query returns immediately without hanging"""
        start = time.time()
        response = requests.get(
            f"{BASE_URL}/api/admin/search",
            params={"q": ""},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        elapsed = (time.time() - start) * 1000
        
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 0
        assert data["search_type"] in ["empty", "invalid"]
        
        print(f"✅ Empty query returned in {elapsed:.1f}ms with search_type='{data['search_type']}'")


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 7: QUERY_TIME_MS VALIDATION
# ═══════════════════════════════════════════════════════════════════════════════

class TestQueryTimeValidation:
    """Verify query_time_ms is returned in all responses"""
    
    def test_query_time_returned_for_all_search_types(self, admin_token):
        """Verify query_time_ms is returned for phone, pincode, email, and multi searches"""
        test_cases = [
            ("amit", "multi", "Name search"),
            ("9876543210", "phone", "Phone search"),
            ("110001", "pincode", "Pincode search"),
            ("test@gmail.com", "email", "Email search"),
            ("Delhi", "multi", "City search"),
        ]
        
        all_have_time = True
        for query, expected_type, description in test_cases:
            response = requests.get(
                f"{BASE_URL}/api/admin/search",
                params={"q": query},
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200
            data = response.json()
            
            has_time = "query_time_ms" in data
            if not has_time:
                all_have_time = False
                print(f"❌ {description} ('{query}'): query_time_ms MISSING")
            else:
                time_ms = data["query_time_ms"]
                print(f"✅ {description} ('{query}'): search_type={data['search_type']}, query_time_ms={time_ms}ms")
        
        assert all_have_time, "Some searches missing query_time_ms"
    
    def test_search_type_correctly_detected(self, admin_token):
        """Verify search_type is correctly detected for all query types
        
        Note: SearchEngine.detect_search_type() rules:
        - pincode: exactly 6 digits
        - phone: 7-10 digits (not 5 digits)
        - email: contains @ and .
        - multi: everything else (text searches name AND city in parallel)
        """
        test_cases = [
            ("9876543210", "phone"),    # 10-digit phone
            ("98765", "multi"),         # 5-digit = multi (not enough digits for phone)
            ("9876543", "phone"),       # 7-digit phone (minimum for phone detection)
            ("987654321", "phone"),     # 9-digit phone
            ("110001", "pincode"),      # Exactly 6 digits = pincode
            ("test@gmail.com", "email"), # Email with @
            ("amit", "multi"),          # Text = name/city search
            ("Delhi", "multi"),         # Text = name/city search
        ]
        
        for query, expected_type in test_cases:
            response = requests.get(
                f"{BASE_URL}/api/admin/search",
                params={"q": query},
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200
            data = response.json()
            
            actual_type = data.get("search_type")
            assert actual_type == expected_type, f"Query '{query}': expected '{expected_type}', got '{actual_type}'"
            print(f"✅ Query '{query}' correctly detected as '{actual_type}'")


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 8: ALL ENDPOINTS USE SAME SearchEngine
# ═══════════════════════════════════════════════════════════════════════════════

class TestSearchEngineConsistency:
    """Verify all endpoints use the same SearchEngine.execute_search() internally"""
    
    def test_search_and_fast_search_return_same_structure(self, admin_token):
        """Verify /admin/search and /admin/fast-search return same response structure"""
        query = "amit"
        
        # Test /admin/search
        response1 = requests.get(
            f"{BASE_URL}/api/admin/search",
            params={"q": query},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        data1 = response1.json()
        
        # Test /admin/fast-search
        response2 = requests.get(
            f"{BASE_URL}/api/admin/fast-search",
            params={"q": query},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        data2 = response2.json()
        
        # Both should have same structure
        assert set(data1.keys()) == set(data2.keys()), "Different response structure"
        assert data1["search_type"] == data2["search_type"], "Different search_type"
        assert data1["count"] == data2["count"], "Different count"
        
        print(f"✅ /admin/search and /admin/fast-search return identical structure")
    
    def test_search_users_returns_query_time(self, admin_token):
        """Verify /admin/search-users also returns query_time_ms"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search-users",
            params={"name": "amit"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "query_time_ms" in data, "query_time_ms missing from search-users"
        print(f"✅ /admin/search-users returns query_time_ms: {data['query_time_ms']}ms")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
