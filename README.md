# zwave2matter

This is my attempt at building a matter bridge that exposes zwave devices exposed from a [zwave-js server](https://github.com/zwave-js/zwave-js-server) as matter devices. It's currently very early in the development cycle, but I do have it working with a few of my leviton switches, which are exposed as binary switches in zwave. I plan to soon add support for dimmers as well. Contributions are welcome, because I can only test devices that I have.

## Getting started

My recommended way to run this app is with docker. I have it running on my raspberry pi, the same pi that is also running my zwave-js server. Here's an example `docker-compose.yml` file:

```yaml
version: '3'
services:
  zwave2matter:
    container_name: zwave2matter
    image: ghcr.io/andyalm/zwave2matter
    volumes:
      - "/home/my-user/apps/zwave2matter/data:/app/data"
    restart: unless-stopped
    network_mode: host
    environment:
      TZ: America/Los_Angeles
      ZWAVE_ENDPOINT: 0.0.0.0:3000
      MATTER_BRIDGE_MDNS_INTERFACE: eth0
```

The `ZWAVE_ENDPOINT` should point to the ip address and port that your ZWAVE JS server's websocket endpoint is running on. The `MATTER_BRIDGE_MDNS_INTERFACE` should be the name of the network interface that you want to use for mDNS. This is important because the matter bridge uses mDNS to advertise itself on the network. If you're running this on a raspberry pi, you can find the name of the network interface by running `ifconfig`. It's usually `eth0` or `wlan0`.

The volume mount above is mounting the `/app/data` folder inside of the container with a data directory on my host computer. This is recommended so that the state that gets saved by the matter bridge is persisted across restarts and/or in case you need to re-create your docker container.

## Why does this exist?

1. Because its an interesting challenge to me, and I'm interested in it
2. I have a bunch of zwave devices in my house. They are rock solid and reliable. I have no interest in replacing them. But as matter becomes a more universal standard, I want to be able to control them from as many different devices as possible. While I have currently exposed my Home Assistant instance to Google Home, doing so was a giant pain. Furthermore, I would also like to expose them to my Apple devices (via Apple Home), Alexa, etc. All of these ecosystems support Matter, but not necessarily zwave. I looked around on the internet to see if a zwave to matter bridge already existed, specifically one that would work with zwave-js, but could not find anything. So I decided to build it myself.

## Credits

This project heavily leverages the work of [matter.js](https://github.com/project-chip/matter.js) and [zwave-js](https://github.com/zwave-js/zwave-js-server). Both of those projects are amazing and have made it relatively simple for me to glue them together to get this project off the ground.
