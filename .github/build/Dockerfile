FROM node:16 AS build

RUN mkdir /smartmeter2mqtt \
 && cd /smartmeter2mqtt \
 && yarn add @pkwagner/smartmeter2mqtt


FROM node:16

COPY --from=build /smartmeter2mqtt /smartmeter2mqtt

ENV PATH=/smartmeter2mqtt/node_modules/.bin:${PATH}

ENTRYPOINT [ "smartmeter2mqtt", "/smartmeter2mqtt/config.json" ]
