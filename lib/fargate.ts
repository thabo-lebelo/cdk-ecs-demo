import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as ecr from "@aws-cdk/aws-ecr";
import * as elbv2 from "@aws-cdk/aws-elasticloadbalancingv2";

export class FargateDemoStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // base infrastucture
        const vpc = new ec2.Vpc(this, "thabolebeloVPC", {
            maxAzs: 2,
            natGateways: 1,
        });

        const cluster = new ecs.Cluster(this, "thabolebeloCluster", {
            vpc: vpc,
            clusterName: "API"
        });

        const alb = new elbv2.ApplicationLoadBalancer(this, "thabolebeloALB", {
            vpc: vpc,
            internetFacing: true,
            loadBalancerName: 'API'
        });

        // get our image
        // Replace with your repo ARN
        const repo = ecr.Repository.fromRepositoryArn(this, "thabolebeloRepo",
            "arn:aws:ecr:<region>:<account-number>:repository/<repo-name>"
        );
        const image = ecs.ContainerImage.fromEcrRepository(repo, 'latest')

        // task definition
        const task = new ecs.TaskDefinition(this, "thabolebeloTaskDefinition", {
            compatibility: ecs.Compatibility.EC2_AND_FARGATE,
            cpu: '256',
            memoryMiB: '512',
            networkMode: ecs.NetworkMode.AWS_VPC
        });

        const container = task.addContainer("thabolebeloContainer", {
            image: image,
            memoryLimitMiB: 512
        });

        container.addPortMappings({
            containerPort: 1000,
            protocol: ecs.Protocol.TCP
        });

        // create service
        const service = new ecs.FargateService(this, "thabolebeloService", {
            cluster: cluster,
            taskDefinition: task,
            serviceName: 'service'
        });

        // network the service with the load balancer
        const listener = alb.addListener('listener', {
            open: true,
            port: 80
        });

        // add target group to container
        listener.addTargets('service', {
            targetGroupName: 'ServiceTarget',
            port: 80,
            targets: [service],
            healthCheck: {
                enabled: true,
                path: '/health'
            }
        })

    }
}