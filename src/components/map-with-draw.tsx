
'use client';

import { useEffect, useRef } from 'react';
import L, { LatLngTuple } from 'leaflet';
import 'leaflet-draw';

// Workaround for Leaflet's default icon issues with bundlers
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

interface MapWithDrawProps {
    onDrawComplete: (areaInHectares: number, layer: any) => void;
    onMapStateChange: (center: LatLngTuple, zoom: number) => void;
    center: LatLngTuple;
    zoom: number;
    drawnLayer: any;
    isViewOnly?: boolean;
}

const MapWithDraw: React.FC<MapWithDrawProps> = ({ onDrawComplete, onMapStateChange, center, zoom, drawnLayer, isViewOnly = false }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      // Fix default icon path issue
      const DefaultIcon = L.icon({
          iconRetinaUrl: iconRetinaUrl.src,
          iconUrl: iconUrl.src,
          shadowUrl: shadowUrl.src,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
      });
      L.Marker.prototype.options.icon = DefaultIcon;

      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        maxZoom: 22,
      });
      mapInstanceRef.current = map;

      // Base layer with satellite imagery
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 20,
      }).addTo(map);
      
      // Overlay layer with labels
      L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxZoom: 20,
        pane: 'shadowPane' // Ensures labels are drawn on top of other layers
      }).addTo(map);


      // FeatureGroup to store editable layers
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnItemsRef.current = drawnItems;

      // Restore previously drawn layer
      if (drawnLayer) {
        const layer = L.geoJSON(drawnLayer, {
          style: {
            color: '#f06e52',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.2
          }
        });
        layer.eachLayer(l => drawnItems.addLayer(l));
        if (layer.getBounds().isValid()) {
            map.fitBounds(layer.getBounds());
        }
      }

      if (!isViewOnly) {
        // Initialize the draw control
        const drawControl = new L.Control.Draw({
          edit: {
            featureGroup: drawnItems,
          },
          draw: {
            polygon: {
              allowIntersection: false,
              shapeOptions: {
                color: '#f06e52'
              }
            },
            polyline: false,
            rectangle: false,
            circle: false,
            marker: false,
            circlemarker: false,
          },
        });
        map.addControl(drawControl);

        const handleDrawEvent = (event: L.LeafletEvent) => {
          const layer = (event as any).layer;
          
          drawnItems.clearLayers();
          drawnItems.addLayer(layer);
          
          const latlngs = layer.getLatLngs()[0];
          const areaInSquareMeters = L.GeometryUtil.geodesicArea(latlngs);
          const areaInHectares = areaInSquareMeters / 10000;
          
          onDrawComplete(areaInHectares, layer.toGeoJSON());
        }

        map.on(L.Draw.Event.CREATED, handleDrawEvent);
        map.on(L.Draw.Event.EDITED, handleDrawEvent);
      }
      
      map.on('zoomend moveend', () => {
          const newCenter = map.getCenter();
          const newZoom = map.getZoom();
          onMapStateChange([newCenter.lat, newCenter.lng], newZoom);
      });

    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={mapContainerRef}
      style={{ height: '100%', width: '100%' }}
    />
  );
};

export default MapWithDraw;
