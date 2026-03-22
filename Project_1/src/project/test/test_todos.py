
from ..Routers.todos import get_db , get_current_user
from fastapi import status
from .utils import *


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user


    

def test_read_all_authenticated(test_todo): # <-- Notice the argument here!
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK
    
    # We include 'id': 1 because the database will auto-assign it
    assert response.json() == [{
        "id": 1, 
        "title": "Todo 1", 
        "description": "Description 1", 
        "priority": 1, 
        "completed": False, 
        "owner_id": 3
    }]

def test_read_all_one_authenticated(test_todo): # <-- Notice the argument here!
    response = client.get("/todo/1")
    assert response.status_code == status.HTTP_201_CREATED
     
    # We include 'id': 1 because the database will auto-assign it
    assert response.json() == {
        "id": 1, 
        "title": "Todo 1", 
        "description": "Description 1", 
        "priority": 1, 
        "completed": False, 
        "owner_id": 3
    }

def test_read_all_one_authenticated_not_found(test_todo): # <-- Notice the argument here!
    response = client.get("/todo/999")
    assert response.status_code == status.HTTP_404_NOT_FOUND
     
    # We include 'id': 1 because the database will auto-assign it
    assert response.json() == {
        "detail": "Todo not found"
    }

def test_create_todo(test_todo): # <-- Notice the argument here!
    request_data = {
        "title": "Todo 2",
        "description": "Description 2",
        "priority": 2,
        "completed": False
    }

    response = client.post("/todo", json=request_data)
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json() == {
        "id": 2,
        "title": "Todo 2",
        "description": "Description 2",
        "priority": 2,
        "completed": False,
        "owner_id": 3
    }

    db = TestingSessionLocal()
    
    model = db.query(Todos).filter(Todos.id == 2).first()
    assert model.title == request_data.get("title")
    assert model.description == request_data.get("description")
    assert model.priority == request_data.get("priority")
    assert model.completed == request_data.get("completed")
    assert model.owner_id == 3


def test_update_todo(test_todo):
    request_data = {
        "title": "Todo 1",
        "description": "Description 1",
        "priority": 1,
        "completed": True
    }
    response = client.put("/todo/1", json=request_data)
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        "id": 1,
        "title": "Todo 1",
        "description": "Description 1",
        "priority": 1,
        "completed": True,
        "owner_id": 3
    }
    db = TestingSessionLocal()
    model = db.query(Todos).filter(Todos.id == 1).first()
    assert model.title == request_data.get("title")
    assert model.description == request_data.get("description")
    assert model.priority == request_data.get("priority")
    assert model.completed == request_data.get("completed")
    assert model.owner_id == 3

def test_update_todo_not_found(test_todo):
    request_data = {
        "title": "Todo 1",
        "description": "Description 1",
        "priority": 1,
        "completed": True
    }
    response = client.put("/todo/999", json=request_data)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {
        "detail": "Todo not found"
    }

def test_delete_todo(test_todo):
    response = client.delete("/todo/1")
    assert response.status_code == status.HTTP_204_NO_CONTENT
    db = TestingSessionLocal()
    model = db.query(Todos).filter(Todos.id == 1).first()
    assert model is None

def test_delete_todo_not_found(test_todo):
    response = client.delete("/todo/999")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {
        "detail": "Todo not found"
    }

