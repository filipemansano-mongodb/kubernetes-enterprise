echo "Cleaning up old snapshots, keeping only the last 5..."

SNAPSHOTS_TO_KEEP=5
SNAPSHOTS=$(kubectl get volumesnapshots -n mongodb --sort-by=.metadata.creationTimestamp -o jsonpath='{.items[*].metadata.name}')
SNAPSHOT_COUNT=$(echo $SNAPSHOTS | wc -w)

if [ $SNAPSHOT_COUNT -gt $SNAPSHOTS_TO_KEEP ]; then
  SNAPSHOTS_TO_DELETE=$(echo $SNAPSHOTS | awk "{for(i=1;i<=$SNAPSHOT_COUNT-$SNAPSHOTS_TO_KEEP;i++)print \$i}")
  for SNAPSHOT in $SNAPSHOTS_TO_DELETE; do
    echo "Deleting old snapshot $SNAPSHOT..."
    kubectl delete volumesnapshot $SNAPSHOT -n mongodb
  done
fi