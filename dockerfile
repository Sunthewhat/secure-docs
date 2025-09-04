FROM imbios/bun-node as builder

WORKDIR /mnt

COPY . .

RUN bun i

RUN bun run build

FROM thistine/simple-http-server as runner

WORKDIR /mnt

COPY --from=builder /mnt/dist ./static

ENTRYPOINT [ "/app/serviceapifrontend" ]

EXPOSE 4000