# # def handler(event, context):
# #     return {
# #         "statusCode": 200,
# #         "headers": {"Content-Type": "text/html"},
# #         "body": """
# #         <html><body><h1>Hello from the jupyter lambda</h1></body></html>
# #         """
# #     }
import boto3
import os


def handler(event, context):
    client = boto3.resource('cloudformation')
    stack_id = os.environ['VSCODE_STACK_ID']

    described_stacks = client.describe_stacks(StackName=stack_id)
    for s in described_stacks:
        if s["StackId"] == stack_id:
            for o in s["Outputs"]:
                if o["OutputKey"] == "LoadBalancerDNS":
                    return {
                        'statusCode': 302,
                        'headers': {'Location': o["OutputValue"]}
                    }

    return {
        'statusCode': 500,
        'error': 'DNS Name not found'
    }
