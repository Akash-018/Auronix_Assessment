// Arsenal of 55+ uplifting positive sentences for candidate performance encouragement
export const AffirmationsArsenal = [
  "Your dedication to writing clean, thoughtful code is truly commendable!",
  "Every line of code you write brings you closer to technical mastery.",
  "Your problem-solving skills show real grit, creativity, and brilliance.",
  "You approach complex challenges with remarkable calm and clarity.",
  "Your code architecture is structured, intuitive, and highly professional.",
  "Great job maintaining high standards and precision in your work!",
  "Your attention to detail makes your user interfaces shine effortlessly.",
  "You have a natural intuition for building smooth, responsive web applications.",
  "Your code readability and style are top-notch—keep up the fantastic work!",
  "Each completed test is a testament to your continuous growth and expertise.",
  "Your analytical thinking shines through every method you implement.",
  "You possess the mindset of a top-tier software engineer.",
  "Your commitment to learning and refining your craft is inspiring.",
  "You handle edge cases and logic with exceptional finesse and skill.",
  "Your solution design demonstrates depth, clarity, and true engineering strength.",
  "Fantastic progress! Your code is getting cleaner and sharper every single day.",
  "You turn complex specifications into elegant working code effortlessly.",
  "Your passion for web development is clearly reflected in your submissions.",
  "You are consistently building a strong foundation for technical excellence.",
  "Your code organization makes it a joy to review and evaluate.",
  "You have an outstanding ability to break down tough problems into manageable code.",
  "Keep pushing your boundaries—your potential in engineering is limitless!",
  "Your syntax discipline and structure set a wonderful standard.",
  "You bring positive momentum and high quality to every task you complete.",
  "Your code reflects patience, depth, and genuine developer craftsmanship.",
  "You are making steady, impressive strides toward mastering frontend engineering.",
  "Your logic flow is smooth, efficient, and well thought through.",
  "Awesome focus and determination! You make technical challenges look easy.",
  "Your work showcases both strong fundamental skills and creative flair.",
  "You should be proud of the high quality you bring to your projects.",
  "Your code displays great elegance, efficiency, and clarity of intent.",
  "Every test you finish proves your resilience and technical adaptability.",
  "You are rapidly expanding your problem-solving toolkit with great style.",
  "Your attention to clean visual standards and DOM logic is super impressive.",
  "You are building a stellar track record of high-performance coding.",
  "Your technical persistence is paying off in every single submission.",
  "You have a brilliant knack for clean function signatures and neat execution.",
  "Your enthusiasm for coding excellence is truly commendable!",
  "You write code that is clean, concise, and full of professional polish.",
  "Your mastery over HTML, CSS, and JS logic grows stronger with every attempt.",
  "You tackle coding assessments with poise, confidence, and agility.",
  "Your solutions highlight a deep and growing understanding of core concepts.",
  "Keep up this superb momentum—you are achieving remarkable milestone goals!",
  "Your debugging intuition and logical reasoning are absolute strengths.",
  "You craft software with both precision and an impressive eye for detail.",
  "Your consistency and drive to improve demonstrate a champion developer mindset.",
  "You make significant strides with every single line of code you complete.",
  "Your clean layout structures and modular code are inspiring to see.",
  "You demonstrate fantastic problem-solving velocity and technical poise.",
  "Your commitment to high standards guarantees a bright engineering future.",
  "You are turning every assessment into a display of skill and determination.",
  "Your code is well-structured, modern, and built to professional standards.",
  "Keep shining bright! Your dedication to software craftsmanship is unmatched.",
  "Your creative coding approach brings fresh energy to every challenge.",
  "You possess all the traits of a standout, high-caliber frontend developer!"
];

const RECENT_KEY = 'pixeltest_recent_affirmations_v1';
const MIN_UNIQUE_BEFORE_REPEAT = 35;

/**
 * Returns a random uplifting affirmation ensuring no sentence repeats 
 * until at least 35 unique sentences have been displayed.
 */
export function getNextAffirmation(): string {
  let recentIndices: number[] = [];
  try {
    const stored = localStorage.getItem(RECENT_KEY);
    if (stored) {
      recentIndices = JSON.parse(stored);
    }
  } catch (e) {
    recentIndices = [];
  }

  // Filter available indices not in the recent queue
  const availableIndices = AffirmationsArsenal.map((_, idx) => idx).filter(
    (idx) => !recentIndices.includes(idx)
  );

  let selectedIndex: number;

  if (availableIndices.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableIndices.length);
    selectedIndex = availableIndices[randomIndex];
  } else {
    // Fallback if all 55 used: pick oldest from queue or random
    const randomIndex = Math.floor(Math.random() * AffirmationsArsenal.length);
    selectedIndex = randomIndex;
  }

  // Update memory queue (keep maximum MIN_UNIQUE_BEFORE_REPEAT items)
  recentIndices.push(selectedIndex);
  if (recentIndices.length > MIN_UNIQUE_BEFORE_REPEAT) {
    recentIndices.shift();
  }

  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentIndices));
  } catch (e) {
    // Ignore storage issues
  }

  return AffirmationsArsenal[selectedIndex];
}
