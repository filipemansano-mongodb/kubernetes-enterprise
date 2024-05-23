# Backup Kubernetes with Velero
This guide outlines the steps to configure Velero for backups in a Minikube environment using MinIO as the storage backend.

## Steps

### Install Velero
Download the Velero binary from the Velero [GitHub Releases](https://github.com/vmware-tanzu/velero/releases/tag/v1.13.2)


### Installation
Create a file named `credentials-velero` with the following content:
```sh
[default]
aws_access_key_id = <YOUR_MINIO_ACCESS_KEY>
aws_secret_access_key = <YOUR_MINIO_SECRET_KEY>
```
Replace `<YOUR_MINIO_ACCESS_KEY>` and `<YOUR_MINIO_SECRET_KEY>` with the actual access key and secret key generated during the MinIO tenant setup.

```sh
velero install \
 --provider aws \
 --plugins velero/velero-plugin-for-aws:v1.9.2 \
 --bucket velero-mdb-ent-test \
 --secret-file ./credentials-velero \
 --snapshot-location-config region=minio \
 --backup-location-config region=minio,s3ForcePathStyle="true",s3Url=http://minio.minio-operator.svc.cluster.local
```

### Create a New Backup
Here we will create a backup of mongodb namespace with all configuration
```sh
velero backup create backup-teste --include-namespaces mongodb
velero backup get backup-teste
```

### Restore
```sh
velero restore create --from-backup backup-teste
```

### Scheduling backup
```sh
velero schedule create mongodb-daily --schedule="0 1 * * *" --selector app=rs-0
```

### Backup filesystem
https://velero.io/docs/v1.13/file-system-backup/

# References
 - [Velero - Getting started](https://velero.io/docs/v1.0.0/get-started/)