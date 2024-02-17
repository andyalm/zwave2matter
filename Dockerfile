FROM node:20-slim AS build

ADD . /app
WORKDIR /app

RUN npm update -g npm && \
    npm install && \
    npm run build

FROM node:20-slim

COPY --from=build /app/dist /app
WORKDIR /app
ENV MATTER_BRIDGE_STORAGE_PATH=/app/data

RUN echo '#!/bin/bash' >> zwave2matter && \
    echo '' >> zwave2matter && \
    echo 'node zwave2matter.js "$@"' >> zwave2matter && \
    chmod +x zwave2matter

ENV PATH="/app:${PATH}"

CMD ["zwave2matter", "matter-bridge"]
