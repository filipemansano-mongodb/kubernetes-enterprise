set -e

echo "getting secrets from admin user..."
CONNECTION_INFO=$(kubectl get secret rs-0-admin-admin -n mongodb -o json | jq  -r '.data | with_entries(.value |= @base64d)')

echo "getting the CA"
kubectl get secret mdb-rs-0-cert -n mongodb -o json | jq -r '.data["ca.crt"]' | base64 -d > ca.pem

echo "getting the hidden member"
HIDDEN_MEMBER=$(mongosh --tls --tlsCAFile ca.pem --eval 'rs.config().members.filter(member => member.tags.nodeType == "HIDDEN")[0].host' "$(echo $CONNECTION_INFO | jq -r '.["connectionString.standardSrv"]')")
USERNAME=$(echo $CONNECTION_INFO | jq -r '.["username"]')
PASSWORD=$(echo $CONNECTION_INFO | jq -r '.["password"]')

unlock_db() {
  echo "Unlocking the database..."
  mongosh --tls --tlsCAFile ca.pem --eval 'db.fsyncUnlock()' ${HIDDEN_MEMBER} --username $USERNAME --password $PASSWORD
}

trap unlock_db EXIT

mongosh --tls --tlsCAFile ca.pem --eval 'db.fsyncLock()' ${HIDDEN_MEMBER} --username $USERNAME --password $PASSWORD

echo "dumping database"
mongodump \
  --host=$HIDDEN_MEMBER \
  --username=$USERNAME \
  --password=$PASSWORD \
  --ssl \
  --sslCAFile=ca.pem \
  --authenticationDatabase=admin \
  --db=test \
  --out=/dump \
  --gzip

echo "dump completed successfully."

unlock_db()

tar -czvf bkp_teste.gz /dump/test

export AWS_ACCESS_KEY_ID=HEN3E13N2YF2GA2Q9Z9L
export AWS_SECRET_ACCESS_KEY=FNLEHxJBcWFn2tfny1E9QmZAuFOoLleblOQ2BtBv
export AWS_ENDPOINT_URL=http://minio.minio-operator.svc.cluster.local
export AWS_REGION=minio

aws --endpoint-url $AWS_ENDPOINT_URL s3 cp bkp_teste.gz s3://bkp-parcial/bkp_teste.gz