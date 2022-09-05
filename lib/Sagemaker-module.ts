import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker';
import fs = require('fs');

export interface SMInstanceProps {}

export var smname: string = 'SMPocInstance';
export var gitname: string = 'SMRepo';
export class SMInstance extends Construct {
  public readonly sagemakerNotebookInstance: sagemaker.CfnNotebookInstance;
  constructor(scope: Construct, id: string, props?: SMInstanceProps) {
    super(scope, id);

    // The code that defines your stack goes here
    const S3DSBucket = new s3.Bucket(this, 'MLBucket', {
      bucketName: 'sagemaker-poc-050817abd',
      encryption: s3.BucketEncryption.S3_MANAGED,
      autoDeleteObjects: true,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const repo = new codecommit.Repository(this, 'SMRepo', {
      repositoryName: gitname,
    });
    const sagemakerExecutionRole = new iam.Role(
      this,
      'sagemaker-execution-role',
      {
        assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AmazonSageMakerFullAccess',
          ),
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'personalize-full-access',
            'arn:aws:iam::aws:policy/service-role/AmazonPersonalizeFullAccess',
          ),
        ],
        inlinePolicies: {
          s3Buckets: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                resources: [S3DSBucket.bucketArn],
                actions: ['s3:ListBucket'],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                resources: [`${S3DSBucket.bucketArn}/*`],
                actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              }),
            ],
          }),
          repo: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                resources: [repo.repositoryArn],
                actions: ['codecommit:GitPull', 'codecommit:GitPush'],
              }),
            ],
          }),
        },
      },
    );
    const cfnCodeRepository = new sagemaker.CfnCodeRepository(
      this,
      'MyCfnCodeRepository',
      {
        gitConfig: {
          repositoryUrl: repo.repositoryCloneUrlHttp,
        },
      },
    );
    let onStartScript = fs.readFileSync('scripts/onCreate.sh', 'utf8');
    let onCreateScript = fs.readFileSync('scripts/onStart.sh', 'utf8');
    const lifecycleConfig = new sagemaker.CfnNotebookInstanceLifecycleConfig(
      this,
      'lifecycle-config',
      {
        notebookInstanceLifecycleConfigName: 'SageMaker-lifecycle-config',
        onCreate: [
          {
            content: cdk.Fn.base64(onCreateScript!),
          },
        ],
        onStart: [
          {
            content: cdk.Fn.base64(onStartScript!),
          },
        ],
      },
    );

    this.sagemakerNotebookInstance = new sagemaker.CfnNotebookInstance(
      this,
      'notebook-instance',
      {
        instanceType: 'ml.t2.medium',
        roleArn: sagemakerExecutionRole.roleArn,
        notebookInstanceName: smname,
        volumeSizeInGb: 10,
        defaultCodeRepository: cfnCodeRepository.attrCodeRepositoryName,
        lifecycleConfigName:
          lifecycleConfig.attrNotebookInstanceLifecycleConfigName,
      },
    );

    cdk.Tags.of(this).add('component', 'sagemaker');
  }
}
