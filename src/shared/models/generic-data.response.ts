export interface IGenericDataResponse<T> {
  data: T;
  status: boolean;
  message?: string;
};
