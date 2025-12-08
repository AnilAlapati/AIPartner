export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface UserPersona {
  coreValues: string[];
  hobbies: string[];
  communicationStyle: string;
  idealPartnerTraits: string[];
  summary: string;
}

export interface CandidateProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  image: string;
  values: string[];
  interests: string[];
}

export interface MatchResult {
  candidateId: string;
  matchScore: number;
  reasoning: string;
  compatibilityHighlights: string[];
}

export type AppStep = 'landing' | 'chat' | 'analyzing' | 'profile' | 'matches';
export type Gender = 'Male' | 'Female' | 'Non-binary';