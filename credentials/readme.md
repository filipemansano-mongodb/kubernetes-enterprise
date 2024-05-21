# Secure Management of MongoDB Atlas Credentials on Kubernetes with External Secrets

This guide demonstrates how to securely manage MongoDB Atlas credentials on Kubernetes using AWS Secrets Manager.

## Steps

### 1. Store Atlas Credentials on AWS

Run the following command to create a secret in AWS Secrets Manager containing your Atlas keys:

```sh
aws secretsmanager create-secret --name atlas/organization-secret --secret-string "{\"publicKey\":\"<YOUR-ATLAS-PUBLIC-KEY>\", \"privateKey\":\"<YOUR-ATLAS-PRIVATE-KEY>\"}"
```

To check the secret's creation, use the command:

```sh
aws secretsmanager get-secret-value --secret-id atlas/organization-secret
```

### 2. Install External-Secrets
Add the Helm repository for External-Secrets and install it:

```sh
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets \
    external-secrets/external-secrets \
    --namespace external-secret \
    --create-namespace \
    --set installCRDs=true
```

### 3. Configure AWS Credentials
Create a generic secret in Kubernetes containing your AWS credentials:

```sh
kubectl create secret generic aws-credentials \
  --from-literal="accessKeyID=" \
  --from-literal="secretAccessKey=" \
  --namespace external-secret
```

### 4. Apply Configurations
Apply the configurations to set up secure storage of Atlas credentials:

```sh
kubectl apply -f secret-store.yaml --namespace external-secret
```

### 5. Apply Atlas Secret Configurations
Apply the configurations for the Atlas secret:

```sh
kubectl apply -f atlas-secret.yaml --namespace external-secret
```

Apply the configurations for the Prometheus secret:
```sh
kubectl apply -f prometheus-secret.yaml --namespace external-secret
```

### 6. Install mirrors
Add the Helm repository for mirrors and install it:

```sh
helm repo add kts https://charts.kts.studio
helm install mirrors \
    kts/mirrors \
    --namespace external-secret \
    --set installCRDs=true
```

### 7. Mirror atlas credentials to MongoDB namespace
As secrets can only be accessed within the same namespace, to make the atlas credentials available in the mongo namespace, we need to mirror this secret within the external-secret namespace to the mongodb namespace, to do this apply the command below

> Note: Go to the monitoring readme and create the prometheus namespace by adding it by operator using helm before mirroring the secrets below

```sh
kubectl apply -f mirror-atlas-secret.yaml -f mirror-prometheus-secret.yaml --namespace external-secret
```

Now your MongoDB Atlas credentials are securely managed on Kubernetes and AWS.

Note: Be sure to replace `<...>` with your own information.

For more information on other authentication alternatives and additional details, refer to the [External-Secrets documentation](https://external-secrets.io/latest/provider/aws-secrets-manager/#aws-authentication).
