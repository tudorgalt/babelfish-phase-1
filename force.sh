#!/bin/bash

while :
do
    yarn script:rsk snapshot_list || true
	sleep 3
done
