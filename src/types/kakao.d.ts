declare namespace kakao {
  namespace maps {
    class Map {
      constructor(container: HTMLElement, options: MapOptions)
      setCenter(latlng: LatLng): void
      setBounds(bounds: LatLngBounds): void
    }

    type MapOptions = {
      center: LatLng
      level: number
    }

    class LatLng {
      constructor(lat: number, lng: number)
      getLat(): number
      getLng(): number
    }

    class LatLngBounds {
      constructor(sw?: LatLng, ne?: LatLng)
      extend(latlng: LatLng): void
    }

    class Marker {
      constructor(options: MarkerOptions)
      setMap(map: Map | null): void
    }

    type MarkerOptions = {
      position: LatLng
      map?: Map
    }

    class Polyline {
      constructor(options: PolylineOptions)
      setMap(map: Map | null): void
    }

    type PolylineOptions = {
      path: LatLng[]
      strokeWeight?: number
      strokeColor?: string
      strokeOpacity?: number
      strokeStyle?: string
      map?: Map
    }

    class InfoWindow {
      constructor(options: InfoWindowOptions)
      open(map: Map, marker: Marker): void
      close(): void
    }

    type InfoWindowOptions = {
      content: string
      removable?: boolean
    }

    function load(callback: () => void): void

    namespace event {
      function addListener(
        target: Marker,
        type: string,
        handler: () => void
      ): void
    }

    namespace services {
      class Geocoder {
        addressSearch(
          address: string,
          callback: (result: AddressSearchResult[], status: Status) => void
        ): void
      }

      type AddressSearchResult = {
        address_name: string
        x: string
        y: string
      }

      enum Status {
        OK = 'OK',
        ZERO_RESULT = 'ZERO_RESULT',
        ERROR = 'ERROR',
      }

      class Places {
        keywordSearch(
          keyword: string,
          callback: (result: PlaceSearchResult[], status: Status) => void
        ): void
      }

      type PlaceSearchResult = {
        place_name: string
        x: string
        y: string
      }
    }
  }
}

type DaumPostcodeResult = {
  address: string
  addressType: string
  bname: string
  buildingName: string
}

interface Window {
  kakao: typeof kakao
  daum: {
    Postcode: new (options: {
      oncomplete: (data: DaumPostcodeResult) => void
    }) => { open: () => void }
  }
}
