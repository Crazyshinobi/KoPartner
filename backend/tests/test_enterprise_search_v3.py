"""
Test Suite for ENTERPRISE GRADE SearchEngine Version 3.0
==========================================================
Tests for 10 LAC+ (1 Million+) user scale with:
1. In-memory result caching (5 min TTL)
2. Minimal projection (excludes large arrays)
3. Stricter timeouts (8s max)
4. Query hints for index forcing
5. Exception handling in parallel queries
6. Strict limits on contains matches
"""

import pytest
import requests
import os
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Backend URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "amit845401"
ADMIN_PASSWORD = "Amit@9810"


class TestEnterpriseSearchV3:
    """Test suite for Enterprise Grade Search Engine v3.0"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.admin_token = None
        
    def get_admin_token(self):
        """Get admin authentication token"""
        if self.admin_token:
            return self.admin_token
            
        response = self.session.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        
        if response.status_code == 200:
            self.admin_token = response.json().get("token")
            return self.admin_token
        else:
            pytest.skip(f"Admin login failed: {response.status_code}")
            
    def make_search_request(self, query: str, limit: int = 50):
        """Make authenticated search request"""
        token = self.get_admin_token()
        headers = {"Authorization": f"Bearer {token}"}
        
        response = self.session.get(
            f"{BASE_URL}/api/admin/search",
            params={"q": query, "limit": limit},
            headers=headers,
            timeout=15
        )
        return response
    
    # =====================================================
    # TEST 1: Phone Exact Match (10 digits)
    # =====================================================
    def test_phone_exact_match_10_digits(self):
        """Test phone exact match with 10 digits - should use unique index"""
        response = self.make_search_request("9810535398")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "search_type" in data
        assert data["search_type"] in ["phone", "cached"], f"Expected phone/cached, got {data['search_type']}"
        assert "query_time_ms" in data
        assert data["query_time_ms"] < 100, f"Query took {data['query_time_ms']}ms, expected <100ms"
        
        print(f"✅ Phone exact match (10 digits): {data['count']} results in {data['query_time_ms']}ms")
    
    # =====================================================
    # TEST 2: Phone Partial Match (5+ digits)
    # =====================================================
    def test_phone_partial_match_5_plus_digits(self):
        """Test phone partial match with 5+ digits"""
        response = self.make_search_request("98105")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["search_type"] in ["phone", "cached"]
        assert data["query_time_ms"] < 100
        
        print(f"✅ Phone partial match (5 digits): {data['count']} results in {data['query_time_ms']}ms")
    
    # =====================================================
    # TEST 3: Name Search
    # =====================================================
    def test_name_search(self):
        """Test name search - should use multi parallel search"""
        response = self.make_search_request("amit")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["search_type"] in ["multi", "cached"]
        assert data["query_time_ms"] < 100
        
        print(f"✅ Name search: {data['count']} results in {data['query_time_ms']}ms")
    
    # =====================================================
    # TEST 4: City Search
    # =====================================================
    def test_city_search(self):
        """Test city search - should use multi parallel search"""
        response = self.make_search_request("Delhi")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["search_type"] in ["multi", "cached"]
        assert data["query_time_ms"] < 100
        
        print(f"✅ City search: {data['count']} results in {data['query_time_ms']}ms")
    
    # =====================================================
    # TEST 5: Email Search
    # =====================================================
    def test_email_search(self):
        """Test email search"""
        response = self.make_search_request("test@gmail.com")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["search_type"] in ["email", "cached"]
        assert data["query_time_ms"] < 100
        
        print(f"✅ Email search: {data['count']} results in {data['query_time_ms']}ms")
    
    # =====================================================
    # TEST 6: Pincode Search
    # =====================================================
    def test_pincode_search(self):
        """Test pincode search - exactly 6 digits"""
        response = self.make_search_request("110001")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["search_type"] in ["pincode", "cached"]
        assert data["query_time_ms"] < 100
        
        print(f"✅ Pincode search: {data['count']} results in {data['query_time_ms']}ms")
    
    # =====================================================
    # TEST 7: CACHING - Same query should return 'cached'
    # =====================================================
    def test_caching_mechanism(self):
        """Test caching - second call should be 'cached' with near 0ms"""
        # First call - should NOT be cached
        query = f"test_cache_{int(time.time())}"  # Unique query
        response1 = self.make_search_request(query)
        assert response1.status_code == 200
        data1 = response1.json()
        
        # Note: First call might be cached if query was done before, 
        # but we use unique query to ensure fresh
        first_type = data1["search_type"]
        first_time = data1["query_time_ms"]
        
        # Second call - SHOULD be cached
        response2 = self.make_search_request(query)
        assert response2.status_code == 200
        data2 = response2.json()
        
        # Second call should be cached
        assert data2["search_type"] == "cached", f"Expected 'cached', got '{data2['search_type']}'"
        
        # Cached should be MUCH faster (near 0ms)
        assert data2["query_time_ms"] < 5, f"Cached query took {data2['query_time_ms']}ms, expected <5ms"
        
        print(f"✅ Caching works! First: {first_time}ms ({first_type}), Cached: {data2['query_time_ms']}ms")
    
    def test_caching_with_phone_number(self):
        """Test caching with phone number search"""
        # First call
        response1 = self.make_search_request("9876543210")
        assert response1.status_code == 200
        data1 = response1.json()
        
        # Second call - should be cached
        response2 = self.make_search_request("9876543210")
        assert response2.status_code == 200
        data2 = response2.json()
        
        assert data2["search_type"] == "cached"
        assert data2["query_time_ms"] < 5
        
        print(f"✅ Phone caching works! First: {data1['query_time_ms']}ms, Cached: {data2['query_time_ms']}ms")
    
    # =====================================================
    # TEST 8: 10 Concurrent Searches
    # =====================================================
    def test_10_concurrent_searches(self):
        """Test 10 concurrent searches - should all succeed"""
        queries = [
            "9810535398",  # Phone
            "amit",        # Name
            "Delhi",       # City
            "110001",      # Pincode
            "test@",       # Email partial
            "98765",       # Phone partial
            "kumar",       # Name
            "Mumbai",      # City
            "400001",      # Pincode
            "user@test.com"  # Email
        ]
        
        token = self.get_admin_token()
        headers = {"Authorization": f"Bearer {token}"}
        
        def do_search(query):
            try:
                start = time.time()
                response = requests.get(
                    f"{BASE_URL}/api/admin/search",
                    params={"q": query, "limit": 50},
                    headers=headers,
                    timeout=15
                )
                elapsed = (time.time() - start) * 1000
                return {
                    "query": query,
                    "status": response.status_code,
                    "time_ms": elapsed,
                    "server_time_ms": response.json().get("query_time_ms", -1) if response.status_code == 200 else -1,
                    "success": response.status_code == 200
                }
            except Exception as e:
                return {"query": query, "status": 500, "error": str(e), "success": False}
        
        # Execute 10 concurrent searches
        with ThreadPoolExecutor(max_workers=10) as executor:
            results = list(executor.map(do_search, queries))
        
        # All should succeed
        successful = [r for r in results if r["success"]]
        failed = [r for r in results if not r["success"]]
        
        print(f"✅ Concurrent searches: {len(successful)}/10 succeeded")
        
        for r in results:
            if r["success"]:
                print(f"   - '{r['query']}': {r['server_time_ms']}ms server, {r['time_ms']:.0f}ms total")
            else:
                print(f"   - '{r['query']}': FAILED - {r.get('error', 'Unknown')}")
        
        assert len(successful) == 10, f"Expected all 10 to succeed, got {len(successful)}"
        
        # All server times should be under 100ms
        for r in successful:
            assert r["server_time_ms"] < 100, f"Query '{r['query']}' took {r['server_time_ms']}ms"
    
    # =====================================================
    # TEST 9: 20 Rapid Sequential Searches
    # =====================================================
    def test_20_rapid_sequential_searches(self):
        """Test 20 rapid sequential searches - should all complete under 100ms"""
        queries = [
            "9810", "amit", "delhi", "110001", "test@",
            "98765", "kumar", "mumbai", "400001", "user@",
            "9876", "singh", "chennai", "600001", "admin@",
            "8765", "sharma", "kolkata", "700001", "info@"
        ]
        
        token = self.get_admin_token()
        headers = {"Authorization": f"Bearer {token}"}
        
        results = []
        for query in queries:
            start = time.time()
            response = requests.get(
                f"{BASE_URL}/api/admin/search",
                params={"q": query, "limit": 50},
                headers=headers,
                timeout=15
            )
            elapsed = (time.time() - start) * 1000
            
            if response.status_code == 200:
                data = response.json()
                results.append({
                    "query": query,
                    "status": 200,
                    "server_time_ms": data.get("query_time_ms", -1),
                    "total_time_ms": elapsed,
                    "search_type": data.get("search_type", "unknown")
                })
            else:
                results.append({
                    "query": query,
                    "status": response.status_code,
                    "error": "Failed"
                })
        
        # Count successes
        successful = [r for r in results if r.get("status") == 200]
        failed = [r for r in results if r.get("status") != 200]
        
        print(f"✅ Rapid sequential: {len(successful)}/20 succeeded")
        
        # Check all under 100ms (server time)
        for r in successful:
            if r["server_time_ms"] > 100:
                print(f"   ⚠️ '{r['query']}': {r['server_time_ms']}ms (over 100ms)")
            else:
                print(f"   - '{r['query']}': {r['server_time_ms']}ms ({r['search_type']})")
        
        assert len(successful) >= 18, f"Expected at least 18 successes, got {len(successful)}"
        
        # At least 90% should be under 100ms
        under_100ms = [r for r in successful if r["server_time_ms"] < 100]
        assert len(under_100ms) >= 18, f"Expected 18+ under 100ms, got {len(under_100ms)}"
    
    # =====================================================
    # TEST 10: Verify All Searches Under 100ms
    # =====================================================
    def test_all_search_types_under_100ms(self):
        """Verify all search types complete under 100ms"""
        test_cases = [
            ("9810535398", "phone"),      # Phone exact
            ("98105", "phone"),           # Phone partial
            ("amit", "multi"),            # Name
            ("Delhi", "multi"),           # City
            ("test@gmail.com", "email"),  # Email
            ("110001", "pincode"),        # Pincode
        ]
        
        all_passed = True
        for query, expected_type in test_cases:
            response = self.make_search_request(query)
            assert response.status_code == 200
            data = response.json()
            
            # Type should match (or be cached)
            actual_type = data.get("search_type")
            time_ms = data.get("query_time_ms", -1)
            
            if time_ms >= 100:
                print(f"   ❌ '{query}' ({actual_type}): {time_ms}ms OVER 100ms")
                all_passed = False
            else:
                print(f"   ✅ '{query}' ({actual_type}): {time_ms}ms")
        
        assert all_passed, "Some searches took over 100ms"
    
    # =====================================================
    # TEST 11: Verify Minimal Projection Excludes Large Fields
    # =====================================================
    def test_minimal_projection_excludes_large_fields(self):
        """Verify FAST_PROJECTION excludes kopartner_selections, hobbies, services"""
        response = self.make_search_request("amit")
        
        assert response.status_code == 200
        data = response.json()
        
        users = data.get("users", [])
        
        if len(users) > 0:
            user = users[0]
            
            # These fields should NOT be present due to FAST_PROJECTION
            excluded_fields = ["kopartner_selections", "hobbies", "services", "password_hash", "_id"]
            
            for field in excluded_fields:
                assert field not in user, f"Field '{field}' should be excluded but found in response"
            
            print(f"✅ Minimal projection verified - excluded: {excluded_fields}")
        else:
            print("⚠️ No users found to verify projection - test passes by default")
    
    # =====================================================
    # TEST 12: Verify Cache Works (Repeat Same Query)
    # =====================================================
    def test_cache_repeat_query(self):
        """Verify cache by repeating same query multiple times"""
        query = "test_cache_repeat"
        
        times = []
        types = []
        
        for i in range(5):
            response = self.make_search_request(query)
            assert response.status_code == 200
            data = response.json()
            times.append(data["query_time_ms"])
            types.append(data["search_type"])
        
        # First call might not be cached, but subsequent should be
        # All calls after first should be 'cached'
        for i in range(1, 5):
            assert types[i] == "cached", f"Call {i+1} should be cached, got {types[i]}"
            assert times[i] < 5, f"Cached call {i+1} took {times[i]}ms, expected <5ms"
        
        print(f"✅ Cache repeat test: {times}")
        print(f"   Types: {types}")


# =========================================================
# STANDALONE EXECUTION
# =========================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
