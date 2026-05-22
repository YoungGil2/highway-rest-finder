import { NextRequest, NextResponse } from 'next/server'
import { RouteOption } from '@/types'

type KakaoRoad = {
  vertexes: number[]
}

type KakaoRoute = {
  result_code: number
  summary: {
    distance: number
    duration: number
    fare: { toll: number }
  }
  sections: { roads: KakaoRoad[] }[]
}

async function fetchRoute(
  origin: { x: number; y: number },
  destination: { x: number; y: number },
  priority: 'RECOMMEND' | 'TIME' | 'DISTANCE',
  label: string
): Promise<RouteOption | null> {
  const params = new URLSearchParams({
    origin: `${origin.x},${origin.y}`,
    destination: `${destination.x},${destination.y}`,
    priority,
  })

  const res = await fetch(
    `https://apis-navi.kakaomobility.com/v1/directions?${params}`,
    {
      headers: {
        Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!res.ok) return null

  const data = await res.json()
  const route: KakaoRoute = data.routes?.[0]
  if (!route || route.result_code !== 0) return null

  const polyline: [number, number][] = []
  for (const section of route.sections) {
    for (const road of section.roads) {
      for (let i = 0; i < road.vertexes.length; i += 2) {
        polyline.push([road.vertexes[i], road.vertexes[i + 1]])
      }
    }
  }

  return {
    label,
    polyline,
    distance: route.summary.distance,
    duration: route.summary.duration,
    toll: route.summary.fare?.toll ?? 0,
  }
}

export async function POST(request: NextRequest) {
  const { origin, destination } = await request.json()

  const [recommend, time, distance] = await Promise.all([
    fetchRoute(origin, destination, 'RECOMMEND', '추천 경로'),
    fetchRoute(origin, destination, 'TIME', '최단 시간'),
    fetchRoute(origin, destination, 'DISTANCE', '최단 거리'),
  ])

  const options = [recommend, time, distance].filter(Boolean) as RouteOption[]

  if (options.length === 0) {
    return NextResponse.json({ error: '경로 없음' }, { status: 404 })
  }

  return NextResponse.json(options)
}
