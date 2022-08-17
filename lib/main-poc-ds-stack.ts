import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { SMInstance } from "./Sagemaker-module";
import { LambdaPoc } from "./lambda-stack";
	
export class PocMain extends Stack {
	  constructor(scope: Construct, id: string, props?: StackProps) {
	    super(scope, id, props);
	
	    const SM = new SMInstance(this, "SageMakerS3Git");	    
        const LM = new LambdaPoc(this, "LambdaApi");
	  }
	}