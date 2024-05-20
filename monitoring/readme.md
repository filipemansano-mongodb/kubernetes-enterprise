# Configuring Monitoring with Prometheus

This guide outlines the steps to configure Prometheus Operator.

## Steps

### 1. Install Prometheus Operator

```sh
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace prometheus \
  --create-namespace
```

### 2. Create the service monitor
```sh
kubectl apply -f service-monitor.yaml --namespace mongodb
```