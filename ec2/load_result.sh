#!/bin/bash
set -e
i=0
public_bucket="image-search-public"
private_bucket="image-search-repository"
manifest="image_search.out"

while read line
do
  if [ $i -gt 0 ]; then
    if [ $line ]; then
#      echo $input/$line
      aws s3 cp s3://$private_bucket/geological_train/$line s3://$public_bucket/results/$input/$line
    fi
  else
    input=$line
    aws s3 rm s3://$public_bucket/results/$input/ --recursive
  fi
#  echo $i
  i=$(( $i+1 ))
done < $manifest