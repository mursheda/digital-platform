import { StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';
// import { PdsApplicationStack } from '@vw-pds/pds-cdk';
import {
  IApplicationListener,
  IApplicationTargetGroup,
  ILoadBalancerV2,
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import elbv2_targets = require('aws-cdk-lib/aws-elasticloadbalancingv2-targets');
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Service } from 'aws-cdk-lib/aws-servicediscovery';
import { VpcEndpointServiceDomainName } from 'aws-cdk-lib/aws-route53';
import * as ecr_assets from 'aws-cdk-lib/aws-ecr-assets';

export interface VSCodeStackProps {
  alb: elbv2.IApplicationLoadBalancer;
}
export class VSCodeStack extends Construct {
  public target_group: elbv2.IApplicationTargetGroup;
  constructor(scope: Construct, id: string, props: VSCodeStackProps) {
    super(scope, id);

    const cluster = new ecs.Cluster(this, 'EcsCluster', {
      vpc: props?.alb.vpc,
      capacity: {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T2,
          ec2.InstanceSize.MICRO,
        ),
      },
    });

    const application = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      'VSCodeFargateLoadBalancedService',
      {
        cluster: cluster,
        desiredCount: 1,
        taskImageOptions: {
          image: ecs.ContainerImage.fromAsset(
            path.resolve(__dirname, '../src', 'vs-code-docker-image'),
            {
              platform: ecr_assets.Platform.LINUX_AMD64,
            },
          ),
          containerPort: 8443,
        },
        listenerPort: 8080,
        loadBalancer: props?.alb,
        serviceName: 'VSCodeFargateBalanced',
        memoryLimitMiB: 512,
      },
    );

    // Create Task Definition
    // const taskDefinition = new ecs.Ec2TaskDefinition(this, 'TaskDef');
    // const container = taskDefinition.addContainer('vs-code', {
    //   image: ecs.ContainerImage.fromAsset(
    //     path.resolve(__dirname, '../src', 'vs-code-docker-image'),
    //   ),
    //   memoryLimitMiB: 512,
    // });

    // container.addPortMappings({
    //   containerPort: 8443,
    //   hostPort: 8080,
    //   protocol: ecs.Protocol.TCP,
    // });

    // // Create Service
    // const service = new ecs.Ec2Service(this, 'Service', {
    //   cluster,
    //   taskDefinition,
    // });

    // // Create ALB
    // const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
    //   vpc,
    //   internetFacing: false,
    // });
    // const listener = lb.addListener('PublicListener', { port: 80, open: true });

    // // // Attach ALB to ECS Service
    // listener.addTargets('ECS', {
    //   port: 8080,
    //   targets: [
    //     service.loadBalancerTarget({
    //       containerName: 'vs-code',
    //       containerPort: 8443,
    //     }),
    //   ],
    //   //   // include health check (default is none)
    //   healthCheck: {
    //     interval: cdk.Duration.seconds(60),
    //     path: '/health',
    //     timeout: cdk.Duration.seconds(5),
    //   },
    // });

    // new cdk.CfnOutput(this, 'LoadBalancerDNS', {
    //   value: lb.loadBalancerDnsName,
    // });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: application.loadBalancer.loadBalancerDnsName,
    });
  }
}
