export interface Blog {
  id: string;
  title: string;
  labels: any[];
  time: string;
}
export type Blogs = Blog[];

export interface Api {
  totalPage: number;
  numbers: number;
  fetchList: string[];
  blogs: Blogs;
}
export interface AxiosResponse {
  data: any;
  status: number;
  statusText: string;
  headers: any;
  request: any;
}
