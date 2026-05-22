export type RestStop = {
  id: string
  name: string
  direction: string
  lat: number
  lng: number
  facilities: string[]
  routeName: string
  address: string
  phone: string
  parking: {
    normal: number
    large: number
    disabled: number
  }
  detailUrl: string
}

export type RouteOption = {
  label: string
  polyline: [number, number][]
  distance: number
  duration: number
  toll: number
}
