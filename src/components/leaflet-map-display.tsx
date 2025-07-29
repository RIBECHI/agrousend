
'use client';

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
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

interface LeafletMapDisplayProps {
  plots: FarmPlot[];
}

const geoJsonStyle = {
    color: 'hsl(142, 60%, 35%)',
    weight: 2,
    fillColor: 'rgba(142, 60%, 45%, 0.4)',
    fillOpacity: 0.5,
};

// Componente para ajustar a visão do mapa para os polígonos
const MapFitter = ({ plots }: { plots: FarmPlot[] }) => {
    const map = useMap();
    useEffect(() => {
        if (plots && plots.length > 0 && plots[0].geoJson) {
            const geoJsonLayer = L.geoJSON(plots[0].geoJson);
            map.fitBounds(geoJsonLayer.getBounds().pad(0.1));
        }
    }, [plots, map]);

    return null;
}

const LeafletMapDisplay: React.FC<LeafletMapDisplayProps> = ({ plots }) => {
    const mapRef = useRef<L.Map | null>(null);

    // Efeito para destruir o mapa ao desmontar o componente, prevenindo o erro
    useEffect(() => {
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

  return (
    <MapContainer 
      center={[-15.7942, -47.8825]} 
      zoom={4} 
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem', zIndex: 0 }}
      whenCreated={mapInstance => { mapRef.current = mapInstance }}
      scrollWheelZoom={false}
      zoomControl={false}
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution='Tiles &copy; Esri &mdash; Source: Esri'
      />

      {plots.map(plot => (
          plot.geoJson && <GeoJSON key={plot.id} data={plot.geoJson} style={geoJsonStyle} />
      ))}
      <MapFitter plots={plots} />
    </MapContainer>
  );
};

export default LeafletMapDisplay;
