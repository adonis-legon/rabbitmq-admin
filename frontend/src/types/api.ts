export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  details?: {
    field?: string;
    rejectedValue?: any;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}