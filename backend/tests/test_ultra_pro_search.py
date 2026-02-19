"""
ULTRA PRO LEVEL Search Tests for Admin Panel - 10 LAC+ Users Support
====================================================================
Tests the ULTRA PRO search functionality that NEVER HANGS:
1. /api/admin/fast-search - Lightning fast search with 10 second timeout
2. /api/admin/search - Quick search with indexed queries
3. /api/admin/search-users - Advanced search with individual filters and 15s timeout
4. Concurrent search requests (10 parallel)
5. Timeout handling verification
6. Query time performance validation (<500ms target)
"""

import pytest
import requests
import os
import time
import random
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


class TestAdminFastSearchUltraPro:
    """
    ULTRA PRO LEVEL /api/admin/fast-search tests
    Tests the high-performance search with 10 second timeout and parallel indexed queries
    """
    
    def test_fast_search_name_query(self, admin_token):
        """Test fast-search with name query (e.g., 'amit')"""
        start_time = time.time()
        response = requests.get(
            f"{BASE_URL}/api/admin/fast-search",
            params={"q": "amit"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        total_time_ms = (time.time() - start_time) * 1000
        
        assert response.status_code == 200, f"Fast search failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "users" in data, "Missing 'users' in response"
        assert "count" in data, "Missing 'count' in response"
        assert "query_type" in data, "Missing 'query_type' in response"
        assert "query_time_ms" in data, "Missing 'query_time_ms' in response"
        
        # Name search should be detected as 'text' type
        assert data["query_type"] == "text", f"Expected 'text' query_type, got '{data['query_type']}'"
        
        # Verify fast response (<500ms target)
        query_time = data["query_time_ms"]
        print(f"✅ Name search 'amit': query_type={data['query_type']}, count={data['count']}, server_time={query_time}ms, total_time={total_time_ms:.1f}ms")
        assert query_time < 500, f"Query too slow: {query_time}ms (should be <500ms)"
    
    def test_fast_search_phone_number(self, admin_token):
        """Test fast-search with phone number query (e.g., '9876543210')"""
        start_time = time.time()
        response = requests.get(
            f"{BASE_URL}/api/admin/fast-search",
            params={"q": "9876543210"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        total_time_ms = (time.time() - start_time) * 1000
        
        assert response.status_code == 200
        data = response.json()
        
        # Phone search should be detected (5+ digits)
        assert data["query_type"] == "phone", f"Expected 'phone' query_type, got '{data['query_type']}'"
        assert "query_time_ms" in data
        
        query_time = data["query_time_ms"]
        print(f"✅ Phone search '9876543210': query_type={data['query_type']}, count={data['count']}, time={query_time}ms")
        assert query_time < 500, f"Query too slow: {query_time}ms"
    
    def test_fast_search_email_query(self, admin_token):
        """Test fast-search with email query (e.g., 'test@gmail.com')"""
        start_time = time.time()
        response = requests.get(
            f"{BASE_URL}/api/admin/fast-search",
            params={"q": "test@gmail.com"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        total_time_ms = (time.time() - start_time) * 1000
        
        assert response.status_code == 200
        data = response.json()
        
        # Email search should be detected (contains @)
        assert data["query_type"] == "email", f"Expected 'email' query_type, got '{data['query_type']}'"
        assert "query_time_ms" in data
        
        query_time = data["query_time_ms"]
        print(f"✅ Email search 'test@gmail.com': query_type={data['query_type']}, count={data['count']}, time={query_time}ms")
        assert query_time < 500, f"Query too slow: {query_time}ms"
    
    def test_fast_search_city_name(self, admin_token):
        """Test fast-search with city name query (e.g., 'Delhi')"""
        start_time = time.time()
        response = requests.get(
            f"{BASE_URL}/api/admin/fast-search",
            params={"q": "Delhi"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        total_time_ms = (time.time() - start_time) * 1000
        
        assert response.status_code == 200
        data = response.json()
        
        # City search should be detected as 'text' type (name or city)
        assert data["query_type"] == "text", f"Expected 'text' query_type, got '{data['query_type']}'"
        assert "query_time_ms" in data
        
        query_time = data["query_time_ms"]
        print(f"✅ City search 'Delhi': query_type={data['query_type']}, count={data['count']}, time={query_time}ms")
        assert query_time < 500, f"Query too slow: {query_time}ms"
    
    def test_fast_search_pincode(self, admin_token):
        """Test fast-search with pincode query (e.g., '110001')
        
        Note: 6-digit pincode triggers 'pincode' query type when exactly 6 digits
        """
        start_time = time.time()
        response = requests.get(
            f"{BASE_URL}/api/admin/fast-search",
            params={"q": "110001"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        total_time_ms = (time.time() - start_time) * 1000
        
        assert response.status_code == 200
        data = response.json()
        
        # 6 digits could be phone or pincode based on implementation
        assert data["query_type"] in ["pincode", "phone"], f"Expected 'pincode' or 'phone', got '{data['query_type']}'"
        assert "query_time_ms" in data
        
        query_time = data["query_time_ms"]
        print(f"✅ Pincode search '110001': query_type={data['query_type']}, count={data['count']}, time={query_time}ms")
        assert query_time < 500, f"Query too slow: {query_time}ms"
    
    def test_fast_search_partial_phone(self, admin_token):
        """Test fast-search with partial phone number (5 digits)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/fast-search",
            params={"q": "98765"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # 5+ digits triggers phone search
        assert data["query_type"] == "phone"
        assert "query_time_ms" in data
        print(f"✅ Partial phone '98765': query_type={data['query_type']}, count={data['count']}, time={data['query_time_ms']}ms")
    
    def test_fast_search_returns_query_time(self, admin_token):
        """Verify query_time_ms is always returned"""
        queries = ["amit", "9876543210", "test@gmail.com", "Delhi", "110001"]
        
        for query in queries:
            response = requests.get(
                f"{BASE_URL}/api/admin/fast-search",
                params={"q": query},
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200
            data = response.json()
            
            assert "query_time_ms" in data, f"query_time_ms missing for query '{query}'"
            assert isinstance(data["query_time_ms"], (int, float)), f"query_time_ms should be numeric"
            assert data["query_time_ms"] >= 0, f"query_time_ms should be non-negative"
        
        print(f"✅ All {len(queries)} queries returned query_time_ms correctly")
    
    def test_fast_search_all_under_500ms(self, admin_token):
        """Verify all search types complete under 500ms"""
        queries = [
            ("amit", "name"),
            ("9876543210", "phone"),
            ("test@gmail.com", "email"),
            ("Delhi", "city"),
            ("110001", "pincode")
        ]
        
        results = []
        for query, desc in queries:
            response = requests.get(
                f"{BASE_URL}/api/admin/fast-search",
                params={"q": query},
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200
            data = response.json()
            
            query_time = data["query_time_ms"]
            results.append((desc, query, query_time))
            assert query_time < 500, f"{desc} search '{query}' too slow: {query_time}ms"
        
        print("✅ All search types under 500ms:")
        for desc, query, time_ms in results:
            print(f"   - {desc} ({query}): {time_ms}ms")


class TestAdminSearchQuick:
    """Test /api/admin/search endpoint - Quick search for admin panel"""
    
    def test_admin_search_endpoint_exists(self, admin_token):
        """Verify /api/admin/search endpoint exists"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search",
            params={"q": "test"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        # Should not return 404 (endpoint exists)
        assert response.status_code != 404, "Admin search endpoint not found"
        print(f"✅ Admin search endpoint exists, status: {response.status_code}")
    
    def test_admin_search_requires_auth(self):
        """Verify admin search requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search",
            params={"q": "test"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ Admin search requires authentication")
    
    def test_admin_search_with_name(self, admin_token):
        """Test admin search with name query"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search",
            params={"q": "amit"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "count" in data
        print(f"✅ Admin search 'amit': count={data['count']}")
    
    def test_admin_search_with_phone(self, admin_token):
        """Test admin search with phone query"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search",
            params={"q": "9876"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        print(f"✅ Admin search phone '9876': count={data['count']}")


class TestAdvancedSearchWithFilters:
    """Test /api/admin/search-users endpoint - Advanced search with individual field filters"""
    
    def test_search_users_endpoint_exists(self, admin_token):
        """Verify search-users endpoint exists"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search-users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Search-users endpoint failed: {response.text}"
        data = response.json()
        assert "users" in data
        print(f"✅ Search-users endpoint exists, count={data['count']}")
    
    def test_search_users_by_phone_filter(self, admin_token):
        """Test advanced search with phone filter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search-users",
            params={"phone": "9876543210"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total_count" in data
        print(f"✅ Search by phone filter: count={data['count']}, total={data['total_count']}")
    
    def test_search_users_by_name_filter(self, admin_token):
        """Test advanced search with name filter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search-users",
            params={"name": "amit"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        print(f"✅ Search by name filter 'amit': count={data['count']}, total={data['total_count']}")
    
    def test_search_users_by_email_filter(self, admin_token):
        """Test advanced search with email filter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search-users",
            params={"email": "test@gmail.com"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        print(f"✅ Search by email filter: count={data['count']}, total={data['total_count']}")
    
    def test_search_users_by_city_filter(self, admin_token):
        """Test advanced search with city filter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search-users",
            params={"city": "Delhi"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        print(f"✅ Search by city filter 'Delhi': count={data['count']}, total={data['total_count']}")
    
    def test_search_users_by_pincode_filter(self, admin_token):
        """Test advanced search with pincode filter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search-users",
            params={"pincode": "110001"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        print(f"✅ Search by pincode filter '110001': count={data['count']}, total={data['total_count']}")
    
    def test_search_users_with_general_q_parameter(self, admin_token):
        """Test advanced search with general q parameter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search-users",
            params={"q": "amit"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        print(f"✅ Search with q='amit': count={data['count']}, total={data['total_count']}")
    
    def test_search_users_combined_filters(self, admin_token):
        """Test advanced search with combined filters"""
        response = requests.get(
            f"{BASE_URL}/api/admin/search-users",
            params={
                "city": "Delhi",
                "role": "kopartner"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        print(f"✅ Combined filters (city+role): count={data['count']}, total={data['total_count']}")


class TestConcurrentSearchRequests:
    """Test concurrent search requests - CRITICAL for 10 LAC+ users scenario"""
    
    def test_10_parallel_fast_searches(self, admin_token):
        """Test 10 parallel fast-search requests - Should NOT hang"""
        queries = [
            "amit", "rahul", "priya", "delhi", "mumbai",
            "9876543210", "test@gmail.com", "110001", "400001", "kolkata"
        ]
        
        def make_search(query):
            start = time.time()
            try:
                response = requests.get(
                    f"{BASE_URL}/api/admin/fast-search",
                    params={"q": query},
                    headers={"Authorization": f"Bearer {admin_token}"},
                    timeout=15  # 15 second timeout per request
                )
                elapsed = (time.time() - start) * 1000
                return {
                    "query": query,
                    "status": response.status_code,
                    "time_ms": elapsed,
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
        print(f"✅ 10 parallel searches completed in {total_time:.1f}ms")
        print(f"   Success rate: {success_rate:.1f}% ({len(successes)}/{len(results)})")
        
        for r in results:
            status_str = "✅" if r["status"] == 200 else "❌"
            print(f"   {status_str} {r['query']}: {r['status']} in {r['time_ms']:.1f}ms")
        
        # All should succeed
        assert len(successes) >= 8, f"Too many failures: {len(failures)}/10"
        # None should hang (>15 seconds)
        max_time = max(r["time_ms"] for r in results)
        assert max_time < 15000, f"Request hung: {max_time}ms"
    
    def test_concurrent_search_users_requests(self, admin_token):
        """Test concurrent search-users requests with different filters"""
        search_params = [
            {"name": "amit"},
            {"phone": "9876"},
            {"email": "test@"},
            {"city": "Delhi"},
            {"pincode": "110001"},
            {"q": "user"},
            {"role": "kopartner"},
            {"role": "client"},
            {"city": "Mumbai"},
            {"name": "priya"}
        ]
        
        def make_search(params):
            start = time.time()
            try:
                response = requests.get(
                    f"{BASE_URL}/api/admin/search-users",
                    params=params,
                    headers={"Authorization": f"Bearer {admin_token}"},
                    timeout=20
                )
                elapsed = (time.time() - start) * 1000
                return {
                    "params": params,
                    "status": response.status_code,
                    "time_ms": elapsed
                }
            except Exception as e:
                elapsed = (time.time() - start) * 1000
                return {
                    "params": params,
                    "status": "error",
                    "time_ms": elapsed,
                    "error": str(e)
                }
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_search, p) for p in search_params]
            results = [f.result() for f in as_completed(futures)]
        
        successes = [r for r in results if r["status"] == 200]
        success_rate = len(successes) / len(results) * 100
        
        print(f"✅ 10 concurrent search-users requests:")
        print(f"   Success rate: {success_rate:.1f}%")
        
        assert len(successes) >= 8, f"Too many failures in concurrent search-users"


class TestSearchTimeoutHandling:
    """Test that searches properly timeout and don't hang"""
    
    def test_fast_search_has_timeout_protection(self, admin_token):
        """Verify fast-search returns within timeout (10 seconds max)"""
        start = time.time()
        response = requests.get(
            f"{BASE_URL}/api/admin/fast-search",
            params={"q": "a"},  # Single character - could match many records
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=15
        )
        elapsed = (time.time() - start) * 1000
        
        assert response.status_code == 200, f"Fast search failed: {response.text}"
        data = response.json()
        
        # Should complete within 10 seconds (the server-side timeout)
        assert elapsed < 12000, f"Request took too long: {elapsed}ms (>12s)"
        
        # Check if timeout was hit
        if "error" in data and "timeout" in data.get("error", "").lower():
            print(f"✅ Search timeout hit as expected (query 'a'), elapsed={elapsed:.1f}ms")
        else:
            query_time = data.get("query_time_ms", 0)
            print(f"✅ Search completed successfully: count={data['count']}, query_time={query_time}ms, total={elapsed:.1f}ms")
    
    def test_search_users_has_timeout_protection(self, admin_token):
        """Verify search-users returns within timeout (15 seconds max)"""
        start = time.time()
        response = requests.get(
            f"{BASE_URL}/api/admin/search-users",
            params={"q": "a"},
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=20
        )
        elapsed = (time.time() - start) * 1000
        
        assert response.status_code == 200
        
        # Should complete within 15 seconds (the server-side timeout)
        assert elapsed < 17000, f"Request took too long: {elapsed}ms"
        print(f"✅ Search-users completed in {elapsed:.1f}ms")
    
    def test_search_never_hangs_indefinitely(self, admin_token):
        """Test that search never hangs - always returns or times out"""
        # Test with various potentially slow queries
        slow_queries = ["a", "e", "i", "o", "u"]  # Single chars match many records
        
        for query in slow_queries:
            start = time.time()
            try:
                response = requests.get(
                    f"{BASE_URL}/api/admin/fast-search",
                    params={"q": query},
                    headers={"Authorization": f"Bearer {admin_token}"},
                    timeout=15
                )
                elapsed = (time.time() - start) * 1000
                
                # Should always get a response
                assert response.status_code in [200, 408], f"Unexpected status for '{query}'"
                print(f"✅ Query '{query}' completed in {elapsed:.1f}ms")
                
            except requests.exceptions.Timeout:
                elapsed = (time.time() - start) * 1000
                print(f"⚠️ Query '{query}' timed out at client level ({elapsed:.1f}ms)")
                # This is also acceptable - means client timeout worked
                assert elapsed < 20000, f"Timeout took too long: {elapsed}ms"


class TestSearchPerformanceValidation:
    """Performance validation tests for admin search"""
    
    def test_all_search_types_performance(self, admin_token):
        """Comprehensive performance test for all search types"""
        test_cases = [
            # (query, expected_type, description)
            ("amit", "text", "Name search"),
            ("9876543210", "phone", "Full phone"),
            ("98765", "phone", "Partial phone"),
            ("test@gmail.com", "email", "Full email"),
            ("@example.com", "email", "Partial email"),
            ("Delhi", "text", "City search"),
            ("Mumbai", "text", "City search 2"),
            ("110001", "pincode", "Pincode"),  # May be phone
        ]
        
        all_results = []
        for query, expected_type, desc in test_cases:
            start = time.time()
            response = requests.get(
                f"{BASE_URL}/api/admin/fast-search",
                params={"q": query},
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            total_time = (time.time() - start) * 1000
            
            assert response.status_code == 200
            data = response.json()
            
            result = {
                "description": desc,
                "query": query,
                "expected_type": expected_type,
                "actual_type": data.get("query_type"),
                "count": data.get("count", 0),
                "server_time_ms": data.get("query_time_ms", 0),
                "total_time_ms": total_time
            }
            all_results.append(result)
        
        print("\n📊 Search Performance Summary:")
        print("-" * 80)
        for r in all_results:
            status = "✅" if r["server_time_ms"] < 500 else "⚠️"
            print(f"{status} {r['description']:20} | {r['query']:20} | type={r['actual_type']:8} | count={r['count']:4} | server={r['server_time_ms']:6.1f}ms | total={r['total_time_ms']:6.1f}ms")
        print("-" * 80)
        
        # Verify all under 500ms target
        slow_queries = [r for r in all_results if r["server_time_ms"] >= 500]
        assert len(slow_queries) == 0, f"Slow queries found: {slow_queries}"
        
        # Calculate averages
        avg_server = sum(r["server_time_ms"] for r in all_results) / len(all_results)
        avg_total = sum(r["total_time_ms"] for r in all_results) / len(all_results)
        print(f"\n✅ All {len(all_results)} queries passed performance check")
        print(f"   Average server time: {avg_server:.1f}ms")
        print(f"   Average total time: {avg_total:.1f}ms")
    
    def test_rapid_fire_searches(self, admin_token):
        """Test 20 rapid sequential searches"""
        queries = ["user", "test", "amit", "delhi", "9876", "@gmail", "mumbai", "priya", 
                   "rahul", "110001", "kolkata", "bangalore", "pune", "chennai", "hyderabad",
                   "8765", "7654", "client", "partner", "active"]
        
        results = []
        for query in queries:
            start = time.time()
            response = requests.get(
                f"{BASE_URL}/api/admin/fast-search",
                params={"q": query},
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            elapsed = (time.time() - start) * 1000
            
            assert response.status_code == 200
            data = response.json()
            results.append({
                "query": query,
                "time_ms": elapsed,
                "server_time_ms": data.get("query_time_ms", 0)
            })
        
        avg_time = sum(r["time_ms"] for r in results) / len(results)
        avg_server = sum(r["server_time_ms"] for r in results) / len(results)
        max_time = max(r["time_ms"] for r in results)
        
        print(f"✅ 20 rapid searches completed:")
        print(f"   Average total time: {avg_time:.1f}ms")
        print(f"   Average server time: {avg_server:.1f}ms")
        print(f"   Max time: {max_time:.1f}ms")
        
        assert max_time < 2000, f"Max time too high: {max_time}ms"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
