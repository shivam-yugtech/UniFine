import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app import app
from models.auth import init_database


class StudentAccessTests(unittest.TestCase):
    def setUp(self):
        self.database = tempfile.NamedTemporaryFile(suffix=".db", delete=False).name
        app.config.update(TESTING=True, DATABASE=self.database)
        init_database(self.database)
        self.client = app.test_client()

    def tearDown(self):
        os.unlink(self.database)

    def token(self, username, password):
        response = self.client.post("/login", json={"username": username, "password": password})
        return response.get_json()["token"]

    def test_student_can_only_read_own_profile(self):
        token = self.token("student", "student123")
        response = self.client.get("/students/1", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(response.status_code, 200)
        response = self.client.get("/students", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(response.status_code, 403)
