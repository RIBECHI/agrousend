
'use client';

import React, { useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import * as turf from '@turf/turf';

// Corrige o problema do ícone padrão do Leaflet no Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LeafletMapProps {
  onDrawComplete: (areaInHectares: number, geoJson: any) => void;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ onDrawComplete }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [-15.7942, -47.8825],
        zoom: 4,
        zoomControl: true,
      });
      mapInstanceRef.current = map;
      
      const satelliteLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: 'Tiles &copy; Esri' }
      ).addTo(map);

      const labelsLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          pane: 'shadowPane' // Renderiza as legendas em um painel "superior"
      }).addTo(map);

      // Garante que o painel de legendas tenha um z-index maior e não bloqueie os cliques
      const pane = map.getPane('shadowPane');
      if (pane) {
        pane.style.zIndex = '650';
        pane.style.pointerEvents = 'none';
      }

      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

      const drawControl = new L.Control.Draw({
        position: 'topright',
        draw: {
            polygon: {
                allowIntersection: false,
                shapeOptions: { color: '#22c55e' },
            },
            polyline: false,
            rectangle: false,
            circle: false,
            marker: false,
            circlemarker: false,
        },
        edit: {
            featureGroup: drawnItems,
            remove: true,
            edit: false,
        },
      });
      map.addControl(drawControl);

      map.on(L.Draw.Event.CREATED, (event: any) => {
        const layer = event.layer;
        drawnItems.clearLayers(); // Limpa desenhos anteriores
        drawnItems.addLayer(layer);

        const geoJson = layer.toGeoJSON();
        const areaInMeters = turf.area(geoJson);
        const areaInHectares = areaInMeters / 10000;
        onDrawComplete(areaInHectares, geoJson.geometry);
      });

       map.on(L.Draw.Event.DELETED, () => {
        // Quando uma forma é excluída, limpa os dados
        onDrawComplete(0, null);
      });
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onDrawComplete]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem', zIndex: 0 }} 
    />
  );
};

export default LeafletMap;
