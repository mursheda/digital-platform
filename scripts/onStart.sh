#!/bin/bash

set -e
cat << EOF >> /home/ec2-user/.gitconfig
[user]
        name = SageMaker Instance
        email = sagemaker@example.com
EOF

