#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
// import { PocStack } from '../lib/poc-stack';
import { PocMain } from '../lib/main-poc-ds-stack';

const app = new cdk.App();


new PocMain(app, 'LambdaStack-test', {
  // stackName: 'LambdaStack-test',
  // env: {
  //   account: '294914763164',
  //   region: 'eu-west-1'
  // },


});