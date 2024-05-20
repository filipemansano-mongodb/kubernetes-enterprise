FROM python:3.9

RUN pip install pykmip

COPY ca_cert.pem /app/ca.pem
COPY server_cert.pem /app/server.pem
COPY server_key.pem /app/server.key
COPY pykmip-server.py /app/pykmip-server.py

WORKDIR /app

EXPOSE 5696

CMD ["python", "pykmip-server.py"]