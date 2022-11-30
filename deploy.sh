gcloud functions deploy message-bottle-bot \
  --entry-point=messageBottleBot \
  --gen2 \
  --region=europe-west2 \
  --runtime nodejs16 \
  --trigger-http \
  --env-vars-file .env.yaml \
  --ingress-settings all \
  --allow-unauthenticated
