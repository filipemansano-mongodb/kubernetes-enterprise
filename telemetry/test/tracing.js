const api = require("@opentelemetry/api");
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { Resource } = require('@opentelemetry/resources');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');

const setupTracing = (serviceName) => {
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName
    })
  });

  // Initialize the OpenTelemetry APIs to use the NodeTracerProvider bindings
  provider.register();
  
  const traceExporter = new OTLPTraceExporter({
    url: 'http://collector-collector.opentelemetry.svc.cluster.local:4317',
    //url: 'http://localhost:4317',
  });

  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation(),
    ],
    tracerProvider: provider,
  });

  provider.addSpanProcessor(new BatchSpanProcessor(traceExporter));

  return api.trace.getTracer('mongodb-example');
};

module.exports = { setupTracing };