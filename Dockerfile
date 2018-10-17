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

RUN apt install -y zlib1g-dev

RUN apt install -y autoconf2.13 sshpass p7zip-full python-dev

RUN export MC_COMMIT='f66e525e6978'
RUN curl https://bootstrap.pypa.io/get-pip.py | python
ADD bin /setup/bin/
RUN apt install -y mercurial

RUN /setup/bin/ci/clone-gecko.sh

