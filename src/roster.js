export const SCENES = ["jungle", "backyard"];

export const ROSTER = [
  // Scene 1 — Jungle
  {
    id: "lion",
    scene: "jungle",
    englishWord: "Lion",
    voicePath: "assets/voice/lion.mp3",
    soundPath: "assets/sounds/lion-roar.mp3",
    position: { left: 14, bottom: 18 },
    scale: 1.0,
    zIndex: 3
  },
  {
    id: "zebra",
    scene: "jungle",
    englishWord: "Zebra",
    voicePath: "assets/voice/zebra.mp3",
    soundPath: "assets/sounds/zebra-neigh.mp3",
    position: { left: 32, bottom: 22 },
    scale: 0.95,
    zIndex: 2
  },
  {
    id: "hippo",
    scene: "jungle",
    englishWord: "Hippo",
    voicePath: "assets/voice/hippo.mp3",
    soundPath: "assets/sounds/hippo-grunt.mp3",
    position: { left: 50, bottom: 8 },
    scale: 1.1,
    zIndex: 4
  },
  {
    id: "giraffe",
    scene: "jungle",
    englishWord: "Giraffe",
    voicePath: "assets/voice/giraffe.mp3",
    soundPath: "assets/sounds/giraffe-bleat.mp3",
    position: { left: 72, bottom: 25 },
    scale: 1.05,
    zIndex: 2
  },
  {
    id: "lemur",
    scene: "jungle",
    englishWord: "Lemur",
    voicePath: "assets/voice/lemur.mp3",
    soundPath: "assets/sounds/lemur-chatter.mp3",
    position: { left: 86, bottom: 12 },
    scale: 0.85,
    zIndex: 3
  },
  {
    id: "natan-jungle",
    scene: "jungle",
    englishWord: "Natan",
    voice: "br-pt",
    voicePath: "assets/voice/natan.mp3",
    soundPath: "assets/sounds/natan-giggle.mp3",
    spritePath: "assets/images/natan-jungle.png",
    position: { left: 50, bottom: 12 },
    scale: 1.0,
    zIndex: 5
  },
  // Scene 2 — Backyard
  {
    id: "cow",
    scene: "backyard",
    englishWord: "Cow",
    voicePath: "assets/voice/cow.mp3",
    soundPath: "assets/sounds/cow-moo.mp3",
    position: { left: 14, bottom: 20 },
    scale: 1.0,
    zIndex: 2
  },
  {
    id: "dog",
    scene: "backyard",
    englishWord: "Dog",
    voicePath: "assets/voice/dog.mp3",
    soundPath: "assets/sounds/dog-bark.mp3",
    position: { left: 32, bottom: 12 },
    scale: 0.9,
    zIndex: 4
  },
  {
    id: "natan-backyard",
    scene: "backyard",
    englishWord: "Natan",
    voice: "br-pt",
    voicePath: "assets/voice/natan.mp3",
    soundPath: "assets/sounds/natan-giggle.mp3",
    spritePath: "assets/images/natan-backyard.png",
    position: { left: 48, bottom: 12 },
    scale: 1.0,
    zIndex: 5
  },
  {
    id: "cat",
    scene: "backyard",
    englishWord: "Cat",
    voicePath: "assets/voice/cat.mp3",
    soundPath: "assets/sounds/cat-meow.mp3",
    position: { left: 62, bottom: 10 },
    scale: 0.85,
    zIndex: 3
  },
  {
    id: "bird",
    scene: "backyard",
    englishWord: "Bird",
    voicePath: "assets/voice/bird.mp3",
    soundPath: "assets/sounds/bird-tweet.mp3",
    position: { left: 80, bottom: 50 },
    scale: 0.7,
    zIndex: 2
  },
  {
    id: "turtle",
    scene: "backyard",
    englishWord: "Turtle",
    voicePath: "assets/voice/turtle.mp3",
    soundPath: "assets/sounds/turtle-splash.mp3",
    position: { left: 88, bottom: 8 },
    scale: 0.8,
    zIndex: 4
  }
];
