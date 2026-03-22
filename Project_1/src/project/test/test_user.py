from .utils import *
from ..Routers.user import get_db , get_current_user
from fastapi import status

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user

def test_get_user(test_user):
    response = client.get("/user")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()['username'] == 'AnindoBarua'

def test_change_password_success(test_user):
    response = client.put("/user/password", json={"password": "testpassword", "new_password": "newpassword"})
    assert response.status_code == status.HTTP_204_NO_CONTENT

def test_change_password_success_wrong_password(test_user):
    response = client.put("/user/password", json={"password": "wrongpassword", "new_password": "newpassword"})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_change_phone_number_success(test_user):
    response = client.put("/user/phone_number", json={"phone_number": "1234567890"})
    assert response.status_code == status.HTTP_200_OK
    assert response.json()['phone_number'] == '1234567890'