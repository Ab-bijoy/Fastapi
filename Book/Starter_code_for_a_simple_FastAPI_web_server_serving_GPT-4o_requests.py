import os
from fastapi import FastAPI
from openai import AzureOpenAI

app = FastAPI()

# Initialize Azure OpenAI client
endpoint = os.getenv("ENDPOINT_URL", "https://myjobsopenai.openai.azure.com/")
deployment = os.getenv("DEPLOYMENT_NAME", "ngoai")
subscription_key = os.getenv("AZURE_OPENAI_API_KEY", "")

client = AzureOpenAI(
    azure_endpoint=endpoint,
    api_key=subscription_key,
    api_version="2024-05-01-preview",
)

@app.get("/")
def root_controller():
    return {"status": "healthy"}

@app.get("/chat")
def chat_controller(prompt: str = "Inspire me"):
    # Prepare the chat messages
    messages = [
        {
            "role": "system",
            "content": "You are an AI assistant that helps people find information."
        },
        {
            "role": "user",
            "content": prompt
        }
    ]
    
    # Generate the completion
    completion = client.chat.completions.create(
        model=deployment,
        messages=messages,
        max_tokens=800,
        temperature=0.7,
        top_p=0.95,
        frequency_penalty=0,
        presence_penalty=0,
        stream=False
    )
    
    # Extract and return the response
    statement = completion.choices[0].message.content
    return {"statement": statement}