
'use client';

import { useEffect, useRef } from 'react';
import L, { LatLngTuple } from 'leaflet';
import 'leaflet-draw';

// Workaround for Leaflet's default icon issues with bundlers
import 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/images/marker-icon-2x.png';

interface MapWithDrawProps {
  onDrawComplete: (areaInHectares: number, geoJson: any) => void;
}

const MapWithDraw = ({ onDrawComplete }: MapWithDrawProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const drawnItems = useRef<L.FeatureGroup>(new L.FeatureGroup());

  useEffect(() => {
    // Prevent map from re-initializing
    if (!mapRef.current || mapInstance.current) return;

    // Set default icon paths
     try {
        // @ts-ignore
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default,
            iconUrl: require('leaflet/dist/images/marker-icon.png').default,
            shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
        });
    } catch (e) {
        console.error("Erro ao configurar ícones do Leaflet:", e);
    }


    const initialCenter: LatLngTuple = [-15.7942, -47.8825]; // Brazil
    const map = L.map(mapRef.current).setView(initialCenter, 4);
    mapInstance.current = map;

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(map);

    map.addLayer(drawnItems.current);

    const drawControl = new L.Control.Draw({
      draw: {
        polygon: {
          allowIntersection: false,
          shapeOptions: {
            color: '#69B166'
          }
        },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems.current,
        remove: true
      }
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItems.current.clearLayers(); // Limpa desenhos anteriores
      drawnItems.current.addLayer(layer);

      const geoJson = layer.toGeoJSON();
      const areaInMeters = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
      const areaInHectares = areaInMeters / 10000;

      onDrawComplete(areaInHectares, geoJson.geometry);
    });

     map.on(L.Draw.Event.EDITED, (event: any) => {
      event.layers.eachLayer((layer: any) => {
        const geoJson = layer.toGeoJSON();
        const areaInMeters = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
        const areaInHectares = areaInMeters / 10000;
        onDrawComplete(areaInHectares, geoJson.geometry);
      });
    });

    map.on(L.Draw.Event.DELETED, () => {
      onDrawComplete(0, null);
    });

     // Geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                if (mapInstance.current) {
                    const userLocation: LatLngTuple = [position.coords.latitude, position.coords.longitude];
                    mapInstance.current.setView(userLocation, 13);
                }
            },
            () => {
                console.log("Geolocation failed or was denied.");
            }
        );
    }


    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [onDrawComplete]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};

export default MapWithDraw;
