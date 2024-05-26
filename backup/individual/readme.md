### Demo
Run the application on demo folder

1 - Create the application
```sh
docker build -t cron-app .
docker tag cron-app localhost:5000/cron-app
docker push localhost:5000/cron-app
```

# open in a new terminal
```sh
kubectl apply -f shell-access.yaml --namespace mongodb
```