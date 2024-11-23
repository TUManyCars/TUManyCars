import { NextRequest, NextResponse } from 'next/server';

const initialMarkers = [
  { id: "1", lat: 48.13515, lng: 11.5825 },
  { id: "2", lat: 48.13525, lng: 11.5827 },
];

function updateMarkerPositions(markers: typeof initialMarkers) {
  return markers.map(marker => ({
    ...marker,
    lat: marker.lat + (Math.random() - 0.5) * 0.0008,
    lng: marker.lng + (Math.random() - 0.5) * 0.0008,
  }));
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  let markers = [...initialMarkers];

  const stream = new ReadableStream({
    start(controller) {
      const sendMarkers = () => {
        markers = updateMarkerPositions(markers);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(markers)}\n\n`));
      };

      // Send initial state
      sendMarkers();

      // Update every 2 seconds
      const interval = setInterval(sendMarkers, 2000);

      // Cleanup
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
