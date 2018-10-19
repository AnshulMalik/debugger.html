FROM malikanshul29/debugger:base
RUN apt install -y unzip zip
ENV SHELL /bin/bash 
RUN /setup/bin/ci/build-firefox.sh
