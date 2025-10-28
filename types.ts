export type Sender = 'user' | 'bot';

export interface MessageOption {
  label: string;
  value: string;
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  options?: MessageOption[];
}

export type OnboardingStep = 'initial' | 'name' | 'grade' | 'gender' | 'mbti' | 'tutorial' | 'main_app';

export interface UserInfo {
  name: string;
  grade: string;
  gender: string;
  mbti: string;
  learningPreferences?: string[];
  bio?: string;
}

export interface AiSettings {
  name: string;
  firstPerson: string;
  personality: string;
  customPrompt: string;
}

export interface DrillProblem {
  question: string;
}

export interface Mistake {
  id: string;
  problem: string;
  problemImage?: string;
  cause: string;
  drill?: DrillProblem[];
  answers?: string[];
  feedback?: string;
  memo?: string;
}

export type GoalType = 'long' | 'medium' | 'short';

export interface GoalBackground {
  type: 'color' | 'preset' | 'custom';
  value: string; // color code, preset key, or base64 data
}

export interface Goal {
  id: string;
  type: GoalType;
  title: string;
  deadline: string;
  reward: string;
  background: GoalBackground;
  audioUrl?: string;
  audioBlob?: Blob;
  isCompleted: boolean;
  reflection?: {
    rating: number;
    text: string;
  };
}

export interface SavedChat {
  id: string;
  title: string;
  messages: Message[];
  savedAt: string;
}