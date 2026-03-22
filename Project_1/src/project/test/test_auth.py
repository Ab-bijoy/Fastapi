import asyncio
from .utils import *
from ..Routers.auth import get_db,authenticate_user,create_access_token,SECRET_KEY,ALGORITHM,get_current_user
from jose import jwt
import pytest
from fastapi import HTTPException,status
from datetime import timedelta

app.dependency_overrides[get_db] = override_get_db

def test_authenticate_user(test_user):
    db = TestingSessionLocal()
    authenticated_user = authenticate_user("AnindoBarua", "testpassword", db)
    
    # Normally authenticate_user returns the User object or False
    assert authenticated_user is not False
    assert authenticated_user.username == "AnindoBarua"

    non_existent_user = authenticate_user("wrongusername", "wrongpassword", db)
    assert non_existent_user is False

    wrong_password_user = authenticate_user("AnindoBarua", "wrongpassword", db)
    assert wrong_password_user is False


def test_create_access_token():
    token = create_access_token("AnindoBarua",3,"admin",timedelta(minutes=20))
    assert token is not None
    payload = jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM])
    assert payload.get("sub") == "AnindoBarua"
    assert payload.get("id") == 3
    assert payload.get("role") == "admin"

@pytest.mark.asyncio
async def test_get_current_user_valid_token():
   encode = {"sub":"AnindoBarua","id":3,"role":"admin"}
   token = jwt.encode(encode,SECRET_KEY,algorithm=ALGORITHM)
   user = await get_current_user(token=token)
   assert user == {"username": "AnindoBarua", "id": 3, "role": "admin"}

@pytest.mark.asyncio
async def test_get_current_user_invalid_token():
    encode = {"sub":"AnindoBarua","id":3,"role":"admin"}
    token = jwt.encode(encode,SECRET_KEY,algorithm=ALGORITHM)
    user = await get_current_user(token=token)
    assert user == {"username": "AnindoBarua", "id": 3, "role": "admin"}



@pytest.mark.asyncio
async def test_get_current_user_missing_payload():
    encode = {'role':'user'}
    token = jwt.encode(encode,SECRET_KEY,algorithm=ALGORITHM)
    with pytest.raises(HTTPException) as exception_info:
        await get_current_user(token=token)
    assert exception_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert exception_info.value.detail == "Incorrect username or password"