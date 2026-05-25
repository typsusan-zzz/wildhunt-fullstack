export type ApiResponse<T> = {
  code: string;
  message: string;
  data: T;
  success: boolean;
};

export type PageResponse<T> = {
  records: T[];
  total: number;
  page: number;
  size: number;
};
