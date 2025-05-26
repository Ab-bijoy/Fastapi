from fastapi import FastAPI
app = FastAPI()

@app.get("/") # just a simple get request (api theke output dekhabe)

#@app.post("/items/{item_id}") # post request with a path parameter(api theke data database e jabe)

def hello_world():
    return {"message": "This is my First API!"}# return a json response

@app .get('/about') # another get request
def about():
    return {"message": "I learn FastAPI for buliding api"} # return a json response