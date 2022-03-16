#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { FargateDemoStack } from '../lib/fargate'

const app = new cdk.App();

new FargateDemoStack(app, "FargateDemoStack", {
    env: { account: "<account-id>", region: "<region>"}
});
