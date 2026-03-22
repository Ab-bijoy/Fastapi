from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from ..db import Base
from ..main import app  
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
import pytest
from ..models import Todos , User
from ..Routers.auth import get_current_user,bcrypt_context



SQLALCHEMY_DATABASE_URL = "sqlite:///./testdb.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL,
                        connect_args={"check_same_thread":False},
                        poolclass = StaticPool)

TestingSessionLocal = sessionmaker(autocommit=False,autoflush=False,bind=engine)

Base.metadata.create_all(bind=engine) 

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

client = TestClient(app)

def  override_get_current_user():
    return {'username':'AnindoBarua','id':3,'role':'admin'}




@pytest.fixture
def test_todo():
    todo = Todos(
        title = "Todo 1",
        description = "Description 1",
        priority = 1,
        completed = False,
        owner_id = 3
    )
    db = TestingSessionLocal()
    db.add(todo)
    db.commit()
    db.refresh(todo)
    yield todo
    with engine.connect() as connection:
        connection.execute(text("DELETE FROM todos;"))
        connection.commit()



@pytest.fixture
def test_user():
    user = User(
        id = 3,
        username = "AnindoBarua",
        email = "ab&gmail.com",
        first_name = "Anindo",
        last_name = "Barua",
        hashed_password = bcrypt_context.hash("testpassword"),
        role = "admin",
        phone_number = "1234567890"
    )
    db = TestingSessionLocal()
    db.add(user)
    db.commit()
    db.refresh(user)
    yield user
    with engine.connect() as connection:
        connection.execute(text("DELETE FROM users;"))
        connection.commit()
