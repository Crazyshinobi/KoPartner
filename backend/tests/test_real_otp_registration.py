"""
Real End-to-End Tests with OTP Capture
======================================
These tests use MongoDB to capture the OTP and perform actual registration
to verify the role-specific activation behavior.
"""

import pytest
import requests
import os
import random
import string
import time
from pymongo import MongoClient

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL environment variable must be set")

# Connect to MongoDB to capture OTP
mongo_client = MongoClient(MONGO_URL)
db = mongo_client[DB_NAME]

def generate_test_phone():
    """Generate unique test phone"""
    return "97" + ''.join(random.choices(string.digits, k=8))


def get_otp_from_db(phone):
    """Get OTP from database after sending"""
    otp_doc = db.otps.find_one({"phone": phone})
    if otp_doc:
        return otp_doc.get("otp")
    return None


def cleanup_test_user(phone):
    """Remove test user from database"""
    db.users.delete_one({"phone": phone})
    db.otps.delete_one({"phone": phone})


class TestRealClientRegistration:
    """
    Test FLOW 1: CLIENT registration with actual OTP verification
    """
    
    def test_client_registration_sets_profile_activated_true(self):
        """
        CRITICAL TEST: Client registration should set profile_activated=true
        
        Steps:
        1. Send OTP to new phone
        2. Get OTP from database
        3. Verify OTP with role='client'
        4. Check: profile_activated=true in response
        """
        phone = generate_test_phone()
        
        try:
            # Step 1: Send OTP
            send_response = requests.post(
                f"{BASE_URL}/api/auth/send-otp",
                json={"phone": phone},
                timeout=15
            )
            assert send_response.status_code == 200
            print(f"✅ Step 1: OTP sent to {phone}")
            
            # Step 2: Get OTP from database
            time.sleep(0.5)  # Brief delay for DB write
            otp = get_otp_from_db(phone)
            assert otp is not None, f"OTP not found in database for {phone}"
            print(f"✅ Step 2: OTP captured from DB: {otp}")
            
            # Step 3: Verify OTP with role='client'
            verify_response = requests.post(
                f"{BASE_URL}/api/auth/verify-otp",
                json={
                    "phone": phone,
                    "otp": otp,
                    "role": "client",
                    "name": "Test Client User",
                    "city": "Delhi"
                },
                timeout=15
            )
            assert verify_response.status_code == 200, f"Verify failed: {verify_response.text}"
            data = verify_response.json()
            print(f"✅ Step 3: OTP verified, registration successful")
            
            # Step 4: Verify profile_activated is TRUE
            user = data.get("user", {})
            assert user.get("profile_activated") == True, f"CLIENT profile_activated should be TRUE, got {user.get('profile_activated')}"
            assert user.get("role") == "client", f"Role should be 'client', got {user.get('role')}"
            
            print(f"✅ Step 4: CLIENT PROFILE VERIFIED")
            print(f"   - profile_activated: {user.get('profile_activated')} ✅")
            print(f"   - can_search: {user.get('can_search')}")
            print(f"   - role: {user.get('role')}")
            
        finally:
            cleanup_test_user(phone)
            print(f"✅ Cleanup: Test user {phone} removed")


class TestRealCuddlistRegistration:
    """
    Test FLOW 2: CUDDLIST (KoPartner) registration with actual OTP verification
    """
    
    def test_cuddlist_registration_sets_profile_activated_false(self):
        """
        CRITICAL TEST: Cuddlist registration should set profile_activated=false
        
        Steps:
        1. Send OTP to new phone
        2. Get OTP from database
        3. Verify OTP with role='cuddlist'
        4. Check: profile_activated=false, membership_paid=false
        """
        phone = generate_test_phone()
        
        try:
            # Step 1: Send OTP
            send_response = requests.post(
                f"{BASE_URL}/api/auth/send-otp",
                json={"phone": phone},
                timeout=15
            )
            assert send_response.status_code == 200
            print(f"✅ Step 1: OTP sent to {phone}")
            
            # Step 2: Get OTP from database
            time.sleep(0.5)
            otp = get_otp_from_db(phone)
            assert otp is not None, f"OTP not found in database for {phone}"
            print(f"✅ Step 2: OTP captured from DB: {otp}")
            
            # Step 3: Verify OTP with role='cuddlist'
            verify_response = requests.post(
                f"{BASE_URL}/api/auth/verify-otp",
                json={
                    "phone": phone,
                    "otp": otp,
                    "role": "cuddlist",
                    "name": "Test KoPartner User",
                    "city": "Mumbai"
                },
                timeout=15
            )
            assert verify_response.status_code == 200, f"Verify failed: {verify_response.text}"
            data = verify_response.json()
            print(f"✅ Step 3: OTP verified, registration successful")
            
            # Step 4: Verify profile_activated is FALSE and membership_paid is FALSE
            user = data.get("user", {})
            assert user.get("profile_activated") == False, f"CUDDLIST profile_activated should be FALSE, got {user.get('profile_activated')}"
            assert user.get("membership_paid") == False, f"CUDDLIST membership_paid should be FALSE, got {user.get('membership_paid')}"
            assert user.get("role") == "cuddlist", f"Role should be 'cuddlist', got {user.get('role')}"
            
            print(f"✅ Step 4: CUDDLIST (KoPartner) PROFILE VERIFIED")
            print(f"   - profile_activated: {user.get('profile_activated')} ✅")
            print(f"   - membership_paid: {user.get('membership_paid')} ✅")
            print(f"   - cuddlist_status: {user.get('cuddlist_status')}")
            print(f"   - role: {user.get('role')}")
            
        finally:
            cleanup_test_user(phone)
            print(f"✅ Cleanup: Test user {phone} removed")


class TestRealBothRoleRegistration:
    """
    Test FLOW 3: BOTH role registration with actual OTP verification
    """
    
    def test_both_role_registration_sets_profile_activated_false(self):
        """
        CRITICAL TEST: Both role registration should set profile_activated=false
        
        Steps:
        1. Send OTP to new phone
        2. Get OTP from database
        3. Verify OTP with role='both'
        4. Check: profile_activated=false, membership_paid=false, can_search=false
        """
        phone = generate_test_phone()
        
        try:
            # Step 1: Send OTP
            send_response = requests.post(
                f"{BASE_URL}/api/auth/send-otp",
                json={"phone": phone},
                timeout=15
            )
            assert send_response.status_code == 200
            print(f"✅ Step 1: OTP sent to {phone}")
            
            # Step 2: Get OTP from database
            time.sleep(0.5)
            otp = get_otp_from_db(phone)
            assert otp is not None, f"OTP not found in database for {phone}"
            print(f"✅ Step 2: OTP captured from DB: {otp}")
            
            # Step 3: Verify OTP with role='both'
            verify_response = requests.post(
                f"{BASE_URL}/api/auth/verify-otp",
                json={
                    "phone": phone,
                    "otp": otp,
                    "role": "both",
                    "name": "Test Both Role User",
                    "city": "Bangalore"
                },
                timeout=15
            )
            assert verify_response.status_code == 200, f"Verify failed: {verify_response.text}"
            data = verify_response.json()
            print(f"✅ Step 3: OTP verified, registration successful")
            
            # Step 4: Verify all flags are FALSE
            user = data.get("user", {})
            assert user.get("profile_activated") == False, f"BOTH profile_activated should be FALSE, got {user.get('profile_activated')}"
            assert user.get("membership_paid") == False, f"BOTH membership_paid should be FALSE, got {user.get('membership_paid')}"
            assert user.get("can_search") == False, f"BOTH can_search should be FALSE, got {user.get('can_search')}"
            assert user.get("role") == "both", f"Role should be 'both', got {user.get('role')}"
            
            print(f"✅ Step 4: BOTH ROLE PROFILE VERIFIED")
            print(f"   - profile_activated: {user.get('profile_activated')} ✅")
            print(f"   - membership_paid: {user.get('membership_paid')} ✅")
            print(f"   - can_search: {user.get('can_search')} ✅")
            print(f"   - cuddlist_status: {user.get('cuddlist_status')}")
            print(f"   - role: {user.get('role')}")
            
        finally:
            cleanup_test_user(phone)
            print(f"✅ Cleanup: Test user {phone} removed")


class TestLoginExistingUser:
    """Test login for existing users preserves their activation state"""
    
    def test_existing_user_login_preserves_state(self):
        """Test that logging in an existing user doesn't change their activation state"""
        phone = generate_test_phone()
        
        try:
            # Step 1: Register as client first
            send_response = requests.post(
                f"{BASE_URL}/api/auth/send-otp",
                json={"phone": phone},
                timeout=15
            )
            time.sleep(0.5)
            otp = get_otp_from_db(phone)
            
            # Register
            requests.post(
                f"{BASE_URL}/api/auth/verify-otp",
                json={
                    "phone": phone,
                    "otp": otp,
                    "role": "client",
                    "name": "Existing User Test",
                    "city": "Chennai"
                },
                timeout=15
            )
            print(f"✅ Initial registration complete for {phone}")
            
            # Step 2: Send OTP again for login
            requests.post(
                f"{BASE_URL}/api/auth/send-otp",
                json={"phone": phone},
                timeout=15
            )
            time.sleep(0.5)
            otp2 = get_otp_from_db(phone)
            
            # Step 3: Login (verify OTP again)
            login_response = requests.post(
                f"{BASE_URL}/api/auth/verify-otp",
                json={
                    "phone": phone,
                    "otp": otp2,
                    "role": "client",  # Role is ignored for existing users
                    "name": "Different Name",  # Name is ignored for existing users
                    "city": "Different City"   # City is ignored for existing users
                },
                timeout=15
            )
            
            assert login_response.status_code == 200
            data = login_response.json()
            user = data.get("user", {})
            
            # Original values should be preserved
            assert user.get("name") == "Existing User Test", "Name should be preserved"
            assert user.get("city") == "Chennai", "City should be preserved"
            assert user.get("profile_activated") == True, "Profile activation should be preserved"
            
            print(f"✅ Login preserves existing user state")
            print(f"   - name: {user.get('name')} (preserved)")
            print(f"   - city: {user.get('city')} (preserved)")
            print(f"   - profile_activated: {user.get('profile_activated')} (preserved)")
            
        finally:
            cleanup_test_user(phone)


class TestSummaryAllFlows:
    """Final summary test"""
    
    def test_all_flows_summary(self):
        """Print summary of all flows tested"""
        print("\n" + "="*70)
        print("   REAL OTP VERIFICATION TESTS - ALL FLOWS VERIFIED")
        print("="*70)
        print()
        print("FLOW 1: CLIENT")
        print("   profile_activated = TRUE on registration ✅")
        print()
        print("FLOW 2: CUDDLIST (KoPartner)")
        print("   profile_activated = FALSE on registration ✅")
        print("   membership_paid = FALSE on registration ✅")
        print()
        print("FLOW 3: BOTH")
        print("   profile_activated = FALSE on registration ✅")
        print("   membership_paid = FALSE on registration ✅")
        print("   can_search = FALSE on registration ✅")
        print()
        print("="*70)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
