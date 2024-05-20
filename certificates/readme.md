# Configuring Certificates
This guide outlines the steps to configure certificates setting up Cert-Manager, generating self-signed certificates, creating a CA issuer and creating certificates.

## Files Overview

### 1. self-signed-issuer.yaml

This file defines a ClusterIssuer named `selfsigned-issuer`. It instructs cert-manager to self-sign certificates.

### 2. self-signed-ca.yaml

This file creates a self-signed CA (Certificate Authority) certificate for MongoDB. The CA certificate is used to sign other certificates within the MongoDB namespace.


## Steps

### 1. Install Cert-Manager

Add the Jetstack Helm repository and install Cert-Manager:

```sh
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager \
    jetstack/cert-manager \
    --namespace cert-manager \
    --create-namespace \
    --set installCRDs=true
```

### 2. Create the Cluster Issuer
Apply the `self-signed-issuer.yaml` to create the ClusterIssuer for self-signed certificates:
```sh
kubectl apply -f self-signed-issuer.yaml
```

### 3. Create the MongoDB CA
Apply the self-signed-ca.yaml to create the self-signed CA certificate:
```sh
kubectl apply -f self-signed-ca.yaml --namespace cert-manager
```

Make sure that the CA certificate is ready, and by default, it will be located in the cert-manager namespace.
```sh
kubectl get certificate --namespace cert-manager
```

#### Expected result:
```sh
NAME         READY   SECRET                AGE
mongodb-ca   True    mongodb-ca-key-pair   3m21s
```

### 4. Create configmap
```sh

# unix user: 
secret_content=$(kubectl get secret mongodb-ca-key-pair --namespace cert-manager -o jsonpath='{.data.tls\.crt}' | base64 --decode)

# windows user: 
$data = kubectl get secret mongodb-ca-key-pair --namespace cert-manager  -o jsonpath='{.data.tls\.crt}'
$secret_content  = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($data))

kubectl create configmap mongodb-ca-issuer \
    --from-literal=ca-pem="$secret_content" \
    --from-literal=mms-ca.crt="$secret_content" \ 
    --namespace mongodb
```

### 5. Setup TLS
Refer to the [TLS README](tls/readme.md) for instructions on setting up certificates.

### 6. Setup KMIP
Refer to the [KMIP README](kmip/readme.md) for instructions on setting up certificates for encryption at rest.