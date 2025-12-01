export interface IGenericListMeta {
  count: number;
};

export interface IGenericListPayloadResponse<T> {
  items: T[];
  meta: IGenericListMeta;
};
