FROM scratch

EXPOSE 8000/tcp
VOLUME ["/storage", "/users"]

ARG TARGETPLATFORM

ADD binaries/$TARGETPLATFORM/bulgur-cloud /

WORKDIR /

ENTRYPOINT ["/bulgur-cloud"]