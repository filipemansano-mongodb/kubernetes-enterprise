https://learn.mongodb.com/learn/course/ts-k8s-intro/main/kubernetes-for-tses?client=mongodb-internal
https://github.com/mongodb/mongodb-enterprise-kubernetes/tree/master/samples/mongodb
https://www.mongodb.com/docs/kubernetes-operator/master/reference/k8s-operator-specification/
https://www.youtube.com/watch?v=Pv70IcwipF0

# Key Concepts
- **Contêineres**
    - Unidade lógica que hospeda um ou mais contêineres.
    - Gerencia recursos compartilhados como rede e armazenamento.
    - Não é criado diretamente pelo usuário.
- **Pod**
    - Unidade lógica que hospeda um ou mais contêineres.
    - Gerencia recursos compartilhados como rede e armazenamento.
    - Não é criado diretamente pelo usuário.


# Envrionment

## kubectl
The Kubernetes command-line tool, kubectl, allows you to run commands against Kubernetes clusters. You can use kubectl to deploy applications, inspect and manage cluster resources, and view logs. For more information including a complete list of kubectl operations, see the kubectl reference documentation.

1. Instalation
    - MacOS: `brew install kubectl`
2. Test: `kubectl version --client`

## Minikube
minikube is a tool that lets you run Kubernetes locally. minikube runs an all-in-one or a multi-node local Kubernetes cluster on your personal computer (including Windows, macOS and Linux PCs) so that you can try out Kubernetes, or for daily development work.

1. Instalation
    - MacOS: `brew install minikube`
2. Start your cluster: `minikube start`
3. Open Dashboard: `minikube dashboard`

2. Aux Commands
    - Pause: `minikube pause`
    - Stop: `minikube stop`
    - Delete All clusters: `minikube delete --all`
    - Change resources: `minikube start --memory 6144 --cpus 2`

## Heml
The package manager for Kubernetes
1. Instalation
    - MacOS: `brew install helm`

# Operators

## MongoDB Community Operator
The MongoDB Community Operator is used for running MongoDB Community on Kubernetes. Since most PS customers are enterprise users, we will not spend time on the Community operator in this mission, but it’s good to know that it exists. If you want to try the operator out, you can find code and documentation on this [git project page](https://github.com/mongodb/mongodb-kubernetes-operator).

## MongoDB Enterprise Operator
The [MongoDB Enterprise Operator](https://www.mongodb.com/docs/kubernetes-operator/master/) allows you to deploy MongoDB Enterprise Advanced on any infrastructure (on prem/hybrid/cloud) providing Kubernetes. It relies on Ops Manager for most of the automation tasks. You can either deploy Ops Manager in Kubernetes, using the Operator or you can integrate with Cloud Manager and avoid hosting Ops Manager. It provides CRDs for:
- Ops Manager (kind: [MongoDBOpsManager](https://www.mongodb.com/docs/kubernetes-operator/master/reference/k8s-operator-om-specification/))
- MongoDB clusters (kind: [MongoDB](https://www.mongodb.com/docs/kubernetes-operator/master/reference/k8s-operator-specification/)), including
- Standalone instances
- Replica Sets
- Sharded Clusters
- Users (kind: [MongoDBUser](https://www.mongodb.com/docs/kubernetes-operator/master/manage-users/#k8s-manage-db-users))


# Create base resources and setup the credentials
```sh
NAMESPACE=mongodb

# create namespace
kubectl create namespace $NAMESPACE

# set default namespace
kubectl config set-context $(kubectl config current-context) --namespace=$NAMESPACE

# optional (used to connect with aws secret manager)
aws secretsmanager create-secret --name atlas/organization-secret --secret-string "{\"publicKey\":\"$API_KEY_PUBLIC\", \"privateKey\":\"$API_KEY_PRIVATE\"}"

# check secret's creation
aws secretsmanager get-secret-value --secret-id organization-secret

# install external-secrets
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets \
    external-secrets/external-secrets \
    --namespace $NAMESPACE  \
    --set installCRDs=true

# aws credentials to authenticate secret store, check other authentication alternatives below 
# https://external-secrets.io/latest/provider/aws-secrets-manager/#aws-authentication

kubectl create secret generic aws-credentials \
  --from-literal="accessKeyID=" \
  --from-literal="secretAccessKey="

kubectl apply -f secret-store.yaml

# install mongodb enterprise kuernetes operator
helm repo add mongodb https://mongodb.github.io/helm-charts
helm install enterprise-operator mongodb/enterprise-operator \
    --namespace $NAMESPACE  \
    --set installCRDs=true

kubectl apply -f secret.yaml -f config-map.yaml
```

# Creating the certificates to enable TLS
More Info: https://www.mongodb.com/docs/kubernetes-operator/stable/tutorial/cert-manager-integration/

```sh
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager \
    jetstack/cert-manager \
    --namespace cert-manager \
    --create-namespace \
    --set installCRDs=true

# create the ca
openssl req -x509 -newkey rsa:2048 -keyout ./certificates/tls/ca.key -out ./certificates/tls/ca.crt -days 365 -nodes -subj "/C=GB/ST=Scotland/L=Glasgow/O=MongoDB/CN=mylittleca.com"

# create the secret
kubectl create secret tls ca-key-pair --cert=./certificates/tls/ca.crt --key=./certificates/tls/ca.key --namespace=$NAMESPACE

# create the ca issuer
kubectl apply -f certificates/self-signed-issuer.yaml --namespace=$NAMESPACE

# test the ca issuer is ready
kubectl get issuer ca-issuer --namespace=$NAMESPACE

# download ca from opsmanager
openssl s_client -showcerts -verify 2 \
    -connect downloads.mongodb.com:443 -servername downloads.mongodb.com < /dev/null \
    | awk '/BEGIN/,/END/{ if(/BEGIN/){a++}; out="certificates/mms/cert"a".crt"; print >out}'

cat certificates/mms/cert1.crt certificates/mms/cert2.crt certificates/mms/cert3.crt certificates/mms/cert4.crt  >> certificates/mms/mms-ca.crt

kubectl create configmap om-http-cert-ca --from-file="certificates/mms/mms-ca.crt"

kubectl create configmap ca-issuer \
    --from-file=ca-pem=./certificates/tls/ca.crt \
    --from-file=mms-ca.crt=./certificates/tls/ca.crt \
    --namespace=$NAMESPACE

# create the certificates
kubectl apply -f cert-config/mongodb-certificate.yaml -f cert-config/agent-certificate.yaml --namespace=$NAMESPACE
```

# Creating the certificates to enable encryption at rest
```sh
openssl req -x509 -newkey rsa:4096 -keyout ./certificates/kmip/ca.key -out ./certificates/kmip/ca.pem -days 365 -nodes -subj "/CN=KMIP-CA"
openssl req -newkey rsa:4096 -keyout ./certificates/kmip/client.key -out ./certificates/kmip/client.csr -nodes -subj "/CN=KMIP-Client"
openssl x509 -req -in ./certificates/kmip/client.csr -CA ./certificates/kmip/ca.pem -CAkey ./certificates/kmip/ca.key -CAcreateserial -out ./certificates/kmip/client.pem -days 365
cat ./certificates/kmip/client.pem ./certificates/kmip/client.key > ./certificates/kmip/cert.pem

kubectl create configmap mongodb-kmip-certificate-authority-pem --from-file=./certificates/kmip/ca.pem --namespace=$NAMESPACE
kubectl create secret generic mongodb-kmip-client-pem --from-file=./certificates/kmip/cert.pem --namespace=$NAMESPACE
```

# Create the replica-set and connect
```sh
kubectl apply -f repl-set.yaml

# check the log
kubectl describe MongoDB rs-0 --namespace=$NAMESPACE

# create admin user
kubectl apply -f user-secret.yaml -f admin-user.yaml

# get the connection string and credentials
kubectl get secret rs-0-admin-user-admin --namespace=$NAMESPACE -o json | jq -r '.data | with_entries(.value |= @base64d)'


kubectl port-forward rs-0-0 27017 -n mongodb
kubectl exec -it -n mongodb rs-0-0 -c mongodb-enterprise-database -- bash

/var/lib/mongodb-mms-automation/mongosh-linux-x86_64-2.2.4/bin/mongosh \
    --tls \
    --tlsCAFile /mongodb-automation/tls/ca/ca-pem \
    "mongodb+srv://admin-user:admin123@rs-0-svc.mongodb.svc.cluster.local/admin?ssl=true"

mongosh \
    --tls \
    --tlsCAFile /Users/filipemansano/MongoDB/tests/kubernetes/certificates/tls/ca.crt \
    "mongodb://admin-user:admin123@127.0.0.1:27017/admin?ssl=true"
```