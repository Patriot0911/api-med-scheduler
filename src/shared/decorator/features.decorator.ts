import { SetMetadata } from '@nestjs/common';

export const FEATURE_KEY = 'features';
export const Feature = (name: string) => SetMetadata(FEATURE_KEY, name);
