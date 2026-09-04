export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
  CANDIDATE = 'CANDIDATE',
}

export enum ChallengeCategory {
  HTML = 'HTML',
  JS = 'JS',
}

export enum ChallengeStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum SubmissionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  category: ChallengeCategory;
  starter_js?: string;
  test_cases?: Record<string, any>;
  reference_image_url?: string;
  reference_width?: number;
  reference_height?: number;
  reference_aspect_ratio?: number;
  status: ChallengeStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  challenge_id: string;
  owner_id: string;
  html_code: string;
  css_code: string;
  js_code: string;
  created_at: string;
  updated_at: string;
  last_saved_at: string;
}

export interface Submission {
  id: string;
  project_id: string;
  submitted_at: string;
  rendered_image_url?: string;
  visual_score?: number;
  code_score?: number;
  final_score?: number;
  evaluation_details?: Record<string, any>;
  status: SubmissionStatus;
}

export interface SubmissionDetail {
  id: string;
  project_id: string;
  challenge_id?: string;
  challenge_title: string;
  candidate_email: string;
  submitted_at: string;
  status: SubmissionStatus;
  html_code?: string;
  css_code?: string;
  js_code?: string;
}
