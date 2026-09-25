import React from "react";
import { Series } from "remotion";
import { Scene1Hook } from "./Scene1Hook";
import { Scene2Explore } from "./Scene2Explore";
import { Scene3Challenge } from "./Scene3Challenge";
import { Scene4Reveal } from "./Scene4Reveal";
import { Scene5Master } from "./Scene5Master";

export const SCENE_DURATIONS = {
  hook: 150,
  explore: 180,
  challenge: 180,
  reveal: 240,
  master: 150,
};

export const Sim5StatuePedestal: React.FC = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.hook}>
        <Scene1Hook />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.explore}>
        <Scene2Explore />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.challenge}>
        <Scene3Challenge />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.reveal}>
        <Scene4Reveal />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.master}>
        <Scene5Master />
      </Series.Sequence>
    </Series>
  );
};
