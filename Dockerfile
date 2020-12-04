FROM node:15 AS build

COPY . /smartmeter2mqtt

# Unfortunately, there is no `npm prune` for yarn yet, so install packages twice
RUN cd /smartmeter2mqtt \
    && yarn install \
    && yarn build \
    && chmod +x dist/main.js \
    && rm -r node_modules \
    && yarn install --production


FROM node:15-alpine

COPY --from=build /smartmeter2mqtt/dist/main.js /smartmeter2mqtt/
COPY --from=build /smartmeter2mqtt/node_modules/ /smartmeter2mqtt/node_modules/

RUN ln -s /smartmeter2mqtt/main.js /usr/local/bin/smartmeter2mqtt

ENTRYPOINT [ "smartmeter2mqtt" ]