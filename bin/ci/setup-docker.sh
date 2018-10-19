lines=`curl -s https://hub.docker.com/r/$DOCKER_USERNAME/$DOCKER_IMAGE/tags/ | grep $MC_COMMIT | wc -l`
if [[ $lines -eq 0 ]];
then
    echo "Docker image does not exist for this commit, trying to build"
    echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin
    docker build -t $DOCKER_USERNAME/$DOCKER_IMAGE:$MC_COMMIT . &
    while [ -e /proc/$! ]; do echo -n "."  && sleep 60; done
    docker push $DOCKER_USERNAME/$DOCKER_IMAGE:$MC_COMMIT

else
    echo "Docker image exists"
fi