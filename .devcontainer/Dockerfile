# syntax=docker/dockerfile:1
FROM debian:bookworm AS base

ARG APPDIR=/workspace
ARG CUSTOM_USERNAME=appuser
ARG USER_UID=1000
ARG USER_GID=$USER_UID
ARG HOME="/home/$CUSTOM_USERNAME"
ENV PATH="$HOME/.local/bin:$PATH"
WORKDIR $APPDIR

RUN rm -f /etc/apt/apt.conf.d/docker-clean; \
    echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache

# create user
RUN useradd -s /bin/bash -u $USER_UID -o -c "" -m $CUSTOM_USERNAME && \
    groupmod -g $USER_UID $CUSTOM_USERNAME

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt update \
    && apt install -y --no-install-recommends sudo \
    && echo $CUSTOM_USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$CUSTOM_USERNAME \
    && chmod 0440 /etc/sudoers.d/$CUSTOM_USERNAME

# base
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt update \
    && apt install -y --no-install-recommends openssh-client ca-certificates git git-lfs curl unzip

# audiowmark
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt update \
    && apt install -y automake autoconf libtool pkg-config \
      build-essential libfftw3-dev libsndfile1-dev libgcrypt-dev libzita-resampler-dev

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    curl -fsSL https://developer.download.nvidia.com/compute/cuda/repos/debian12/x86_64/3bf863cc.pub | gpg --dearmor -o /usr/share/keyrings/nvidia-cuda-archive-keyring.gpg \
    echo "deb [signed-by=/usr/share/keyrings/nvidia-cuda-archive-keyring.gpg] https://developer.download.nvidia.com/compute/cuda/repos/debian12/x86_64/ /" | sudo tee /etc/apt/sources.list.d/cuda.list \
    && curl -L https://developer.download.nvidia.com/compute/cuda/repos/debian12/x86_64/cuda-keyring_1.1-1_all.deb -o cuda-keyring_1.1-1_all.deb \
    && dpkg -i cuda-keyring_1.1-1_all.deb \
    && apt update \
    && apt install -y --no-install-recommends cuda-toolkit-13-0 cuda-toolkit-13-1 cuda-toolkit-13-2 \
    && rm cuda-keyring_1.1-1_all.deb

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt update \
    && apt install -y --no-install-recommends nvidia-driver-pinning-590 cuda-drivers

RUN export PATH=/usr/local/cuda/bin${PATH:+:${PATH}}
RUN export LD_LIBRARY_PATH=/usr/local/cuda-13.0/lib64:/usr/local/cuda-13.1/lib64:/usr/local/cuda-13.2/lib64${LD_LIBRARY_PATH:+${LD_LIBRARY_PATH}}

RUN update-alternatives --install /usr/local/cuda cuda /usr/local/cuda-13.2 12
RUN update-alternatives --install /usr/local/cuda cuda /usr/local/cuda-13.1 11
RUN update-alternatives --install /usr/local/cuda cuda /usr/local/cuda-13.0 10

USER $CUSTOM_USERNAME
RUN curl https://mise.run | sh
RUN echo 'eval "$(~/.local/bin/mise activate bash)"' >> ~/.bashrc

FROM base AS dev
