import boto3
import os
from datetime import datetime as dt

def lambda_handler(event, context):
    client = boto3.client('sagemaker')
    test = os.environ['NotebookInstanceUrl']

    if dt.now().hour + 1 == 8: #Starts the instance at 8am
        client.start_notebook_instance(NotebookInstanceName='SMPocInstance')
        print(dt.now().hour + 1 == 8)
    
    if dt.now().hour + 1 ==16: 
        response_list = client.list_notebook_instances(StatusEquals= 'InService') 
        for nbook in response_list['NotebookInstances']:
            client.stop_notebook_instance(NotebookInstanceName=nbook['NotebookInstanceName']) #stop all notebooks in service at exactly 4pm

    return {
        'statusCode': 302,           
        'headers': {'Location': test}
    }

