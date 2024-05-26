FROM debian:latest

# Install dependencies
RUN apt-get update && apt-get install -y \
    bash \
    curl \
    jq \
    awscli \
    wget

# Install kubectl
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" \
    && chmod +x kubectl \
    && mv kubectl /usr/local/bin/
    
# Install mongo-tools
RUN wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-debian12-x86_64-100.9.4.tgz \
    && tar -xzvf mongodb-database-tools-debian12-x86_64-100.9.4.tgz \
    && mv mongodb-database-tools-debian12-x86_64-100.9.4/bin/* /usr/local/bin/ \
    && rm -rf mongodb-database-tools-debian12-x86_64-100.9.4.tgz mongodb-database-tools-debian12-x86_64-100.9.4

# Install mongosh
RUN wget https://downloads.mongodb.com/compass/mongosh-2.2.6-linux-x64.tgz \
    && tar -xzvf mongosh-2.2.6-linux-x64.tgz \
    && mv mongosh-2.2.6-linux-x64/bin/* /usr/local/bin/ \
    && rm -rf mongosh-2.2.6-linux-x64.tgz mongosh-2.2.6-linux-x64

# Clean up
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Set entrypoint to bash
ENTRYPOINT ["/bin/bash"]
