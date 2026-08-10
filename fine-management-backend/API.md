# University Fine Management API

Run the API locally with `python app.py`. It listens on `http://127.0.0.1:5000`.

## Authentication

`POST /login` accepts `{ "username": "admin", "password": "admin123" }` and returns a Bearer token. Send it on protected routes as `Authorization: Bearer <token>`.

`POST /logout` revokes the supplied Bearer token. The client should also remove that token from its local/session storage.

Demo accounts are `admin/admin123`, `faculty/faculty123`, and `student/student123`.

## Endpoints

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET, POST | `/students` | Admin, Faculty | List or add students |
| GET | `/students/<id>` | Admin, Faculty, own Student | Student profile |
| GET | `/students/verify/<roll_number>` | Admin, Faculty | Find student by roll number |
| GET, POST | `/offences` | Admin, Faculty | List or add offences |
| GET, POST | `/fines` | All for GET; Admin/Faculty for POST | List/create fines; Students see only their own |
| POST | `/fines/multiple` | Admin, Faculty | Issue multiple fines |
| PATCH | `/fines/<id>/status` | Admin | Set `UNPAID`, `PAID`, or `WAIVED` |
| GET | `/admin/dashboard` | Admin | Fine totals, pending/paid amounts, revenue |
| GET | `/student/dashboard` | Student | Personal fine totals and amounts |
| GET, POST | `/rules` | All GET; Admin POST | Rule book |
| PATCH, DELETE | `/rules/<id>` | Admin | Update/delete a rule |
| GET | `/faculty/fine-history` | Admin, Faculty | Issued fine history |

For admin faculty-history searches, use `?faculty_id=<id>` or `?search=<username>`. A faculty user is always restricted to their own issue history.

All errors use `{ "error": { "code": <status>, "message": "..." } }`.
