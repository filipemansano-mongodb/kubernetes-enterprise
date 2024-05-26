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

### Create collector
```sh
kubectl apply -f otel-collector-config.yaml -n opentelemetry
```

### Demo
Run the application on demo folder

1 - Create the application
```sh
cd test
docker build -t app-test .
docker tag app-test localhost:5000/app-test
docker push localhost:5000/app-test
kubectl apply -f app.yaml --namespace mongodb
```

2 - Enter inside the pod and execute the command below 
```curl
curl --location '127.0.0.1:3000/' \
--header 'Content-Type: application/json' \
--data '{
    "database": "test",
    "collection": "people",
    "operation": "find",
    "data": {
        "name": "user"
    }
}'
```

3 - Check the log on collector pod

Expect result
```sh
ScopeSpans #0
ScopeSpans SchemaURL: 
InstrumentationScope mongodb-example 
Span #0
    Trace ID       : bad3474e823e8f29f0b17f9014e98ccc
    Parent ID      : b1e6fc87ac0932d7
    ID             : b966106fb8448dd7
    Name           : MongoDB - commandStarted
    Kind           : Internal
    Start time     : 2024-05-26 06:52:26.448 +0000 UTC
    End time       : 2024-05-26 06:52:26.4530781 +0000 UTC
    Status code    : Unset
    Status message : 
Attributes:
     -> name: Str(commandStarted)
     -> address: Str([::1]:27017)
     -> connectionId: Int(1)
     -> requestId: Int(6)
     -> databaseName: Str(test)
     -> commandName: Str(find)
     -> command: Str({"find":"people","filter":{"name":"user"},"lsid":{"id":"bNS/jtPsQsy8QKpoUr6asA=="},"$clusterTime":{"clusterTime":{"$timestamp":"7373197569955987457"},"signature":{"hash":"AjSg7N4i2JO+0tFO1MFYgpdeNvQ=","keyId":{"low":6,"high":1716699645,"unsigned":false}}},"$readPreference":{"mode":"primaryPreferred"},"$db":"test"})
Span #1
    Trace ID       : bad3474e823e8f29f0b17f9014e98ccc
    Parent ID      : b1e6fc87ac0932d7
    ID             : 647f0300ea9bf734
    Name           : New Request
    Kind           : Internal
    Start time     : 2024-05-26 06:52:26.445 +0000 UTC
    End time       : 2024-05-26 06:52:26.4574128 +0000 UTC
    Status code    : Unset
    Status message : 
ScopeSpans #1
ScopeSpans SchemaURL: 
InstrumentationScope @opentelemetry/instrumentation-http 0.48.0
Span #0
    Trace ID       : bad3474e823e8f29f0b17f9014e98ccc
    Parent ID      : 
    ID             : b1e6fc87ac0932d7
    Name           : POST
    Kind           : Server
    Start time     : 2024-05-26 06:52:26.43 +0000 UTC
    End time       : 2024-05-26 06:52:26.4578154 +0000 UTC
    Status code    : Unset
    Status message : 
Attributes:
     -> http.url: Str(http://127.0.0.1:3000/)
     -> http.host: Str(127.0.0.1:3000)
     -> net.host.name: Str(127.0.0.1)
     -> http.method: Str(POST)
     -> http.scheme: Str(http)
     -> http.target: Str(/)
     -> http.user_agent: Str(PostmanRuntime/7.39.0)
     -> http.request_content_length_uncompressed: Int(142)
     -> http.flavor: Str(1.1)
     -> net.transport: Str(ip_tcp)
     -> net.host.ip: Str(::ffff:127.0.0.1)
     -> net.host.port: Int(3000)
     -> net.peer.ip: Str(::ffff:127.0.0.1)
     -> net.peer.port: Int(64875)
     -> http.status_code: Int(200)
     -> http.status_text: Str(OK)
```


# References
 - [opentelemetry operator](https://github.com/open-telemetry/opentelemetry-operator)