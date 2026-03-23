from fastapi import APIRouter,Depends,Path,HTTPException
from passlib.context import CryptContext
from typing import List,Annotated
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models import Todos, User
from starlette import status
from pydantic import BaseModel,Field
from .auth import get_current_user, bcrypt_context

router = APIRouter(
    prefix="/user",
    tags=["user"])
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session,Depends(get_db)]

user_dependency = Annotated[dict,Depends(get_current_user)]

bcrypt_context = CryptContext(schemes=["bcrypt"],deprecated="auto")

class PhoneNumberRequest(BaseModel):
    phone_number: str

class UserVerification(BaseModel):
    password:str
    new_password:str = Field(min_length = 6)


@router.get('',status_code = status.HTTP_200_OK)
async def get_user(user:user_dependency,db:db_dependency):
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    return db.query(User).filter(User.id == user.get('id')).first()

@router.put("/phone_number",status_code = status.HTTP_200_OK)
@router.put("/phone_number", status_code=status.HTTP_200_OK)
async def update_user_phone_number(user: user_dependency, db: db_dependency, request: PhoneNumberRequest):
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    
    # Use user.get('id') directly from the securely validated token
    user_model = db.query(User).filter(User.id == user.get('id')).first()
    
    if user_model is None:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_model.phone_number = request.phone_number
    db.commit()
    db.refresh(user_model)
    return user_model

@router.put("/password", status_code=status.HTTP_204_NO_CONTENT)
async def update_user_password(
    user: user_dependency, 
    db: db_dependency, 
    user_verification: UserVerification # <-- Use the Pydantic model here to accept JSON!
):
    if user is None: 
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authorized")
    
    # 1. Find the logged-in user securely using their token ID
    target_user = db.query(User).filter(User.id == user.get('id')).first()
    
    if target_user is None:
        raise HTTPException(status_code=404, detail="User not found")
        
    # 2. Verify that their old password matches before allowing a change
    if not bcrypt_context.verify(user_verification.password, target_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Error on password change")
        
    # 3. Update their password to the securely hashed new password
    target_user.hashed_password = bcrypt_context.hash(user_verification.new_password) 
    db.commit()



