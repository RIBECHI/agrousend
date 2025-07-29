
'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, GeoJSON } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import * as turf from '@turf/turf';

// Corrige o problema do ícone padrão do Leaflet no Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


interface FarmPlot {
  id: string;
  geoJson: any;
}

interface LeafletMapProps {
  onDrawComplete?: (areaInHectares: number, geoJson: any) => void;
  plots?: FarmPlot[];
  mode: 'draw' | 'display';
}

const LeafletMap: React.FC<LeafletMapProps> = ({ onDrawComplete, plots, mode }) => {
  const handleCreate = (e: any) => {
    if (onDrawComplete) {
      const { layer } = e;
      const geoJson = layer.toGeoJSON();
      const areaInMeters = turf.area(geoJson);
      const areaInHectares = areaInMeters / 10000;
      onDrawComplete(areaInHectares, geoJson.geometry);
    }
  };

  const geoJsonStyle = {
    color: 'hsl(142, 60%, 35%)',
    weight: 2,
    fillColor: 'rgba(142, 60%, 45%, 0.4)',
    fillOpacity: 0.5,
  };

  return (
    <MapContainer 
      center={[-15.7942, -47.8825]} 
      zoom={4} 
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem', zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
       <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      />

      {mode === 'draw' && onDrawComplete && (
        <FeatureGroup>
          <EditControl
            position="topright"
            onCreated={handleCreate}
            draw={{
              rectangle: false,
              circle: false,
              circlemarker: false,
              marker: false,
              polyline: false,
              polygon: {
                allowIntersection: false,
                drawError: {
                  color: '#e1e100',
                  message: '<strong>Oh snap!</strong> you can\'t draw that!',
                },
                shapeOptions: {
                  color: '#22c55e',
                },
              },
            }}
            edit={{
                edit: false,
                remove: true,
            }}
          />
        </FeatureGroup>
      )}

      {mode === 'display' && plots && plots.map(plot => (
          plot.geoJson && <GeoJSON key={plot.id} data={plot.geoJson} style={geoJsonStyle} />
      ))}
    </MapContainer>
  );
};

export default LeafletMap;
