import requests
import json

scoring_uri = "http://localhost:32268/score"
headers = {'Content-Type':'application/json'}

test_data = json.dumps({'user_answer':"Cloud Provider",'bot_answer':"is not Cloud Consumer"})

response = requests.post(scoring_uri, data=test_data, headers=headers)
print(response.status_code)
print(response.elapsed)
print(response.json())