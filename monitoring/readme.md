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

### 3. Forward grafana port to access locally

username: admin

to get the password run the command below
```sh
kubectl get secret --namespace prometheus prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 --decode
```

```sh
 kubectl port-forward --namespace prometheus service/prometheus-grafana 8080:80
```