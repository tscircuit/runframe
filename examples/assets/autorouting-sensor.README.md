# Autorouting sensor fixture

`autorouting-sensor.tsx` is a real 20 × 16 mm I²C sensor breakout with an SOIC-8
chip, a decoupling capacitor, two pull-up resistors, and a four-pin header. It is
adapted from core's `fanout-soic8-sensor-to-i2c-header.test.tsx`. A fanout pass
routes the sensor group, and a named **Global routing** phase connects the board.

`autorouting-sensor.json` contains the resulting circuit JSON and deep copies of
the real `autorouting:start` and `autorouting:end` payloads. The capture records
the event channel explicitly because some core versions omit `type` on start
payloads. No routing geometry or phase metadata is synthesized.

Regenerate it from the repository root with the locked dependencies installed:

```sh
bun run scripts/generate-autorouting-fixture.ts
```

The generator requires at least two successful input/output pairs and records
the core version. The current recording has five components, 13 final traces,
two vias, and no PCB trace errors. The fanout output has six traces; the global
input contains those six preloaded traces and its output supplies seven more.
This exercises both historical routing context and phase output reconstruction.

The **Recorded sensor breakout** Cosmos fixture reads this capture without
running a worker or fetching circuit data. The **Live sensor breakout** fixture
passes the same TSX source to RunFrame and captures a fresh run through its normal
worker path. It uses RunFrame's normal eval version selection and requires the
worker to load successfully.
