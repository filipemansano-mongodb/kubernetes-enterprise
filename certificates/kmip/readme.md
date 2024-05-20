# Encrypt Data Using a Key Management Service

This README will guide you through the process of setting up KMIP (Key Management Interoperability Protocol) encryption to activate encryption at rest in MongoDB. KMIP provides a standardized protocol for communication between key management services and encryption systems.

## Steps

### 1. Generation of Keys and Certificates

#### 1.1. Generate the Private Key for the CA (Certification Authority)
```sh
openssl genpkey -algorithm RSA -out ca_key.pem -pkeyopt rsa_keygen_bits:4096
```

#### 1.2. Create the CA Certificate
```sh
openssl req -x509 -new -nodes -key ca_key.pem -sha256 -days 1024 -out ca_cert.pem -subj "/C=BR/ST=Sao Paulo/L=Sao Paulo/O=YourOrg/OU=IT/CN=mdb.local"
```

#### 1.3. Generate the Private Key for the Server
```sh
openssl genpkey -algorithm RSA -out server_key.pem -pkeyopt rsa_keygen_bits:4096
```

#### 1.4. Create the Server Certificate Signing Request (CSR)
```sh
openssl req -new -key server_key.pem -out server_csr.pem -config openssl-server.cnf
```

#### 1.5. Sign the Server CSR with the CA
```sh
openssl x509 -req -in server_csr.pem -CA ca_cert.pem -CAkey ca_key.pem -CAcreateserial -out server_cert.pem -days 500 -sha256 -extfile openssl-server.cnf -extensions req_ext
```

#### 1.6. Generate the Private Key for the Client (for KMIP, if needed)
```sh
openssl genpkey -algorithm RSA -out client_key.pem -pkeyopt rsa_keygen_bits:4096
```

#### 1.7. Create the Client CSR
```sh
openssl req -new -key client_key.pem -out client_csr.pem -config openssl-client.cnf
```

#### 1.8. Sign the Client CSR with the CA
```sh
openssl x509 -req -in client_csr.pem -CA ca_cert.pem -CAkey ca_key.pem -CAcreateserial -out client_cert.pem -days 500 -sha256 -extfile openssl-client.cnf -extensions req_ext
```

#### 1.9. Combine Client Key and Certificate
```sh
type client_key.pem client_cert.pem > client.pem
```

### 2. Build Local PyKmip Server with Docker
This section outlines the steps to set up a local PyKmip server using Docker and Kubernetes. The PyKmip server will be used as a key management service (KMS) that communicates with MongoDB to manage encryption keys.


#### 2.2 Build Docker Image
```sh
    docker build -t pykmip-server .
```

#### 2.3 Run local Docker registry
add registry to minikube addons. This is useful for testing and development purposes.
```sh
minikube addons enable registry
kubectl get service --namespace kube-system
```

#### 2.4 Tag and Push Docker Image
```sh
# get minikube-ip
minikube ip

# open in a new terminal
kubectl port-forward --namespace kube-system service/registry 5000:80

## open in a new terminal
docker run --rm -it --network=host alpine ash -c "apk add socat && socat TCP-LISTEN:5000,reuseaddr,fork TCP:host.docker.internal:5000"

# push image
docker tag pykmip-server localhost:5000/pykmip-server
docker push localhost:5000/pykmip-server
```
This sequence tags the pykmip-server image with the local registry's address and then pushes it to ensure it's stored locally.

#### 2.5 Deploy PyKmip Server in Kubernetes
```sh
kubectl create namespace kmip
kubectl apply -f pykmip-server.yaml --namespace kmip
kubectl get deployment pykmip-server --namespace kmip
```
Here, pykmip-server.yaml contains the configuration for deploying the PyKmip server in Kubernetes. The kubectl get deployment command confirms the deployment status.


#### 2.4 Apply Kubernetes Service Configuration
Finally, apply the Kubernetes service configuration to ensure the PyKmip server is properly networked within Kubernetes.
```sh
kubectl apply -f service.yaml --namespace kmip
```
The service.yaml file contains the necessary configurations for the Kubernetes service that exposes the PyKmip server.

### 3. Create Kubernetes ConfigMap for CA Certificate:
```sh
kubectl create configmap mongodb-kmip-certificate-authority-pem --from-file=ca.pem=ca_cert.pem --namespace mongodb
```

### 4. Create Kubernetes Secret for Client Certificate:
```sh
kubectl create secret generic mongodb-kmip-client-pem --from-file=client.pem --namespace mongodb
```

### 5. Cleanup Local Certificate Files (optinal):
After successfully deploying and storing the certificates in Kubernetes secrets, remove the local certificate files to maintain security.

```sh
rm -f ca_key.pem ca_cert.pem server_key.pem server_csr.pem server_cert.pem client_key.pem client_csr.pem client_cert.pem ca_cert.srl client.pem
```