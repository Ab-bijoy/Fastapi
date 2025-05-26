from fastapi import FastAPI
import json
app = FastAPI()

@app.get("/") # just a simple get request (api theke output dekhabe)

#@app.post("/items/{item_id}") # post request with a path parameter(api theke data database e jabe)

def load_data():
    with open('patients.json', 'r') as f: # open the data.json file in read mode
        data = json.load(f) # load the json data from the file
    return data # return a json response


def hello_world():
    return {"message": "Paitent Management API!"}# return a json response

@app .get('/about') # another get request
def about():
    return {"message": "A fully fuctional API"} # return a json response

@app.get("/view")

def view():
    data = load_data()
    return data  # return the data loaded from the JSON file
