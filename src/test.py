import boto3
import os

def lambda_handler(event, context):
    # client = boto3.client('sagemaker')
    test = os.environ['NotebookInstanceUrl']
    print(os.environ['NotebookInstanceUrl'])

   #Start the instance
   #  client.start_notebook_instance(NotebookInstanceName = 'SMPocInstance')
    return {
        'statusCode': 302,
        'headers': {'Location': test}
    }