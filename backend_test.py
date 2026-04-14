import requests
import sys
import os
from datetime import datetime
from pathlib import Path

class SoundForgeAPITester:
    def __init__(self, base_url="https://song-restructure.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.uploaded_track_id = None
        self.project_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {}
        if data and not files:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {str(response_data)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_list_tracks(self):
        """Test listing tracks"""
        success, response = self.run_test(
            "List Tracks",
            "GET", 
            "tracks",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} tracks")
            if len(response) > 0:
                # Store existing track ID for later tests
                self.uploaded_track_id = response[0]['id']
                print(f"   Using existing track ID: {self.uploaded_track_id}")
        return success

    def test_upload_track(self):
        """Test uploading a track"""
        # Check if test file exists
        test_file_path = Path("/app/backend/test_song.mp3")
        if not test_file_path.exists():
            print("❌ Test file not found at /app/backend/test_song.mp3")
            return False

        with open(test_file_path, 'rb') as f:
            files = {'file': ('test_song.mp3', f, 'audio/mpeg')}
            success, response = self.run_test(
                "Upload Track",
                "POST",
                "tracks/upload",
                200,
                files=files
            )
            
        if success and 'id' in response:
            self.uploaded_track_id = response['id']
            print(f"   Uploaded track ID: {self.uploaded_track_id}")
        return success

    def test_get_track(self):
        """Test getting a specific track"""
        if not self.uploaded_track_id:
            print("❌ No track ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get Track",
            "GET",
            f"tracks/{self.uploaded_track_id}",
            200
        )
        return success

    def test_analyze_track(self):
        """Test analyzing track structure"""
        if not self.uploaded_track_id:
            print("❌ No track ID available for testing")
            return False
            
        success, response = self.run_test(
            "Analyze Track",
            "POST",
            f"tracks/{self.uploaded_track_id}/analyze",
            200
        )
        
        if success and 'sections' in response:
            print(f"   Found {len(response['sections'])} sections")
            for section in response['sections'][:3]:  # Show first 3 sections
                print(f"   - {section['label']}: {section['start_time']:.1f}s - {section['end_time']:.1f}s")
        return success

    def test_restructure_audio(self):
        """Test restructuring audio"""
        if not self.uploaded_track_id:
            print("❌ No track ID available for testing")
            return False

        # First get track to get sections
        track_response = requests.get(f"{self.base_url}/tracks/{self.uploaded_track_id}")
        if track_response.status_code != 200:
            print("❌ Could not get track for restructure test")
            return False
            
        track_data = track_response.json()
        if not track_data.get('sections'):
            print("❌ Track has no sections for restructure test")
            return False

        # Use first few sections for restructure
        sections = track_data['sections'][:3]
        restructure_data = {
            "track_id": self.uploaded_track_id,
            "sections": [{"start_time": s["start_time"], "end_time": s["end_time"]} for s in sections],
            "name": "Test Restructure"
        }
        
        success, response = self.run_test(
            "Restructure Audio",
            "POST",
            "restructure",
            200,
            data=restructure_data
        )
        
        if success and 'id' in response:
            self.project_id = response['id']
            print(f"   Created project ID: {self.project_id}")
        return success

    def test_list_projects(self):
        """Test listing projects"""
        success, response = self.run_test(
            "List Projects",
            "GET",
            "projects",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} projects")
        return success

    def test_get_project(self):
        """Test getting a specific project"""
        if not self.project_id:
            print("❌ No project ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get Project",
            "GET",
            f"projects/{self.project_id}",
            200
        )
        return success

    def test_export_audio(self):
        """Test exporting audio"""
        if not self.uploaded_track_id:
            print("❌ No track ID available for testing")
            return False
            
        export_data = {
            "track_id": self.uploaded_track_id,
            "format": "mp3"
        }
        
        success, response = self.run_test(
            "Export Audio",
            "POST",
            "export",
            200,
            data=export_data
        )
        
        if success and 'filename' in response:
            print(f"   Export filename: {response['filename']}")
        return success

    def test_serve_audio(self):
        """Test serving audio files"""
        if not self.uploaded_track_id:
            print("❌ No track ID available for testing")
            return False

        # First get track to get filename
        track_response = requests.get(f"{self.base_url}/tracks/{self.uploaded_track_id}")
        if track_response.status_code != 200:
            print("❌ Could not get track for audio serve test")
            return False
            
        track_data = track_response.json()
        filename = track_data.get('filename')
        if not filename:
            print("❌ No filename found for audio serve test")
            return False

        # Test serving the audio file
        url = f"{self.base_url}/audio/{filename}"
        print(f"\n🔍 Testing Serve Audio File...")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url, stream=True)  # Use GET with streaming
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                print(f"   Content-Type: {response.headers.get('content-type', 'unknown')}")
            else:
                print(f"❌ Failed - Status: {response.status_code}")
            self.tests_run += 1
            return success
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.tests_run += 1
            return False

    def test_delete_track(self):
        """Test deleting a track (run last)"""
        if not self.uploaded_track_id:
            print("❌ No track ID available for testing")
            return False
            
        success, response = self.run_test(
            "Delete Track",
            "DELETE",
            f"tracks/{self.uploaded_track_id}",
            200
        )
        return success

def main():
    print("🎵 SoundForge API Testing Suite")
    print("=" * 50)
    
    tester = SoundForgeAPITester()
    
    # Run all tests in order
    tests = [
        tester.test_root_endpoint,
        tester.test_list_tracks,
        tester.test_upload_track,
        tester.test_get_track,
        tester.test_analyze_track,
        tester.test_restructure_audio,
        tester.test_list_projects,
        tester.test_get_project,
        tester.test_export_audio,
        tester.test_serve_audio,
        # tester.test_delete_track,  # Commented out to preserve test data
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            tester.tests_run += 1
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())