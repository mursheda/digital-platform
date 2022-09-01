import { StackProps } from "aws-cdk-lib";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from "constructs";
// import { PdsApplicationStack } from '@vw-pds/pds-cdk';
import { IApplicationListener, IApplicationTargetGroup, ILoadBalancerV2 } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { IVpc } from "aws-cdk-lib/aws-ec2";

import elbv2_targets = require('aws-cdk-lib/aws-elasticloadbalancingv2-targets');
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Service } from "aws-cdk-lib/aws-servicediscovery";

export interface VSCodeStackProps{
  // vpc: IVpc;
}
export class VSCodeStack extends Construct {
  public target_group: elbv2.IApplicationTargetGroup;
  constructor(scope: Construct, id: string, props?: VSCodeStackProps) {
    super(scope, id);

    // Create a cluster
    const vpc = new ec2.Vpc(this, 'Vpc', { maxAzs: 2 });

    const cluster = new ecs.Cluster(this, 'EcsCluster', { vpc });
    cluster.addCapacity('DefaultAutoScalingGroup', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO,
      ),
    });

    // Create Task Definition
    const taskDefinition = new ecs.Ec2TaskDefinition(this, 'TaskDef');
    const container = taskDefinition.addContainer('web', {
      image: ecs.ContainerImage.fromAsset(
        path.resolve(__dirname, '/Users/m.baby/pocmain/src/vs-code-docker-image'), 
      ),
      memoryLimitMiB: 8192,
    });

    container.addPortMappings({
      containerPort: 8443,
      hostPort: 8080,
      protocol: ecs.Protocol.TCP,
    });

    // Create Service
    const service = new ecs.Ec2Service(this, 'Service', {
      cluster,
      taskDefinition,
    });

    // Create ALB
    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: false,
    });
    const listener = lb.addListener('PublicListener', { port: 80, open: true });

    // // Attach ALB to ECS Service
    listener.addTargets('ECS', {
      port: 8080,
      targets: [
        service.loadBalancerTarget({
          containerName: 'vs-code',
          containerPort: 8443,
        }),
      ],
    //   // include health check (default is none)
      healthCheck: {
        interval: cdk.Duration.seconds(60),
        path: '/health',
        timeout: cdk.Duration.seconds(5),
      },
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: lb.loadBalancerDnsName,
    });

    // const fn = new lambda.Function(this, 'VSCodeHostingLambda', {
    //   runtime: lambda.Runtime.PYTHON_3_9,
    //   handler: 'index.handler',
    //   code: lambda.Code.fromAsset(
    //     path.join(__dirname, '../../src/vs-code-lambda'),
    //   ),
    //   vpc: props.vpc,
    //   vpcSubnets: {
    //     subnetType: lambda.SubnetType.PRIVATE_ISOLATED,
    //   },
    //   environment: {
    //     VSCODE_STACK_ID: id,
    //   },
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
