import os
import json
from pipelines import pipeline

def init():
  global npl
  model_path = os.path.join(os.getenv('AZUREML_MODEL_DIR'), 'pytorch_model.bin')
  npl = pipeline(model=model_path)

# Handle requests to the service
def run(data):
  data = json.loads(data)
  return npl(data['text'])
