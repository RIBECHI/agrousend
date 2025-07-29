
'use client';

import React, { useEffect, useRef } from 'react';
import L, { LatLngBounds } from 'leaflet';
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
  onBoundsChange: (bounds: LatLngBounds) => void;
}

const geoJsonStyle = {
    color: 'hsl(142, 60%, 35%)',
    weight: 2,
    fillColor: 'rgba(142, 60%, 45%, 0.4)',
    fillOpacity: 0.5,
};


const LeafletMapDisplay: React.FC<LeafletMapDisplayProps> = ({ plots, onBoundsChange }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

    // Initialize map
    useEffect(() => {
        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: [-15.7942, -47.8825],
                zoom: 4,
                zoomControl: true,
            });
            mapInstanceRef.current = map;

            L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
                attribution: 'Tiles &copy; Esri',
            }).addTo(map);

            map.createPane('labels');
            const labelsPane = map.getPane('labels');
            if (labelsPane) {
                labelsPane.style.zIndex = '650';
                labelsPane.style.pointerEvents = 'none';
            }

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                pane: 'labels'
            }).addTo(map);
            
            drawnItemsRef.current = new L.FeatureGroup();
            map.addLayer(drawnItemsRef.current);
            
            const handleBoundsChange = () => {
                onBoundsChange(map.getBounds());
            };

            map.on('moveend', handleBoundsChange);
            map.on('zoomend', handleBoundsChange);
        }
    
        return () => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          }
        };
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

    // Update plots on map
    useEffect(() => {
        const map = mapInstanceRef.current;
        const drawnItems = drawnItemsRef.current;

        if (map && drawnItems) {
            // Clear previous layers
            drawnItems.clearLayers();

            if (plots && plots.length > 0) {
                plots.forEach(plot => {
                    if (plot.geoJson) {
                       // FIX: Ensure data is a valid GeoJSON Feature object before rendering
                       let feature = plot.geoJson;
                       if (feature.type !== 'Feature') {
                         feature = {
                           type: 'Feature',
                           properties: {},
                           geometry: feature
                         };
                       }
                       L.geoJSON(feature, { style: geoJsonStyle }).addTo(drawnItems);
                    }
                });
                
                const bounds = drawnItems.getBounds();
                if (bounds.isValid()) {
                   map.fitBounds(bounds.pad(0.1));
                }
            } else {
                 // If no plots, set to default view
                 map.setView([-15.7942, -47.8825], 4);
            }
        }
    }, [plots]); // This effect re-runs whenever the plots array changes


  return (
    <div 
      ref={mapContainerRef} 
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem', zIndex: 0 }} 
    />
  );
};

export default LeafletMapDisplay;
