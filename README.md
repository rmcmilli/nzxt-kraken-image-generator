# NZXT Kraken Z Series image generator

This is a quick and dirty proof of concept, made possible by the
amazing work done by [LiquidCTL](https://github.com/liquidctl/liquidctl)
and especially the work done on supporting NZXT Kraken Series Z LCD screen:
https://github.com/liquidctl/liquidctl/pull/479.

**Metrics only work on MacOS and requires you to install Intel Power Gadget app.**

![generated.gif](/images/example.gif)

#### Generate image

```sh
node ./generate.js
```

If you want to generate it indefinetly to make local development easy :

```sh
while [ 1 ]; do; node ./generate.js; sleep 1; done
```

To display metrics as a table :

```sh
node ./metrics.js
```
