export interface ApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}

export interface Location {
  locationId: number
  locationName: string
}

export interface CreateLocationPayload {
  locationId: number
  locationName: string
}

export interface UpdateLocationPayload extends CreateLocationPayload {}