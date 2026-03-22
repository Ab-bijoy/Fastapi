import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Load .env file from the same directory as this file
load_dotenv(Path(__file__).parent / ".env")

# Read from .env or environment variable; falls back to local DB
SQLALCHEMY_DATABASE_URL = os.environ.get(
    'DATABASE_URL',
    'postgresql://postgres:bijoy142857@localhost/TodoApplicationDatabase'
)

engine = create_engine(SQLALCHEMY_DATABASE_URL)


SessionLocal = sessionmaker(autocommit=False,autoflush=False,bind=engine)

Base = declarative_base()
