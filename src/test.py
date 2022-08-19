from urllib import response
import boto3
import os
import urllib.request

def lambda_handler(event, context):
    # client = boto3.client('sagemaker')
    test = os.environ['NotebookInstanceUrl']
    # prev = os.environ['PREV_RESPONSE']
    # print(os.environ['NotebookInstanceUrl'])
    print("I am running!")
    response = urllib.request.urlopen(test)
    html = response.read().decode('utf-8')


    if os.getenv('PREV_RESPONSE',default="HTML_BODY") != html:
        os.environ['PREV_RESPONSE'] = html

   #Start the instance
   #  client.start_notebook_instance(NotebookInstanceName = 'SMPocInstance')
    return {
        'statusCode': 302,
        'headers': {'Location': test},
        # 'headers': {
        #     'Content-Type': 'text/plain'
        # },
        # 'body': 'The backend inf rastructure is in Off mode because of cost saving plan , we are working now to bring it back online , please try again after 5 min')
    }