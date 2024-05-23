# Open Telemtry

## Steps

### Installation
```sh
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm install opentelemetry-operator open-telemetry/opentelemetry-operator \
  --set "manager.collectorImage.repository=otel/opentelemetry-collector-k8s" \
  --set admissionWebhooks.certManager.enabled=false \
  --set admissionWebhooks.autoGenerateCert.enabled=true \
  --namespace opentelemetry \
  --create-namespace

```

### Create a New Backup
```sh
kubectl apply -f otel-collector-config.yaml -n opentelemetry
```

# References
 - [opentelemetry operator](https://github.com/open-telemetry/opentelemetry-operator)