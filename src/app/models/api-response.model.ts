import { HttpStatus } from '../enum/http.status';

export class ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;

  constructor(code: number, message: string, data: T | null = null) {
    this.code = code;
    this.message = message;
    this.data = data;
  }

  static ok<T>(data: T, code = HttpStatus.OK, message = "OK"): ApiResponse<T> {
    return new ApiResponse<T>(code, message, data);
  }

  static fail<T = unknown>(message = "NOK", code = HttpStatus.BAD_REQUEST, data: T | null = null): ApiResponse<T> {
    return new ApiResponse<T>(code, message, data);
  }

  getCode(): number {
    return this.code;
  }
  setCode(code: number) {
    this.code = code;
  }

  getMessage(): string {
    return this.message;
  }
  setMessage(message: string) {
    this.message = message;
  }

  getData(): T | null {
    return this.data;
  }
  setData(data: T | null) {
    this.data = data;
  }

  toJSON() {
    return { code: this.code, message: this.message, data: this.data };
  }

  toString(): string {
    return JSON.stringify(this.toJSON());
  }
}
