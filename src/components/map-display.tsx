
'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet's default icons are not properly configured for bundlers like Webpack.
// This is a common workaround.
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const MapDisplay = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // This effect runs when the component mounts.
    if (mapContainerRef.current && !mapInstanceRef.current) {
      // Create map instance only if it doesn't exist.
      
      // Fix for default icon issue with webpack
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

      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center: [-15.77972, -47.92972],
        zoom: 4,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      }).addTo(mapInstanceRef.current);
    }

    // Cleanup function: this runs when the component unmounts.
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount and cleanup runs on unmount.

  return (
    <div
      ref={mapContainerRef}
      style={{ height: '100%', width: '100%' }}
    />
  );
};

export default MapDisplay;
