# Setting Up MongoDB Enterprise on Kubernetes

This README provides step-by-step instructions for setting up MongoDB Enterprise on Kubernetes using the MongoDB Enterprise Operator. It covers prerequisites, installation steps, and configuration procedures to deploy and manage MongoDB clusters on Kubernetes.

## Key Concepts
- **Cluster**: A set of nodes that run containerized applications managed by Kubernetes.
- **Node**: A machine (physical or virtual) within the cluster. Each node contains the necessary services to run pods and is managed by the control plane.
- **Pod**: The smallest deployment unit in Kubernetes. A pod encapsulates one or more containers (e.g., Docker), along with their shared network and storage resources.
- **Container**: A lightweight unit of software that includes the code and all its dependencies so the application can run consistently across different environments.

```
Cluster
|
|- Node 1
|  |- Pod A
|  |  |- Container 1
|  |  |- Container 2
|  |- Pod B
|     |- Container 1
|
|- Node 2
|  |- Pod C
|  |  |- Container 1
|  |- Pod D
|     |- Container 1
|     |- Container 2
```

## Prerequisites
Before proceeding, ensure you have the following prerequisites installed:

### kubectl
The Kubernetes command-line tool, kubectl, allows you to run commands against Kubernetes clusters. You can use kubectl to deploy applications, inspect and manage cluster resources, and view logs. For more information including a complete list of kubectl operations, see the kubectl reference documentation.

1. Instalation
    - MacOS: `brew install kubectl`

### Minikube
minikube is a tool that lets you run Kubernetes locally. minikube runs an all-in-one or a multi-node local Kubernetes cluster on your personal computer (including Windows, macOS and Linux PCs) so that you can try out Kubernetes, or for daily development work.

1. Instalation
    - MacOS: `brew install minikube`
2. Start your cluster: `minikube start`
    - Windows: to use XFS storage add ` --driver=hyperv`
    
         ```sh
         # You may need to activate some Hyper V features
         Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-Tools-All -All
         ```
3. Open Dashboard: `minikube dashboard`

2. Aux Commands
    - Pause: `minikube pause`
    - Stop: `minikube stop`
    - Delete All clusters: `minikube delete --all`
    - Change resources: `minikube start --memory 6144 --cpus 2`

### Heml
The package manager for Kubernetes
1. Instalation
    - MacOS: `brew install helm`

## Steps

Follow these steps to set up MongoDB Enterprise on Kubernetes:

### 1. Install MongoDB Kubernetes Enterprise Operator

The [MongoDB Enterprise Operator](https://www.mongodb.com/docs/kubernetes-operator/master/) allows you to deploy MongoDB Enterprise Advanced on any infrastructure (on prem/hybrid/cloud) providing Kubernetes. It relies on Ops Manager for most of the automation tasks. You can either deploy Ops Manager in Kubernetes, using the Operator or you can integrate with Cloud Manager and avoid hosting Ops Manager. It provides CRDs for:
- Ops Manager (kind: [MongoDBOpsManager](https://www.mongodb.com/docs/kubernetes-operator/master/reference/k8s-operator-om-specification/))
- MongoDB clusters (kind: [MongoDB](https://www.mongodb.com/docs/kubernetes-operator/master/reference/k8s-operator-specification/)), including
- Standalone instances
- Replica Sets
- Sharded Clusters
- Users (kind: [MongoDBUser](https://www.mongodb.com/docs/kubernetes-operator/master/manage-users/#k8s-manage-db-users))

Add the MonboDB Helm repository and install Enterprise Operator:

```sh
helm repo add mongodb https://mongodb.github.io/helm-charts
helm install enterprise-operator \
    mongodb/enterprise-operator \
    --namespace mongodb \
    --create-namespace \
    --set installCRDs=true
```

### 2. Add more nodes and configure labels (OPTIONAL)
```sh
minikube node add
minikube node add

kubectl label nodes minikube-m02 kubernetes.io/e2e-az-name=e2e-az1
kubectl label nodes minikube-m03 kubernetes.io/e2e-az-name=e2e-az2
kubectl label nodes minikube kubernetes.io/e2e-az-name=e2e-az3
```

### 3. Setup Cloud Manager Configuration
Edit the `cloud-manager-config.yaml` fill the `orgId` and `projectName` properties and apply the configuration
```sh
kubectl apply -f cloud-manager-config.yaml --namespace mongodb
```
### 4. Setup Certificates
Refer to the [TLS README](certificates/readme.md) for instructions on setting up certificates.

### 5. Setup Credentials
Refer to the [Credentials README](credentials/readme.md) for instructions on setting up credentials.

### 6. Setup Backup
Refer to the [Backup README](backup/readme.md) for instructions on setting up backup.

### 7. Create the Replica-set
```sh
kubectl apply -f replica-set.yaml --namespace mongodb
```

#### 7.1. Check Pod Scheduling
Verify that the pods were scheduled as expected:
```sh
kubectl get pods -o wide --namespace mongodb
```

Expect result:
```sh
NAME                                           READY   STATUS
mongodb-enterprise-operator-69f48b84b8-ncqs9   1/1     Running
rs-0-0                                         1/1     Running
rs-0-1                                         1/1     Running 
rs-0-2                                         1/1     Running
```
It may take a few minutes for all pods up

### 8. Create the users
For testing purposes, passwords are literal, you can use the external secret technique to store the users password
```sh
kubectl create secret generic user1-secret --from-literal="password=123456" --namespace mongodb
kubectl create secret generic user2-secret --from-literal="password=123456" --namespace mongodb
kubectl create secret generic user3-secret --from-literal="password=123456" --namespace mongodb

kubectl apply -f users.yaml --namespace mongodb
```

### 9. Connect

#### 9.1 Inside kubernetes envrionment
1 - Get users credentials and connection string
```sh
kubectl get secret rs-0-admin-admin --namespace mongodb -o json | jq -r '.data | with_entries(.value |= @base64d)'
```

2 - Entrer in hosts
```sh
kubectl exec -it -n mongodb rs-0-0 -c mongodb-enterprise-database -- bash
```

3 - connect
```sh
/var/lib/mongodb-mms-automation/mongosh-linux-x86_64-2.2.4/bin/mongosh \
    --tls \
    --tlsCAFile /mongodb-automation/tls/ca/ca-pem \
    "mongodb+srv://admin:123456@rs-0-svc.mongodb.svc.cluster.local/admin?ssl=true"
```


### 9. Setup Monitoring (OPTIONAL)
Refer to the [Monitoring README](Monitoring/readme.md) for instructions on setting up Monitoring with Prometheus.

# Clean
```sh
kubectl delete MongoDB rs-0 --namespace mongodb
kubectl delete volumesnapshot --all --namespace mongodb
kubectl delete pvc --all --namespace mongodb
```

# References
 - [K8s Operator Specification](https://www.mongodb.com/docs/kubernetes-operator/master/reference/k8s-operator-specification/)
 - [MongoDB K8s Samples](https://github.com/mongodb/mongodb-enterprise-kubernetes/tree/master/samples/mongodb) 