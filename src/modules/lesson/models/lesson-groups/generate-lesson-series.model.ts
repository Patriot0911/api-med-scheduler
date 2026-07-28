export interface IGenerateLessonSeriesModel {
  baseLessonId: string;
  intervalDays?: number;
  repeatCount?: number;
  dates?: Date[];
};
