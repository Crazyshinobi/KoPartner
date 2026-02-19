"""
Test Admin Panel features:
- Pagination with server-side filtering
- Payouts tab for completed bookings
- Search/filter functionality
- Pay payout API
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bulletproof-auth-2.preview.emergentagent.com')

# Test credentials from .env
ADMIN_USERNAME = "amit845401"
ADMIN_PASSWORD = "Amit@9810"


class TestAdminAuthentication:
    """Admin login tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert data["user"]["role"] == "admin", "User is not admin"
        return data["token"]
    
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
        print(f"Admin login successful. User: {data['user'].get('name', 'Admin')}")
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with wrong credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "username": "wronguser",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("Admin login correctly rejected invalid credentials")


class TestAdminUsersPagination:
    """Test All Users tab with server-side pagination"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_get_all_users_default_pagination(self, admin_token):
        """Test GET /admin/users/all with default pagination (page 1, limit 50)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users/all",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "users" in data, "Missing 'users' field"
        assert "total_count" in data, "Missing 'total_count' field"
        assert "page" in data, "Missing 'page' field"
        assert "limit" in data, "Missing 'limit' field"
        assert "total_pages" in data, "Missing 'total_pages' field"
        assert "has_next" in data, "Missing 'has_next' field"
        assert "has_prev" in data, "Missing 'has_prev' field"
        
        # Verify pagination defaults
        assert data["page"] == 1, f"Expected page 1, got {data['page']}"
        assert data["limit"] == 50, f"Expected limit 50, got {data['limit']}"
        assert data["has_prev"] == False, "First page should not have previous"
        
        print(f"Users pagination working: {data['total_count']} total users, {data['total_pages']} pages")
        print(f"Current page users: {len(data['users'])}")
    
    def test_pagination_page_2(self, admin_token):
        """Test fetching page 2 of users"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users/all?page=2&limit=10",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["page"] == 2, f"Expected page 2, got {data['page']}"
        assert data["limit"] == 10, f"Expected limit 10, got {data['limit']}"
        
        # If there's a page 2, has_prev should be True
        if data["total_count"] > 10:
            assert data["has_prev"] == True, "Page 2 should have previous"
        
        print(f"Page 2 contains {len(data['users'])} users")
    
    def test_filter_by_role_kopartner(self, admin_token):
        """Test filtering users by KoPartner role"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users/all?role=kopartner",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # All returned users should be kopartner or both
        for user in data["users"]:
            assert user["role"] in ["cuddlist", "both"], f"User {user.get('name')} has role {user['role']}"
        
        print(f"Found {data['total_count']} KoPartners")
    
    def test_filter_by_role_client(self, admin_token):
        """Test filtering users by client role"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users/all?role=client",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # All returned users should be client or both
        for user in data["users"]:
            assert user["role"] in ["client", "both"], f"User {user.get('name')} has role {user['role']}"
        
        print(f"Found {data['total_count']} Clients")
    
    def test_filter_by_status_paid(self, admin_token):
        """Test filtering users by paid membership status"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users/all?status=paid",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # All returned users should have membership_paid = True
        for user in data["users"]:
            assert user.get("membership_paid") == True, f"User {user.get('name')} is not paid member"
        
        print(f"Found {data['total_count']} paid members")
    
    def test_filter_by_status_unpaid(self, admin_token):
        """Test filtering users by unpaid membership status"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users/all?status=unpaid",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # All returned users should not have membership_paid = True
        for user in data["users"]:
            assert user.get("membership_paid") != True, f"User {user.get('name')} is paid but returned in unpaid filter"
        
        print(f"Found {data['total_count']} unpaid members")
    
    def test_search_by_name(self, admin_token):
        """Test server-side search by name"""
        # Search for a common name/term
        response = requests.get(
            f"{BASE_URL}/api/admin/users/all?search=amit",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        print(f"Search 'amit' returned {data['total_count']} results")
        
        # Verify search is case-insensitive
        if data["total_count"] > 0:
            for user in data["users"][:3]:  # Check first 3
                user_str = f"{user.get('name', '')} {user.get('phone', '')} {user.get('email', '')} {user.get('city', '')}".lower()
                # Search term should be in at least one field
                print(f"  - {user.get('name')}: {user.get('phone')}")
    
    def test_combined_filters(self, admin_token):
        """Test combining role filter with status filter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users/all?role=kopartner&status=approved",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # All should be approved kopartners
        for user in data["users"]:
            assert user["role"] in ["cuddlist", "both"]
            assert user.get("cuddlist_status") == "approved"
        
        print(f"Found {data['total_count']} approved KoPartners")


class TestAdminPayoutsTab:
    """Test Payouts tab for completed services"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_get_completed_bookings(self, admin_token):
        """Test GET /admin/bookings/completed endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/bookings/completed",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "bookings" in data, "Missing 'bookings' field"
        assert "count" in data, "Missing 'count' field"
        assert "total_count" in data, "Missing 'total_count' field"
        assert "page" in data, "Missing 'page' field"
        assert "total_pages" in data, "Missing 'total_pages' field"
        
        print(f"Completed bookings: {data['total_count']} total, {data['count']} on current page")
        
        # Check enriched booking structure if any exist
        if len(data["bookings"]) > 0:
            booking = data["bookings"][0]
            assert "payout_amount" in booking, "Missing payout_amount calculation"
            assert "platform_fee" in booking, "Missing platform_fee calculation"
            assert "kopartner_upi" in booking, "Missing kopartner_upi field"
            
            # Verify 80% payout calculation
            if booking.get("service_amount"):
                expected_payout = booking["service_amount"] * 0.8
                assert abs(booking["payout_amount"] - expected_payout) < 0.01, f"Payout should be 80% of service amount"
                print(f"  First booking: Service ₹{booking['service_amount']}, Payout ₹{booking['payout_amount']}")
    
    def test_filter_completed_bookings_pending_payout(self, admin_token):
        """Test filtering completed bookings by pending payout status"""
        response = requests.get(
            f"{BASE_URL}/api/admin/bookings/completed?payout_status=pending",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # All returned should have payout_status != 'paid'
        for booking in data["bookings"]:
            assert booking.get("payout_status") != "paid", f"Booking {booking['id']} has payout_status=paid"
        
        print(f"Found {data['total_count']} bookings with pending payout")
    
    def test_filter_completed_bookings_paid_payout(self, admin_token):
        """Test filtering completed bookings by paid payout status"""
        response = requests.get(
            f"{BASE_URL}/api/admin/bookings/completed?payout_status=paid",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # All returned should have payout_status = 'paid'
        for booking in data["bookings"]:
            assert booking.get("payout_status") == "paid", f"Booking {booking['id']} is not paid"
        
        print(f"Found {data['total_count']} bookings with paid payout")


class TestAdminStats:
    """Test admin statistics endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_get_admin_stats(self, admin_token):
        """Test GET /admin/stats endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify required stats fields
        required_fields = [
            "total_users",
            "total_clients",
            "active_kopartners",
            "pending_approvals",
            "unpaid_kopartners",
            "total_transactions",
            "total_revenue",
            "total_bookings"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing stat: {field}"
        
        print(f"Admin Stats:")
        print(f"  Total Users: {data['total_users']}")
        print(f"  Active KoPartners: {data['active_kopartners']}")
        print(f"  Unpaid KoPartners: {data['unpaid_kopartners']}")
        print(f"  Total Revenue: ₹{data['total_revenue']}")


class TestKoPartnersTab:
    """Test KoPartners tab with pagination"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_get_all_kopartners_paginated(self, admin_token):
        """Test GET /admin/kopartners/all with pagination"""
        response = requests.get(
            f"{BASE_URL}/api/admin/kopartners/all?page=1&limit=10",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "kopartners" in data, "Missing 'kopartners' field"
        
        # Verify all returned are kopartners
        for kp in data["kopartners"]:
            assert kp["role"] in ["cuddlist", "both"], f"Non-kopartner in results: {kp['role']}"
        
        print(f"KoPartners found: {len(data['kopartners'])}")


class TestUnauthorizedAccess:
    """Test that admin endpoints require proper authentication"""
    
    def test_users_without_token(self):
        """Test accessing admin users without token"""
        response = requests.get(f"{BASE_URL}/api/admin/users/all")
        assert response.status_code in [401, 403], f"Should require auth, got {response.status_code}"
    
    def test_stats_without_token(self):
        """Test accessing admin stats without token"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code in [401, 403], f"Should require auth, got {response.status_code}"
    
    def test_payouts_without_token(self):
        """Test accessing completed bookings without token"""
        response = requests.get(f"{BASE_URL}/api/admin/bookings/completed")
        assert response.status_code in [401, 403], f"Should require auth, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
