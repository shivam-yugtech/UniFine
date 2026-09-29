import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app import app
from models.auth import get_connection, init_database


class NewModuleTests(unittest.TestCase):
    def setUp(self):
        self.database = tempfile.NamedTemporaryFile(suffix=".db", delete=False).name
        app.config.update(TESTING=True, DATABASE=self.database)
        init_database(self.database)
        self.client = app.test_client()

    def tearDown(self):
        os.unlink(self.database)

    def token(self, username, password):
        return self.client.post("/login", json={"username": username, "password": password}).get_json()["token"]

    def headers(self, username, password):
        return {"Authorization": f"Bearer {self.token(username, password)}"}

    def test_admin_and_student_dashboards(self):
        faculty_headers = self.headers("faculty", "faculty123")
        self.client.post("/fines", json={"student_id": 1, "offence_id": 1}, headers=faculty_headers)
        admin_headers = self.headers("admin", "admin123")
        dashboard = self.client.get("/admin/dashboard", headers=admin_headers).get_json()
        self.assertEqual(dashboard["total_fines"], 1)
        self.assertEqual(dashboard["pending_fines"], 100.0)
        student_dashboard = self.client.get("/student/dashboard", headers=self.headers("student", "student123")).get_json()
        self.assertEqual(student_dashboard["my_fines"], 1)
        self.assertEqual(student_dashboard["pending_amount"], 100.0)

    def test_only_admin_can_change_rule_book(self):
        admin_headers = self.headers("admin", "admin123")
        created = self.client.post("/rules", json={"title": "ID card", "description": "Carry an ID card.", "penalty_amount": 50}, headers=admin_headers)
        self.assertEqual(created.status_code, 201)
        student_headers = self.headers("student", "student123")
        self.assertEqual(self.client.get("/rules", headers=student_headers).status_code, 200)
        self.assertEqual(self.client.post("/rules", json={"title": "Invalid", "description": "No."}, headers=student_headers).status_code, 403)

    def test_faculty_history_is_scoped_to_requesting_faculty(self):
        faculty_headers = self.headers("faculty", "faculty123")
        self.client.post("/fines", json={"student_id": 1, "offence_id": 1}, headers=faculty_headers)
        response = self.client.get("/faculty/fine-history?faculty_id=999", headers=faculty_headers)
        self.assertEqual(len(response.get_json()), 1)

    def test_passwords_are_hashed_and_logout_revokes_token(self):
        connection = get_connection(self.database)
        stored_password = connection.execute("SELECT password FROM users WHERE username = 'admin'").fetchone()["password"]
        connection.close()
        self.assertNotEqual(stored_password, "admin123")
        token = self.token("admin", "admin123")
        headers = {"Authorization": f"Bearer {token}"}
        self.assertEqual(self.client.post("/logout", headers=headers).status_code, 200)
        self.assertEqual(self.client.get("/admin/dashboard", headers=headers).status_code, 401)

    def test_unknown_route_returns_standard_error_json(self):
        response = self.client.get("/does-not-exist")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json()["error"]["code"], 404)

    def test_frontend_is_served_locally(self):
        response = self.client.get("/ui")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"FineFlow", response.data)


if __name__ == "__main__":
    unittest.main()
