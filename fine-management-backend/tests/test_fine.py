import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app import app
from models.auth import init_database


class FineAccessTests(unittest.TestCase):
    def setUp(self):
        self.database = tempfile.NamedTemporaryFile(suffix=".db", delete=False).name
        app.config.update(TESTING=True, DATABASE=self.database)
        init_database(self.database)
        self.client = app.test_client()

    def tearDown(self):
        os.unlink(self.database)

    def token(self, username, password):
        return self.client.post("/login", json={"username": username, "password": password}).get_json()["token"]

    def test_faculty_can_create_but_student_cannot(self):
        faculty = self.token("faculty", "faculty123")
        response = self.client.post("/fines", json={"student_id": 1, "offence_id": 1}, headers={"Authorization": f"Bearer {faculty}"})
        self.assertEqual(response.status_code, 201)
        student = self.token("student", "student123")
        response = self.client.post("/fines", json={"student_id": 1, "offence_id": 1}, headers={"Authorization": f"Bearer {student}"})
        self.assertEqual(response.status_code, 403)

    def test_only_admin_can_change_status(self):
        faculty = self.token("faculty", "faculty123")
        fine = self.client.post("/fines", json={"student_id": 1, "offence_id": 1}, headers={"Authorization": f"Bearer {faculty}"}).get_json()
        response = self.client.patch(f"/fines/{fine['id']}/status", json={"status": "PAID"}, headers={"Authorization": f"Bearer {faculty}"})
        self.assertEqual(response.status_code, 403)
