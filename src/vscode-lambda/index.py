import boto3
import os


def handler(event, context):
    client = boto3.client('cloudformation')
    stack_id = os.environ['VSCODE_STACK_ID']

    described_stacks = client.describe_stacks(StackName=stack_id)
    for s in described_stacks["Stacks"]:
        if s["StackName"] == stack_id:
            for o in s["Outputs"]:
                if "LoadBalancerDNS" in o["OutputKey"]:
                    return {
                        'statusCode': 302,
                        'headers': {'Location': o["OutputValue"]}
                    }

    return {
        'statusCode': 500,
        'error': 'DNS Name not found'
    }
