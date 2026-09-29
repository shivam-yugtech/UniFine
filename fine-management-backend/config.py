import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "fine_management_secret_key")
    DEBUG = True
    DATABASE = os.getenv("DATABASE", os.path.join(os.path.dirname(__file__), "fine_management.db"))
