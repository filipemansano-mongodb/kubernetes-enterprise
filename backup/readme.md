# Backup outside CloudManager with Minikube

This guide outlines the steps to configure snapshot backups with minikube.

## Steps

### 1. Enable addons
Enable volumesnapshots and csi-hostpath-driver addons:
```sh
minikube addons enable volumesnapshots
minikube addons enable csi-hostpath-driver
```

#### 1.1 Change default storage class (OPTIONAL)
Optionally you could use it as a default storage class for the dynamic volume claims:
```sh
minikube addons disable storage-provisioner
minikube addons disable default-storageclass
kubectl patch storageclass csi-hostpath-sc -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
```

### 2. Check volume snapshot class
When you create the volume snapshot, you have to register Volume Snapshot Classes to your cluster. 
The default VolumeSnapshotClass called csi-hostpath-snapclass is already registered by csi-hostpath-driver addon. 
You can check the VolumeSnapshotClass by the following command:

```sh
kubectl get volumesnapshotclasses
kubectl get storageclass
```

### 3. Registre the cronjob
Apply the commands below to register the cron job to take the snapshot periodically
```sh
kubectl apply -f role.yaml --namespace mongodb
kubectl apply -f cron-job.yaml --namespace mongodb
```

### 4. Restore from volume snapshot
You can restore persistent volume from your volume snapshot:
```sh
kubectl get volumesnapshot --namespace mongodb
kubectl apply -f restore-snapshot.yaml --namespace mongodb
kubectl describe pvc restored-mongodb-pvc --namespace mongodb
```

# References
 - [CSI Driver and Volume Snapshots](https://minikube.sigs.k8s.io/docs/tutorials/volume_snapshots_and_csi/)
 - [Back up Instances with Journal Files on Separate Volume or without Journaling](https://www.mongodb.com/docs/manual/tutorial/backup-with-filesystem-snapshots/#back-up-instances-with-journal-files-on-separate-volume-or-without-journaling)
