
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
  name: string;
  area: number;
  culture: string;
  geoJson: string; 
  userId: string;
  createdAt: any;
}

interface LeafletMapDisplayProps {
  plots: FarmPlot[];
  onPlotClick?: (plot: FarmPlot) => void;
}

const geoJsonStyle = {
    color: 'hsl(142, 60%, 35%)',
    weight: 2,
    fillColor: 'hsl(142, 60%, 45%)',
    fillOpacity: 0.4,
};

const geoJsonHoverStyle = {
    color: 'hsl(142, 70%, 45%)',
    weight: 3,
    fillColor: 'hsl(142, 70%, 55%)',
    fillOpacity: 0.6,
};


const LeafletMapDisplay: React.FC<LeafletMapDisplayProps> = ({ plots, onPlotClick }) => {
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
                maxZoom: 20,
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
                       try {
                            const parsedGeoJson = JSON.parse(plot.geoJson);
                            
                            // This logic handles all known formats of the geoJson data
                            let feature;
                            if (parsedGeoJson.type === 'Feature') {
                                // It's already a valid Feature
                                feature = parsedGeoJson;
                            } else if (parsedGeoJson.geometry && parsedGeoJson.geometry.type) {
                                // It's an object with a geometry property, like { geometry: { ... } }
                                // This is common from older layer.toGeoJSON() calls
                                feature = { type: 'Feature', properties: {}, geometry: parsedGeoJson.geometry };
                            } else if (parsedGeoJson.type && parsedGeoJson.coordinates) {
                                // It's a raw geometry object, like { type: 'Polygon', coordinates: [...] }
                                feature = { type: 'Feature', properties: {}, geometry: parsedGeoJson };
                            } else {
                                console.warn("Skipping invalid GeoJSON object for plot:", plot.id);
                                return; // Skip this plot
                            }
                            
                            const geoJsonLayer = L.geoJSON(feature, { 
                                style: geoJsonStyle,
                                onEachFeature: (feature, layer) => {
                                    if(onPlotClick) {
                                        layer.on('click', () => {
                                            onPlotClick(plot);
                                        });

                                        layer.on('mouseover', () => {
                                            (layer as L.Path).setStyle(geoJsonHoverStyle);
                                        });
                                        layer.on('mouseout', () => {
                                            (layer as L.Path).setStyle(geoJsonStyle);
                                        });
                                    }
                                }
                             });
                            
                            geoJsonLayer.addTo(drawnItems);
                       } catch (e) {
                            console.error("Failed to parse or add GeoJSON layer for plot:", plot.id, e);
                       }
                    }
                });
                
                // Only fit bounds if there is more than one plot, or it's the first load
                // This prevents re-zooming when a single plot is selected for detail view
                if (plots.length !== 1) {
                    const bounds = drawnItems.getBounds();
                    if (bounds.isValid()) {
                       map.fitBounds(bounds.pad(0.1));
                    }
                } else if (plots.length === 1) {
                    const bounds = drawnItems.getBounds();
                     if (bounds.isValid()) {
                       map.fitBounds(bounds.pad(0.1));
                    }
                }

            } else {
                 // If no plots, set to default view
                 map.setView([-15.7942, -47.8825], 4);
            }
        }
    }, [plots, onPlotClick]);


  return (
    <div 
      ref={mapContainerRef} 
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem', zIndex: 0 }} 
    />
  );
};

export default LeafletMapDisplay;
