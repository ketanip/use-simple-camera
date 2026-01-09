import { useEffect, useState } from "react";

export type OrientationType = "portrait" | "landscape";

export const useOrientation = () => {
  const [orientation, setOrientation] = useState<OrientationType>("portrait");
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    const updateOrientation = () => {
      // Safety check for SSR / JSDOM
      if (!window.screen?.orientation) return;

      const type = window.screen.orientation.type;
      const angle = window.screen.orientation.angle;

      setAngle(angle);
      if (type.includes("portrait")) {
        setOrientation("portrait");
      } else {
        setOrientation("landscape");
      }
    };

    updateOrientation();

    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener("change", updateOrientation);
      return () => {
        window.screen.orientation.removeEventListener(
          "change",
          updateOrientation,
        );
      };
    }
  }, []);

  return { orientation, angle };
};
