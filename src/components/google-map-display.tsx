
'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Polygon, InfoWindow } from '@react-google-maps/api';

export interface FarmPlot {
  id: string;
  name: string;
  culture?: string;
  area: number;
  geoJson: any; // GeoJSON geometry
}

interface GoogleMapDisplayProps {
    plots: FarmPlot[];
}

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.8rem',
};

const defaultCenter = {
  lat: -15.7942,
  lng: -47.8825,
};

function GoogleMapDisplay({ plots }: GoogleMapDisplayProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ['drawing', 'geometry'],
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<FarmPlot | null>(null);
  const [infoWindowPosition, setInfoWindowPosition] = useState<google.maps.LatLng | null>(null);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(function callback() {
    mapRef.current = null;
  }, []);

  useEffect(() => {
    if (isLoaded && mapRef.current && plots.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        plots.forEach(plot => {
            if (plot.geoJson && plot.geoJson.coordinates) {
                const paths = plot.geoJson.coordinates[0].map((coord: number[]) => ({ lat: coord[1], lng: coord[0] }));
                paths.forEach((path: google.maps.LatLngLiteral) => bounds.extend(path));
            }
        });
        if (!bounds.isEmpty()) {
            mapRef.current.fitBounds(bounds);
        }
    }
  }, [isLoaded, plots, mapRef]);

  const handlePolygonClick = (plot: FarmPlot, event: google.maps.MapMouseEvent) => {
    setSelectedPlot(plot);
    if(event.latLng) {
      setInfoWindowPosition(event.latLng);
    }
  };

  const polygonOptions = {
    fillColor: "rgba(142, 60%, 45%, 0.4)",
    strokeColor: "hsl(142, 60%, 35%)",
    strokeWeight: 2,
  };

  if (loadError) {
    return <div>Erro ao carregar o mapa. Verifique a chave da API.</div>;
  }

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={4}
      onLoad={onLoad}
      onUnmount={onUnmount}
      mapTypeId="satellite"
      options={{
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        rotateControl: true,
        scaleControl: true
      }}
    >
      {plots.map(plot => (
          plot.geoJson && <Polygon
            key={plot.id}
            paths={plot.geoJson.coordinates[0].map((coord: number[]) => ({ lat: coord[1], lng: coord[0] }))}
            options={polygonOptions}
            onClick={(e) => handlePolygonClick(plot, e)}
          />
      ))}

      {selectedPlot && infoWindowPosition && (
        <InfoWindow
          position={infoWindowPosition}
          onCloseClick={() => {
            setSelectedPlot(null);
            setInfoWindowPosition(null);
          }}
        >
          <div className="p-2">
            <h3 className="font-bold text-lg">{selectedPlot.name}</h3>
            <p><strong>Cultura:</strong> {selectedPlot.culture || 'Não definida'}</p>
            <p><strong>Área:</strong> {selectedPlot.area.toFixed(2)} ha</p>
          </div>
        </InfoWindow>
      )}

    </GoogleMap>
  ) : <></>;
}

export default React.memo(GoogleMapDisplay);
