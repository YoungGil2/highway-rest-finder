'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { RestStop, RouteOption } from '@/types';
import { isNearRoute } from '@/utils/geo';

const KakaoMap = dynamic(() => import('@/components/KakaoMap'), { ssr: false });

type Coords = {
  x: number;
  y: number;
  address: string;
};

const Home = () => {
  const [origin, setOrigin] = useState<Coords | null>(null);
  const [destination, setDestination] = useState<Coords | null>(null);
  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [restStops, setRestStops] = useState<RestStop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPostcode = (type: 'origin' | 'destination') => {
    new window.daum.Postcode({
      oncomplete: (data) => {
        const address = data.address;
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(address, (result, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const coords: Coords = {
              x: parseFloat(result[0].x),
              y: parseFloat(result[0].y),
              address,
            };
            if (type === 'origin') {
              setOrigin(coords);
              setOriginInput(address);
            } else {
              setDestination(coords);
              setDestinationInput(address);
            }
          }
        });
      },
    }).open();
  };

  const handleSearch = async () => {
    if (!origin || !destination) {
      setError('출발지와 도착지를 모두 입력해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    setRouteOptions([]);
    setRestStops([]);
    setSelectedIndex(0);

    try {
      const routeRes = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination }),
      });

      if (!routeRes.ok) throw new Error('경로 조회에 실패했습니다.');

      const options: RouteOption[] = await routeRes.json();
      setRouteOptions(options);

      await fetchRestStops(options[0], 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRestStops = async (route: RouteOption, idx: number) => {
    const lngs = route.polyline.map(([x]) => x);
    const lats = route.polyline.map(([, y]) => y);
    const neLat = Math.max(...lats);
    const neLng = Math.max(...lngs);
    const swLat = Math.min(...lats);
    const swLng = Math.min(...lngs);

    const stopsRes = await fetch(`/api/reststops?neLat=${neLat}&neLng=${neLng}&swLat=${swLat}&swLng=${swLng}`);
    if (!stopsRes.ok) throw new Error('휴게소 정보 조회에 실패했습니다.');

    const stopsData: RestStop[] = await stopsRes.json();
    const filtered = stopsData.filter((stop) => isNearRoute(stop, route.polyline));
    setRestStops(filtered);
    setSelectedIndex(idx);
  };

  const handleSelectRoute = async (idx: number) => {
    if (idx === selectedIndex) return;
    setLoading(true);
    try {
      await fetchRestStops(routeOptions[idx], idx);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
    return `${meters}m`;
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}시간 ${m}분`;
    return `${m}분`;
  };

  const formatToll = (won: number) => (won > 0 ? `통행료 ${won.toLocaleString()}원` : '통행료 없음');

  return (
    <div className="flex flex-col h-full">
      <header className="bg-blue-600 text-white px-6 py-3 shadow-md shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">고속도로 휴게소 찾기</h1>
            <p className="text-blue-200 text-xs mt-0.5">카카오맵 기반 경로 위 휴게소 탐색</p>
          </div>
          {routeOptions.length > 0 && origin && destination && (
            <div className="text-right text-sm">
              <div className="flex items-center gap-1.5 text-white font-medium">
                <span className="max-w-28 truncate text-right text-xs">{origin.address}</span>
                <span className="text-blue-300">→</span>
                <span className="max-w-28 truncate text-xs">{destination.address}</span>
              </div>
              <div className="text-blue-200 text-xs mt-0.5">휴게소 {restStops.length}개</div>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">출발지</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={originInput}
                  onChange={(e) => setOriginInput(e.target.value)}
                  placeholder="주소를 검색하세요"
                  readOnly
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 cursor-pointer"
                  onClick={() => openPostcode('origin')}
                />
                <button
                  onClick={() => openPostcode('origin')}
                  className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap"
                >
                  검색
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">도착지</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={destinationInput}
                  onChange={(e) => setDestinationInput(e.target.value)}
                  placeholder="주소를 검색하세요"
                  readOnly
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 cursor-pointer"
                  onClick={() => openPostcode('destination')}
                />
                <button
                  onClick={() => openPostcode('destination')}
                  className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap"
                >
                  검색
                </button>
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '검색 중...' : '경로 검색'}
            </button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
            )}

            {routeOptions.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-gray-700">경로 선택</h2>
                {routeOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectRoute(idx)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      idx === selectedIndex ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className={`font-medium text-sm ${idx === selectedIndex ? 'text-blue-700' : 'text-gray-900'}`}>
                      {opt.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex gap-2">
                      <span>{formatDistance(opt.distance)}</span>
                      <span>·</span>
                      <span>{formatDuration(opt.duration)}</span>
                      <span>·</span>
                      <span>{formatToll(opt.toll)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {restStops.length > 0 && (
            <div className="px-4 pb-4 flex-1">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">경로 위 휴게소 ({restStops.length}개)</h2>
              <div className="space-y-2">
                {restStops.map((stop) => (
                  <div key={stop.id} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm space-y-1.5">
                    <div className="flex items-start justify-between gap-1">
                      <div className="font-medium text-sm text-gray-900">{stop.name}</div>
                      <a
                        href={stop.detailUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-xs text-blue-500 hover:underline"
                      >
                        상세보기
                      </a>
                    </div>
                    <div className="text-xs text-gray-500">
                      {stop.routeName} · {stop.direction}
                    </div>
                    {stop.address && <div className="text-xs text-gray-400">{stop.address}</div>}
                    {stop.phone && <div className="text-xs text-gray-500">📞 {stop.phone}</div>}
                    {(stop.parking.normal > 0 || stop.parking.large > 0) && (
                      <div className="text-xs text-gray-500">
                        주차 일반 {stop.parking.normal}대 · 대형 {stop.parking.large}대
                        {stop.parking.disabled > 0 && ` · 장애인 ${stop.parking.disabled}대`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        <main className="flex-1">
          <KakaoMap routes={routeOptions} selectedIndex={selectedIndex} restStops={restStops} />
        </main>
      </div>
    </div>
  );
};

export default Home;
