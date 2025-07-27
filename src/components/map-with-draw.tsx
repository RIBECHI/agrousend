
'use client';

import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';

const onCreated = (e: any) => {
  const { layer } = e;
  console.log('Polygon created:', layer.toGeoJSON());
};

const MapWithDraw = ({ open }: { open: boolean }) => {
  if (!open) {
    return null;
  }

  return (
    <MapContainer
      center={[-15.77972, -47.92972]}
      zoom={4}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <FeatureGroup>
        <EditControl
          position="topright"
          onCreated={onCreated}
          draw={{
            rectangle: false,
            polygon: true,
            circle: false,
            circlemarker: false,
            marker: false,
            polyline: false,
          }}
        />
      </FeatureGroup>
    </MapContainer>
  );
};

export default MapWithDraw;
