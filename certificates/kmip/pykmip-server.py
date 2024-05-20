from kmip.services.server import KmipServer
import logging

if __name__ == "__main__":

    ciphers = [
        'TLS_RSA_WITH_AES_256_GCM_SHA384',
        'TLS_RSA_WITH_AES_128_GCM_SHA256',
        'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
        'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256'
    ]

    server = KmipServer(
        hostname="0.0.0.0",
        port=5696,
        certificate_path="server.pem",
        key_path="server.key",
        ca_path="ca.pem",
        config_path=None,
        logging_level=logging.DEBUG,
        auth_suite='TLS1.2',
        enable_tls_client_auth=True,
        tls_cipher_suites=",".join(ciphers)
    )

    with server:
        print ("Starting KMS KMIP server")
        server.serve()