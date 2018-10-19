FROM ubuntu:16.04
RUN apt update && \
    apt install -y curl python-software-properties && \
    curl -sL https://deb.nodesource.com/setup_9.x | bash -
RUN apt install -y gcc g++ make git && \
    curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt update && apt install -y nodejs yarn

RUN apt install -y make build-essential libssl-dev zlib1g-dev libbz2-dev \
libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev libncursesw5-dev \
xz-utils tk-dev libffi-dev liblzma-dev

RUN apt install -y zlib1g-dev unzip zip autoconf2.13 sshpass p7zip-full python-dev
RUN curl https://bootstrap.pypa.io/get-pip.py | python
RUN apt install -y mercurial

ENV SHELL /bin/bash 
ADD bin /setup/bin/

# it will need MC_COMMIT var from the environment
RUN /setup/bin/ci/clone-gecko.sh
RUN /setup/bin/ci/build-firefox.sh

WORKDIR /app