import "./index.css";
import { Composition } from "remotion";
import { MainVideo, calculateMainVideoMetadata, mainVideoSchema } from "./compositions/MainVideo";

// Both compositions read the same edit (public/edit/edit.json); only the frame differs.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainVideo"
        component={MainVideo}
        schema={mainVideoSchema}
        defaultProps={{}}
        calculateMetadata={calculateMainVideoMetadata}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="MainVideoVertical"
        component={MainVideo}
        schema={mainVideoSchema}
        defaultProps={{}}
        calculateMetadata={calculateMainVideoMetadata}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
