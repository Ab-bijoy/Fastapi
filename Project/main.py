from fastapi import FastAPI,Path,Query
import json
app = FastAPI()

# just a simple get request (api theke output dekhabe)

#@app.post("/items/{item_id}") # post request with a path parameter(api theke data database e jabe)

def load_data():
    with open('synthetic_health_data.json', 'r') as f: # open the data.json file in read mode
        data = json.load(f) # load the json data from the file
    return data # return a json response

@app.get("/") 
def hello_world():
    return {"message": "Paitent Management API!"}# return a json response

@app .get('/about') # another get request
def about():
    return {"message": "A fully fuctional API"} # return a json response

@app.get("/view")

def view():
    data = load_data()
    return data  # return the data loaded from the JSON file

@app.get("/patient/{patient_id}")
def view_paitent(patient_id: str = Path(..., description="The ID of the patient in the database", example='P011')):
    data = load_data()
    
    if patient_id in data:
        return data[patient_id]  # Return the specific patient data
    return {"error": "Patient not found"} # Return an error message if patient_id is not found