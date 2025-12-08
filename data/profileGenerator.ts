import { CandidateProfile } from '../types';

const NAMES_FEMALE = [
  "Elara", "Maya", "Chloe", "Sarah", "Zoe", "Priya", "Jordan", "Aiko", "Isabella", "Luna", 
  "Mia", "Harper", "Evelyn", "Aria", "Ella", "Ava", "Amelia", "Sofia", "Camila", "Layla",
  "Nora", "Riley", "Lily", "Eleanor", "Hannah", "Lillian", "Addison", "Aubrey", "Ellie", "Stella"
];

const NAMES_MALE = [
  "Liam", "Noah", "Oliver", "Elijah", "James", "William", "Benjamin", "Lucas", "Henry", "Alexander",
  "Mason", "Michael", "Ethan", "Daniel", "Jacob", "Logan", "Jackson", "Levi", "Sebastian", "Mateo",
  "Jack", "Owen", "Theodore", "Aiden", "Samuel", "Joseph", "John", "David", "Wyatt", "Matthew"
];

const BIO_INTRO = [
  "Digital nomad and visual artist.",
  "Med student with a passion for sustainable living.",
  "High energy, adrenaline junkie.",
  "Librarian and amateur historian.",
  "Social media manager and fashion enthusiast.",
  "Astrophysics PhD student.",
  "Sous chef with a chaotic schedule.",
  "Minimalist architect.",
  "Tech founder building the next big thing.",
  "Yoga instructor and plant parent.",
  "Professional gamer and streamer.",
  "Aspiring writer working in a coffee shop."
];

const BIO_HOBBY = [
  "I spend my days coding creative shaders.",
  "I run a community garden on weekends.",
  "Skydiver and e-sports competitor.",
  "I love cozy rainy days and tea.",
  "I love curating aesthetics.",
  "I can explain black holes to you.",
  "Food is my love language.",
  "I appreciate clean lines and messy burgers.",
  "Always chasing the perfect sunset.",
  "Obsessed with 90s anime and lo-fi beats."
];

const BIO_OUTRO = [
  "Looking for someone who can debate philosophy at 3 AM.",
  "Need a partner who is grounded and kind.",
  "Life is too short to be bored.",
  "Looking for intellectual connection.",
  "Value loyalty above all.",
  "Balance is key.",
  "I need someone who understands the grind.",
  "Looking for a partner to build a life with.",
  "Want someone to share my Spotify playlists with.",
  "Swipe right if you like dogs."
];

const VALUES_POOL = [
  'Creativity', 'Independence', 'Authenticity', 'Altruism', 'Sustainability', 'Health',
  'Adventure', 'Ambition', 'Fun', 'Knowledge', 'Stability', 'Empathy', 'Loyalty', 
  'Aesthetics', 'Community', 'Curiosity', 'Balance', 'Humor', 'Passion', 'Drive', 'Care'
];

const INTERESTS_POOL = [
  'Art', 'Jazz', 'Philosophy', 'Travel', 'Hiking', 'Gardening', 'Medicine', 'Cooking',
  'Gaming', 'Extreme Sports', 'EDM', 'History', 'Reading', 'True Crime', 'Cats',
  'Fashion', 'Socializing', 'Photography', 'Interior Design', 'Astronomy', 'Sci-Fi', 
  'Yoga', 'Reality TV', 'Culinary Arts', 'Dogs', 'Music Festivals', 'Tattoos', 
  'Architecture', 'Running', 'Coffee', 'Coding', 'Anime', 'Meditation'
];

// Reliable Unsplash Image Collections (Portraits)
const IMAGES_FEMALE = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop'
];

// Helper to pick random items from array
const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickMultiple = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const generateCandidates = (count: number, gender: 'Male' | 'Female' = 'Female'): CandidateProfile[] => {
  const profiles: CandidateProfile[] = [];
  const namePool = gender === 'Female' ? NAMES_FEMALE : NAMES_MALE;
  // For MVP demo, we reuse the same high-quality female images but cycle them with different metadata
  // In a real app, you would have distinct images for everyone.
  const imagePool = IMAGES_FEMALE; 

  for (let i = 0; i < count; i++) {
    const name = pickRandom(namePool);
    const age = Math.floor(Math.random() * (35 - 20 + 1)) + 20; // 20-35
    
    // Construct Bio
    const intro = pickRandom(BIO_INTRO);
    const hobby = pickRandom(BIO_HOBBY);
    const outro = pickRandom(BIO_OUTRO);
    const bio = `${intro} ${hobby} ${outro}`;

    profiles.push({
      id: `${gender.toLowerCase().charAt(0)}_${i}_${Math.random().toString(36).substr(2, 5)}`,
      name: name,
      age: age,
      image: imagePool[i % imagePool.length], // Cycle through images
      bio: bio,
      values: pickMultiple(VALUES_POOL, 3),
      interests: pickMultiple(INTERESTS_POOL, 4)
    });
  }

  return profiles;
};