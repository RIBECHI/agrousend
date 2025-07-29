
'use client'

import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, DrawingManager } from '@react-google-maps/api';

interface GoogleMapDrawProps {
    onDrawComplete: (areaInHectares: number, geoJson: any) => void;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: -15.7942,
  lng: -47.8825, // Default to Brazil
};

const polygonOptions = {
    fillColor: "rgba(142, 60%, 45%, 0.4)",
    strokeColor: "hsl(142, 60%, 35%)",
    strokeWeight: 2,
    editable: true,
    draggable: true,
};


function GoogleMapDraw({ onDrawComplete }: GoogleMapDrawProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script-draw',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ['drawing', 'geometry'],
  });

  const [drawnPolygon, setDrawnPolygon] = useState<google.maps.Polygon | null>(null);

  const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    if (drawnPolygon) {
        drawnPolygon.setMap(null); // Remove a forma anterior
    }
    setDrawnPolygon(polygon);
    
    const path = polygon.getPath().getArray();
    const coordinates = path.map(latLng => [latLng.lng(), latLng.lat()]);
    // Fecha o polígono
    coordinates.push([path[0].lng(), path[0].lat()]); 

    const geoJson = {
        type: "Polygon",
        coordinates: [coordinates]
    };
    
    if (window.google && window.google.maps && window.google.maps.geometry) {
        const areaInMeters = google.maps.geometry.spherical.computeArea(polygon.getPath());
        const areaInHectares = areaInMeters / 10000;
        onDrawComplete(areaInHectares, geoJson);
    }
    

    // Desativa o modo de desenho
    if (polygon.getMap()) {
      polygon.getMap()?.setOptions({
          drawingMode: null,
      });
    }


  }, [drawnPolygon, onDrawComplete]);
  

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    // Tenta obter a localização do usuário
     if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          map.setZoom(12);
        },
        () => {
          // Falha ao obter localização, mantém o padrão
          map.setCenter(defaultCenter);
          map.setZoom(4);
        }
      );
    } else {
      // Navegador não suporta geolocalização
      map.setCenter(defaultCenter);
       map.setZoom(4);
    }
  }, []);

  if (loadError) {
    return <div>Erro ao carregar o mapa. Verifique a chave da API.</div>;
  }

  const drawingOptions: google.maps.drawing.DrawingManagerOptions | undefined = isLoaded ? {
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          google.maps.drawing.OverlayType.POLYGON,
        ],
      },
      polygonOptions: polygonOptions,
  } : undefined;

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={4}
      onLoad={onLoad}
      mapTypeId="satellite"
    >
        <DrawingManager
            onPolygonComplete={onPolygonComplete}
            options={drawingOptions}
        />
    </GoogleMap>
  ) : <div>Carregando mapa...</div>;
}

export default React.memo(GoogleMapDraw);
