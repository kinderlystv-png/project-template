/**
 * Types for Security Recommendation System
 */

export interface SecurityRecommendation {
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'dependency' | 'code' | 'config' | 'general';
  description: string;
  solution: string;
  codeExample?: {
    before: string;
    after: string;
  };
  resources: string[];
  timeEstimate: string;
  steps: string[];
  tags: string[];
}

export interface IssueContext {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  file?: string;
  line?: number;
  code?: string;
  packageName?: string;
  version?: string;
  vulnerability?: string;
  configKey?: string;
  configValue?: string;
  framework?: string;
  additionalData?: Record<string, any>;
}

export interface RecommendationTemplate {
  id: string;
  title: string;
  description: string;
  solution: string;
  codeExample?: {
    before: string;
    after: string;
  };
  steps: string[];
  resources: string[];
  timeEstimate: string;
  tags: string[];
  applicableWhen: (context: IssueContext) => boolean;
}
