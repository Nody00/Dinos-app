import { ApiReferenceOptions } from '@scalar/nestjs-api-reference';

export type ScalarTheme =
  | 'default'
  | 'alternate'
  | 'moon'
  | 'purple'
  | 'solarized'
  | 'bluePlanet'
  | 'saturn'
  | 'kepler'
  | 'mars'
  | 'deepSpace';

export interface ScalarConfigOptions {
  theme?: ScalarTheme;
  specUrl?: string;
}

export function getScalarConfig(options?: ScalarConfigOptions): ApiReferenceOptions {
  const theme = (options?.theme ?? process.env.SCALAR_THEME ?? 'moon') as ScalarTheme;
  const specUrl = options?.specUrl ?? '/api-json';

  return {
    theme,
    url: specUrl,
  };
}
