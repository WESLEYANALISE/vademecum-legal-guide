import { Composition } from "remotion";
import { Segment1 } from "./scenes/Segment1";
import { Segment2 } from "./scenes/Segment2";
import { Segment3 } from "./scenes/Segment3";
import { Segment4 } from "./scenes/Segment4";
import { Segment5 } from "./scenes/Segment5";
import { Segment6 } from "./scenes/Segment6";

const FPS = 30;
const W = 1920;
const H = 1080;

export const RemotionRoot = () => (
  <>
    <Composition id="segment-1" component={Segment1} durationInFrames={3000} fps={FPS} width={W} height={H} />
    <Composition id="segment-2" component={Segment2} durationInFrames={3000} fps={FPS} width={W} height={H} />
    <Composition id="segment-3" component={Segment3} durationInFrames={3000} fps={FPS} width={W} height={H} />
    <Composition id="segment-4" component={Segment4} durationInFrames={3000} fps={FPS} width={W} height={H} />
    <Composition id="segment-5" component={Segment5} durationInFrames={3000} fps={FPS} width={W} height={H} />
    <Composition id="segment-6" component={Segment6} durationInFrames={3000} fps={FPS} width={W} height={H} />
  </>
);
