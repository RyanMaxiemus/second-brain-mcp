import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';

export interface Config {
  indexed_paths: string[];
  ignore_patterns: string[];
  embeddings: {
    model: string;
    batch_size: number;
  };
  git_integration: boolean;
}

export async function loadConfig(rootPath: string): Promise<Config> {
  const configPath = path.join(rootPath, '.second-brain.yml');

  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return yaml.parse(content);
  } catch {
    // Return defaults
    return {
      indexed_paths: [rootPath],
      ignore_patterns: [],
      embeddings: {
        model: 'text-embedding-3-small',
        batch_size: 20
      },
      git_integration: true
    };
  }
}
