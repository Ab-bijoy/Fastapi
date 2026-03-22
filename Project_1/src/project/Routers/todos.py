from fastapi import APIRouter,Depends,Path,HTTPException
from typing import List,Annotated
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models import Todos
from starlette import status
from pydantic import BaseModel,Field
from .auth import get_current_user
router = APIRouter()
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session,Depends(get_db)]

user_dependency = Annotated[dict,Depends(get_current_user)]


class TodoRequest(BaseModel):
    title:str = Field(min_length=3)
    description:str = Field(min_length=3)
    priority:int = Field(gt=0,lt=6)
    completed:bool



@router.get("/",status_code = status.HTTP_200_OK)
async def read_All(user:user_dependency,db:db_dependency):
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    return db.query(Todos).filter(Todos.owner_id == user.get('id')).all() 

@router.get("/todo/{todo_id}",status_code = status.HTTP_201_CREATED)
async def read_todo(user:user_dependency, db:db_dependency,todo_id:int = Path(gt=0)):

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    todo = db.query(Todos).filter(Todos.id == todo_id,Todos.owner_id == user.get('id')).first()
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


@router.post("/todo",status_code = status.HTTP_201_CREATED)
async def create_todo(user:user_dependency,db:db_dependency,todo_request:TodoRequest):
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    todo = Todos(**todo_request.dict(),owner_id = user.get('id'))
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


@router.put("/todo/{todo_id}",status_code = status.HTTP_200_OK)
async def update_todo(user:user_dependency,db:db_dependency,todo_request:TodoRequest,todo_id:int = Path(gt=0)):
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    todo = db.query(Todos).filter(Todos.id == todo_id,Todos.owner_id == user.get('id')).first()
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    todo.title = todo_request.title
    todo.description = todo_request.description
    todo.priority = todo_request.priority
    todo.completed = todo_request.completed
    db.commit()
    db.refresh(todo)
    return todo


@router.delete("/todo/{todo_id}",status_code = status.HTTP_204_NO_CONTENT)
async def delete_todo(user:user_dependency,db:db_dependency,todo_id:int = Path(gt=0)):
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    todo = db.query(Todos).filter(Todos.id == todo_id,Todos.owner_id == user.get('id')).first()
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    db.query(Todos).filter(Todos.id == todo_id,Todos.owner_id == user.get('id')).delete()
    db.commit()
    
