
'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-draw';

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


const LeafletMapDisplay: React.FC<LeafletMapDisplayProps> = ({ plots }) => {
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

            const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
                attribution: 'Tiles &copy; Esri',
            }).addTo(map);

            // Create a pane for the labels to ensure they are on top
            map.createPane('labels');
            const labelsPane = map.getPane('labels');
            if (labelsPane) {
                labelsPane.style.zIndex = '650';
                labelsPane.style.pointerEvents = 'none'; // Clicks go through to the map
            }

            const labelsLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                pane: 'labels'
            }).addTo(map);
            

            if (plots && plots.length > 0) {
                 const featureGroup = L.featureGroup();
                 plots.forEach(plot => {
                    if (plot.geoJson) {
                       L.geoJSON(plot.geoJson, { style: geoJsonStyle }).addTo(featureGroup);
                    }
                 });
                 featureGroup.addTo(map);
                 
                 if (featureGroup.getBounds().isValid()) {
                    map.fitBounds(featureGroup.getBounds().pad(0.1));
                 }
            }
        }
    
        return () => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          }
        };
      }, [plots]);


  return (
    <div 
      ref={mapContainerRef} 
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem', zIndex: 0 }} 
    />
  );
};

export default LeafletMapDisplay;
