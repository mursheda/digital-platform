//Library folder gives the power to write the infrastructure that you want. and to execute it we go to the bin folder.
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda';
import { HttpMethod } from 'aws-cdk-lib/aws-events';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { gitname, smname} from "./Sagemaker-module";
import { LambdaTarget } from "aws-cdk-lib/aws-elasticloadbalancingv2-targets";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as path from 'path';

export interface LambdaPocProps {}
export class LambdaPoc extends Construct {

  constructor(scope: Construct, id: string, props?: LambdaPocProps) {
    super(scope, id);

    //lambda
    const role = new iam.Role(this, 'role',{
      roleName: 'role',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSageMakerFUllAccess")
      ]
    });
    const function_name = 'my-function';
    const lambda_path = '/Users/m.baby/pocmain/src';
    // lambda function definition for sagemaker
    const handler = new lambda.Function(this, function_name, {
      functionName: function_name,
      role: role,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset(lambda_path),
      handler: 'test.lambda_handler',
      environment: {
        NotebookInstanceUrl: `https://${smname}.notebook.us-east-1.sagemaker.aws/tree/${gitname}`
      }
    });

    handler.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
      cors:{
        allowedMethods: [HttpMethod.GET],
        allowedOrigins: ["*"],
        maxAge: Duration.minutes(1),
      },
    });

    const vpc = new ec2.Vpc(this, "MyVpc",{
      maxAzs: 2,
    });
    const lb= new elbv2.ApplicationLoadBalancer(this, 'LB',{
      vpc: vpc,
      internetFacing: true
    });
    // Add a listener and open up the load balancer's security group
    // to the world.
    const listener = lb.addListener('Listener', {
    port: 80,
    });    
    const lambdaFunction= handler;
    // target to the listener.
    listener.addTargets('LambdaTargets', {
    targets: [new LambdaTarget(lambdaFunction)],
    healthCheck: {
        enabled: true,
    }
    });


    // // lambda function def for vscode
    // const fn = new lambda.Function(this, 'VSCodeHostingLambda', {
    //   runtime: lambda.Runtime.PYTHON_3_8,
    //   handler: 'index.handler',
    //   code: lambda.Code.fromAsset(
    //     path.join(__dirname, '../../src/vscode-lambda'),
    //   ),
    //   // vpc: props.vpc,
    //   // vpcSubnets: {
    //   //   subnetType: lambda.SubnetType.PRIVATE_ISOLATED,
    //   // },
    //   environment: {
    //     VSCODE_STACK_ID: id,
    //   },
    // });
    // const lbnew= new elbv2.ApplicationLoadBalancer(this, 'LB_new',{
    //   vpc: vpc,
    //   internetFacing: true
    // });
    // // // Add a listener and open up the load balancer's security group
    // // // to the world.
    // const listener_new = lbnew.addListener('Listener_new', {
    // port: 80,
    // open: true
    // });    
    // const lambdaFunction_new= fn;
    // // target to the listener.
    // listener_new.addTargets('LambdaTargets', {
    // targets: [new LambdaTarget(lambdaFunction_new)],
    // healthCheck: {
    //     enabled: true,
    // }
    // });
    // const alias = new lambda.Alias(this, 'VSCodeHostingLambdaAlias', {
    //   aliasName: 'VSCodeHostingLambda',
    //   version: fn.currentVersion,
    // });

    // this.target_group = new elbv2.ApplicationTargetGroup(
    //   this,
    //   'VSCodeHostingLambdaTargetGroup',
    //   {
    //     targets: [new elbv2_targets.LambdaTarget(alias)],
    //   },
    // );




}
}
