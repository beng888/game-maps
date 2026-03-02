export interface GameConfig {
  id: number;
  name: string;
  slug: string;
  tileBaseUrl: string;
  defaultBounds: [number, number, number, number];
  maps: MapConfig[];
}

export interface MapConfig {
  id: number;
  name: string;
  slug: string;
  tilePath: string;
  defaultCenter: [number, number];
  defaultZoom: number;
  description?: string;
}

// This will be populated from the database, but here's a fallback
export const defaultGameConfig: GameConfig = {
  id: 1,
  name: "Fallout New Vegas",
  slug: "fallout-new-vegas",
  tileBaseUrl: "https://tiles.mapgenie.io/games",
  defaultBounds: [-1.4, 0, 0, 1.4],
  maps: [
    {
      id: 1,
      name: "Mojave Wasteland",
      slug: "mojave-wasteland",
      tilePath: "fallout-new-vegas/mojave-wasteland/default-v2",
      defaultCenter: [-0.79407843012208, 0.70144020169235],
      defaultZoom: 11,
      description: "The main desert region of the Mojave Wasteland",
    },
    {
      id: 2,
      name: "Sierra Madre",
      slug: "sierra-madre",
      tilePath: "fallout-new-vegas/sierra-madre/default-v1",
      defaultCenter: [-0.8593568483393, 0.71132050351143],
      defaultZoom: 10,
      description: "The treacherous Sierra Madre casino and surrounding area",
    },
    {
      id: 3,
      name: "Zion Canyon",
      slug: "zion-canyon",
      tilePath: "fallout-new-vegas/zion-canyon/default-v1",
      defaultCenter: [-0.80437288889794, 0.64827011938249],
      defaultZoom: 11,
      description: "The beautiful and dangerous Zion National Park",
    },
    {
      id: 4,
      name: "Big MT",
      slug: "big-mt",
      tilePath: "fallout-new-vegas/big-mt/default-v1",
      defaultCenter: [-0.82521207715246, 0.72249280811974],
      defaultZoom: 11,
      description: "The Big Empty research facility",
    },
    {
      id: 5,
      name: "The Divide",
      slug: "the-divide",
      tilePath: "fallout-new-vegas/the-divide/default-v1",
      defaultCenter: [-0.8043821638268, 0.74278153843068],
      defaultZoom: 12,
      description: "The destructive and mysterious Divide",
    },
  ],
};
