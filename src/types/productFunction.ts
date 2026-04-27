export interface ProductFunction {
  functionId: number
  functionName: string
}

export interface ProductFunctionPayload {
  functionId: number
  functionName: string
}

export interface ProductFunctionApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}