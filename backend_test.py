#!/usr/bin/env python3
"""
DragonFit Backend API Testing Suite
Tests all API endpoints for the gym workout tracking app
"""

import requests
import sys
import json
from datetime import datetime

class DragonFitAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.workout_id = None
        self.session_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        return success

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make API request with proper headers"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)

            success = response.status_code == expected_status
            return success, response.json() if response.content else {}, response.status_code
        except Exception as e:
            return False, {"error": str(e)}, 0

    def test_health_check(self):
        """Test health endpoint"""
        success, data, status = self.make_request('GET', 'health')
        return self.log_test("Health Check", success and data.get('status') == 'healthy')

    def test_user_registration(self):
        """Test user registration"""
        test_user = {
            "email": "test@dragonfit.com",
            "password": "Test123456",
            "name": "Test User"
        }
        
        success, data, status = self.make_request('POST', 'auth/register', test_user, 200)
        if success and 'token' in data and 'user' in data:
            self.token = data['token']
            self.user_id = data['user']['user_id']
            return self.log_test("User Registration", True)
        else:
            # User might already exist, try login instead
            return self.log_test("User Registration", False, f"Status: {status}, Response: {data}")

    def test_user_login(self):
        """Test user login"""
        login_data = {
            "email": "test@dragonfit.com",
            "password": "Test123456"
        }
        
        success, data, status = self.make_request('POST', 'auth/login', login_data, 200)
        if success and 'token' in data and 'user' in data:
            self.token = data['token']
            self.user_id = data['user']['user_id']
            return self.log_test("User Login", True)
        else:
            return self.log_test("User Login", False, f"Status: {status}, Response: {data}")

    def test_get_user_profile(self):
        """Test get current user profile"""
        success, data, status = self.make_request('GET', 'auth/me')
        return self.log_test("Get User Profile", success and 'user_id' in data)

    def test_create_workout(self):
        """Test creating a workout routine"""
        workout_data = {
            "name": "Test Rutina Push/Pull",
            "description": "Rutina de prueba para testing",
            "days": [
                {
                    "day_number": 1,
                    "name": "Push Day",
                    "exercises": [
                        {"name": "Press Banca", "sets": "4x8-10", "notes": "Calentar bien"},
                        {"name": "Press Militar", "sets": "3x10-12", "notes": ""}
                    ]
                },
                {
                    "day_number": 2,
                    "name": "Pull Day", 
                    "exercises": [
                        {"name": "Dominadas", "sets": "4x6-8", "notes": "Usar banda si es necesario"},
                        {"name": "Remo con Barra", "sets": "3x10-12", "notes": ""}
                    ]
                }
            ]
        }
        
        success, data, status = self.make_request('POST', 'workouts', workout_data, 200)
        if success and 'workout_id' in data:
            self.workout_id = data['workout_id']
            return self.log_test("Create Workout", True)
        else:
            return self.log_test("Create Workout", False, f"Status: {status}, Response: {data}")

    def test_get_workouts(self):
        """Test getting user's workouts"""
        success, data, status = self.make_request('GET', 'workouts')
        return self.log_test("Get Workouts", success and isinstance(data, list))

    def test_get_workout_detail(self):
        """Test getting specific workout details"""
        if not self.workout_id:
            return self.log_test("Get Workout Detail", False, "No workout_id available")
        
        success, data, status = self.make_request('GET', f'workouts/{self.workout_id}')
        return self.log_test("Get Workout Detail", success and data.get('workout_id') == self.workout_id)

    def test_update_workout(self):
        """Test updating a workout"""
        if not self.workout_id:
            return self.log_test("Update Workout", False, "No workout_id available")
        
        update_data = {
            "name": "Test Rutina Push/Pull - Actualizada",
            "description": "Rutina actualizada para testing"
        }
        
        success, data, status = self.make_request('PUT', f'workouts/{self.workout_id}', update_data)
        return self.log_test("Update Workout", success and data.get('name') == update_data['name'])

    def test_create_training_session(self):
        """Test creating a training session"""
        if not self.workout_id:
            return self.log_test("Create Training Session", False, "No workout_id available")
        
        session_data = {
            "workout_id": self.workout_id,
            "day_index": 0,  # First day (Push Day)
            "date": datetime.now().strftime("%Y-%m-%d"),
            "exercises": [
                {
                    "exercise_index": 0,
                    "weight": "80kg",
                    "reps": "10,10,8,8",
                    "notes": "Buen entrenamiento"
                },
                {
                    "exercise_index": 1,
                    "weight": "50kg", 
                    "reps": "12,10,10",
                    "notes": ""
                }
            ]
        }
        
        success, data, status = self.make_request('POST', 'sessions', session_data, 200)
        if success and 'session_id' in data:
            self.session_id = data['session_id']
            return self.log_test("Create Training Session", True)
        else:
            return self.log_test("Create Training Session", False, f"Status: {status}, Response: {data}")

    def test_get_sessions(self):
        """Test getting training sessions"""
        success, data, status = self.make_request('GET', 'sessions')
        return self.log_test("Get Sessions", success and isinstance(data, list))

    def test_get_session_detail(self):
        """Test getting specific session details"""
        if not self.session_id:
            return self.log_test("Get Session Detail", False, "No session_id available")
        
        success, data, status = self.make_request('GET', f'sessions/{self.session_id}')
        return self.log_test("Get Session Detail", success and data.get('session_id') == self.session_id)

    def test_get_progress(self):
        """Test getting progress data"""
        success, data, status = self.make_request('GET', 'progress')
        return self.log_test("Get Progress", success and isinstance(data, dict))

    def test_get_stats(self):
        """Test getting user statistics"""
        success, data, status = self.make_request('GET', 'stats')
        expected_keys = ['total_workouts', 'total_sessions', 'sessions_this_week', 'total_volume']
        return self.log_test("Get Stats", success and all(key in data for key in expected_keys))

    def test_export_excel(self):
        """Test Excel export"""
        if not self.workout_id:
            return self.log_test("Export Excel", False, "No workout_id available")
        
        url = f"{self.base_url}/api/export/excel/{self.workout_id}"
        headers = {'Authorization': f'Bearer {self.token}'} if self.token else {}
        
        try:
            response = self.session.get(url, headers=headers)
            success = response.status_code == 200 and 'application/vnd.openxmlformats' in response.headers.get('content-type', '')
            return self.log_test("Export Excel", success)
        except Exception as e:
            return self.log_test("Export Excel", False, str(e))

    def test_export_pdf(self):
        """Test PDF export"""
        if not self.workout_id:
            return self.log_test("Export PDF", False, "No workout_id available")
        
        url = f"{self.base_url}/api/export/pdf/{self.workout_id}"
        headers = {'Authorization': f'Bearer {self.token}'} if self.token else {}
        
        try:
            response = self.session.get(url, headers=headers)
            success = response.status_code == 200 and 'application/pdf' in response.headers.get('content-type', '')
            return self.log_test("Export PDF", success)
        except Exception as e:
            return self.log_test("Export PDF", False, str(e))

    def test_logout(self):
        """Test user logout"""
        success, data, status = self.make_request('POST', 'auth/logout')
        return self.log_test("User Logout", success)

    def cleanup_test_data(self):
        """Clean up test data"""
        if self.session_id:
            self.make_request('DELETE', f'sessions/{self.session_id}')
        if self.workout_id:
            self.make_request('DELETE', f'workouts/{self.workout_id}')

    def run_all_tests(self):
        """Run complete test suite"""
        print("🐉 DragonFit API Testing Suite")
        print("=" * 50)
        
        # Health check
        self.test_health_check()
        
        # Authentication tests
        if not self.test_user_registration():
            # If registration fails, try login
            if not self.test_user_login():
                print("❌ Cannot authenticate - stopping tests")
                return False
        
        self.test_get_user_profile()
        
        # Workout management tests
        self.test_create_workout()
        self.test_get_workouts()
        self.test_get_workout_detail()
        self.test_update_workout()
        
        # Training session tests
        self.test_create_training_session()
        self.test_get_sessions()
        self.test_get_session_detail()
        
        # Analytics tests
        self.test_get_progress()
        self.test_get_stats()
        
        # Export tests
        self.test_export_excel()
        self.test_export_pdf()
        
        # Logout test
        self.test_logout()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Results
        print("\n" + "=" * 50)
        print(f"📊 Tests Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = DragonFitAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())