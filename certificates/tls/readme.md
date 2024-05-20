# Configuring TLS Certificates for MongoDB

This guide outlines the steps to configure TLS certificates for use with MongoDB.

## Files Overview

### 1. mongodb-cluster-issuer.yaml

This file defines an Issuer named `ca-issuer` specific to the MongoDB namespace. It references the CA certificate created by `selfsigned-issuer` to issue certificates within the MongoDB namespace.

### 2. mongodb-cluster-certificate.yaml

This file creates a TLS certificate for a MongoDB replica set within the MongoDB namespace. It references the `ca-issuer` to issue the certificate and defines the DNS names, duration, and other settings for the certificate.

## Steps

### 1. Create the Issuer:
Apply the `mongodb-cluster-issuer.yaml` to create the Issuer specific to the MongoDB namespace:
```sh
kubectl apply -f mongodb-cluster-issuer.yaml
```

### 2. Create the certificate to MongoDB Cluster:
Apply the `mongodb-cluster-certificate.yaml` to create the TLS certificate for MongoDB replica set

> change the `rs-0` to the name you will define for your replica set cluster in the yaml file

```sh
kubectl apply -f mongodb-cluster-certificate.yaml --namespace mongodb
```

### 3. Create the certificate for OpsManager agents:
```sh
kubectl apply -f opsmanager-agent-certificate.yaml --namespace mongodb
```

### 4. Check if the certificate is READY
```sh
kubectl get certificate rs-0-certificate agent-certs --namespace mongodb
```

#### Expected result:
```sh
NAME               READY   SECRET          AGE
rs-0-certificate   True    mdb-rs-0-cert          13s
agent-certs        True    mdb-rs-0-agent-certs   13s
```

### TODO
-  Usar o Prometheus para coletar métricas relacionadas aos certificados, como datas de expiração e configure alertas no Prometheus para notificar quando um certificado estiver próximo da expiração.