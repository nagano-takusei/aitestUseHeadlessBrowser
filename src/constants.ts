export const CACHE_DIR = '.cache';
export const GRID_IMAGE_DIR = 'gridImage';

export const RAW_IMAGE_FILENAME = (resolution: string, timestamp: string): string =>
  `rawImage.${resolution}.${timestamp}.png`;

export const GRID_IMAGE_FILENAME = (resolution: string): string =>
  `grid${resolution}.png`;

export const COMBINED_IMAGE_FILENAME = (resolution: string, timestamp: string): string =>
  `withGridImage.${resolution}.${timestamp}.png`;
