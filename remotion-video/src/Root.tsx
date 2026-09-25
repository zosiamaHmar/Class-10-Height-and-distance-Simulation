import "./index.css";
import { Composition, Folder } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { Logo } from "./HelloWorld/Logo";
import { Sim5StatuePedestal, SCENE_DURATIONS } from "./Sim5StatuePedestal";
import { Scene1Hook } from "./Sim5StatuePedestal/Scene1Hook";
import { Scene2Explore } from "./Sim5StatuePedestal/Scene2Explore";
import { Scene3Challenge } from "./Sim5StatuePedestal/Scene3Challenge";
import { Scene4Reveal } from "./Sim5StatuePedestal/Scene4Reveal";
import { Scene5Master } from "./Sim5StatuePedestal/Scene5Master";

const totalSim5Duration = Object.values(SCENE_DURATIONS).reduce(
  (a, b) => a + b,
  0,
);

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        // You can take the "id" to render a video:
        // npx remotion render HelloWorld
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        // You can override these props for each render:
        // https://www.remotion.dev/docs/parametrized-rendering
        defaultProps={{
          titleText: "Welcome to Remotion",
          titleColor: "#000000",
          logoColor1: "#91EAE4",
          logoColor2: "#86A8E7",
        }}
      />

      {/* Mount any React component to make it show up in the sidebar and work on it individually! */}
      <Composition
        id="OnlyLogo"
        component={Logo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          logoColor1: "#91dAE2",
          logoColor2: "#86A8E7",
        }}
      />

      <Folder name="Sim5-StatuePedestal-Scenes">
        <Composition
          id="Sim5-Scene1-Hook"
          component={Scene1Hook}
          durationInFrames={SCENE_DURATIONS.hook}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Sim5-Scene2-Explore"
          component={Scene2Explore}
          durationInFrames={SCENE_DURATIONS.explore}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Sim5-Scene3-Challenge"
          component={Scene3Challenge}
          durationInFrames={SCENE_DURATIONS.challenge}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Sim5-Scene4-Reveal"
          component={Scene4Reveal}
          durationInFrames={SCENE_DURATIONS.reveal}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Sim5-Scene5-Master"
          component={Scene5Master}
          durationInFrames={SCENE_DURATIONS.master}
          fps={30}
          width={1920}
          height={1080}
        />
      </Folder>

      <Composition
        id="Sim5StatuePedestal"
        component={Sim5StatuePedestal}
        durationInFrames={totalSim5Duration}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
