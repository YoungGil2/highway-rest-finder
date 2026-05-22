import { NextRequest, NextResponse } from 'next/server'
import { RestStop } from '@/types'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
}

type LocationItem = {
  unitName: string
  unitCode: string
  stdRestCd: string
  routeName: string
  xValue: string
  yValue: string
}

type InfoItem = {
  svarNm: string
  svarAddr: string
  rprsTelNo: string
  cocrPrkgTrcn: string
  fscarPrkgTrcn: string
  dspnPrkgTrcn: string
}

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const neLat = parseFloat(searchParams.get('neLat') || '0')
  const neLng = parseFloat(searchParams.get('neLng') || '0')
  const swLat = parseFloat(searchParams.get('swLat') || '0')
  const swLng = parseFloat(searchParams.get('swLng') || '0')

  const key = process.env.PUBLIC_DATA_API_KEY || ''
  const baseParams = `key=${key}&type=json&numOfRows=300&pageNo=1`

  const [locationRes, infoRes] = await Promise.all([
    fetch(`https://data.ex.co.kr/openapi/locationinfo/locationinfoRest?${baseParams}`, { headers: HEADERS }),
    fetch(`https://data.ex.co.kr/openapi/restinfo/hiwaySvarInfoList?${baseParams}`, { headers: HEADERS }),
  ])

  if (!locationRes.ok || !infoRes.ok) {
    return NextResponse.json({ error: '휴게소 정보 조회 실패' }, { status: 500 })
  }

  const [locationData, infoData] = await Promise.all([locationRes.json(), infoRes.json()])

  const infoMap = new Map<string, InfoItem>()
  for (const item of (infoData.list || []) as InfoItem[]) {
    infoMap.set(item.svarNm, item)
  }

  const directionFromName = (name: string) => {
    const match = name.match(/\((.+?)\)/)
    return match ? match[1] : ''
  }

  const restStops: RestStop[] = (locationData.list || [] as LocationItem[])
    .map((item: LocationItem) => {
      const lat = parseFloat(item.yValue || '0')
      const lng = parseFloat(item.xValue || '0')
      const info = infoMap.get(item.unitName)

      return {
        id: item.unitCode || item.stdRestCd,
        name: item.unitName,
        direction: directionFromName(item.unitName),
        lat,
        lng,
        facilities: [],
        routeName: item.routeName,
        address: info?.svarAddr || '',
        phone: info?.rprsTelNo || '',
        parking: {
          normal: parseInt(info?.cocrPrkgTrcn || '0'),
          large: parseInt(info?.fscarPrkgTrcn || '0'),
          disabled: parseInt(info?.dspnPrkgTrcn || '0'),
        },
        detailUrl: `https://map.naver.com/v5/search/${encodeURIComponent(item.unitName)}`,
      }
    })
    .filter((stop: RestStop) => {
      if (!stop.lat || !stop.lng) return false
      return stop.lat >= swLat && stop.lat <= neLat && stop.lng >= swLng && stop.lng <= neLng
    })

  return NextResponse.json(restStops)
}
