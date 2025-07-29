
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Map, { MapRef, NavigationControl, useControl, Source, Layer } from 'react-map-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { LngLatLike } from 'maplibre-gl';
import * as turf from '@turf/turf';

interface MapWithDrawProps {
  onDrawComplete?: (areaInHectares: number, geoJson: any) => void;
  readOnly?: boolean;
  plots?: any[];
}

const MAPTILER_API_KEY = "OpIi9ZULNHzrESv6T2vL";
const MAPTILER_STYLE_URL = `https://api.maptiler.com/maps/satellite/style.json`;

// Custom hook to wrap the MapboxDraw control
function DrawControl(props: any) {
  useControl(() => new MapboxDraw(props), {
    position: props.position,
  });
  return null;
}

const MapWithDraw = ({ onDrawComplete, readOnly = false, plots = [] }: MapWithDrawProps) => {
  const mapRef = useRef<MapRef>(null);
  const [initialViewState, setInitialViewState] = useState({
    longitude: -54,
    latitude: -15,
    zoom: 3.5,
  });


  const onDrawCreate = useCallback((e: any) => {
    const feature = e.features[0];
    if (feature && onDrawComplete) {
      const area = turf.area(feature); // in square meters
      const areaInHectares = area / 10000;
      onDrawComplete(areaInHectares, feature.geometry);
    }
  }, [onDrawComplete]);

  const onDrawUpdate = useCallback((e: any) => {
     if (e.features.length > 0 && onDrawComplete) {
        const feature = e.features[0];
        const area = turf.area(feature);
        const areaInHectares = area / 10000;
        onDrawComplete(areaInHectares, feature.geometry);
    }
  }, [onDrawComplete]);

  const onDrawDelete = useCallback(() => {
    if(onDrawComplete) {
        onDrawComplete(0, null);
    }
  }, [onDrawComplete]);


  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    map.on('draw.create', onDrawCreate);
    map.on('draw.update', onDrawUpdate);
    map.on('draw.delete', onDrawDelete);

    return () => {
        map.off('draw.create', onDrawCreate);
        map.off('draw.update', onDrawUpdate);
        map.off('draw.delete', onDrawDelete);
    };
  }, [onDrawCreate, onDrawUpdate, onDrawDelete]);



  useEffect(() => {
    if (readOnly && plots.length > 0 && mapRef.current) {
      const allCoordinates: LngLatLike[] = [];
      plots.forEach(plot => {
        if (plot.geoJson && plot.geoJson.coordinates) {
          plot.geoJson.coordinates[0].forEach((coord: number[]) => {
            allCoordinates.push([coord[0], coord[1]]);
          });
        }
      });
      if (allCoordinates.length > 0) {
        const map = mapRef.current.getMap();
        const bounds = allCoordinates.reduce((bounds, coord) => {
          return bounds.extend(coord);
        }, new (map as any).LngLatBounds(allCoordinates[0], allCoordinates[0]));

        mapRef.current.fitBounds(bounds, { padding: 40, duration: 1000 });
      }
    } else if (!readOnly) {
       if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
                if(mapRef.current) {
                    setInitialViewState({
                        longitude: position.coords.longitude,
                        latitude: position.coords.latitude,
                        zoom: 13,
                    })
                }
            },
            () => {
              console.log("Geolocation failed or was denied.");
            }
          );
      }
    }
  }, [readOnly, plots]);


  return (
    <Map
      ref={mapRef}
      initialViewState={initialViewState}
      mapStyle={MAPTILER_STYLE_URL}
      mapTilerApiKey={MAPTILER_API_KEY}
      style={{ width: '100%', height: '100%' }}
      attributionControl={false}
      mapLib={import('maplibre-gl')}
    >
      <NavigationControl position="top-right" />
      {!readOnly && (
         <DrawControl
            position="top-left"
            displayControlsDefault={false}
            controls={{
              polygon: true,
              trash: true,
            }}
            defaultMode="draw_polygon"
        />
      )}
       {readOnly && plots.length > 0 && (
         <Source type="geojson" data={{type: 'FeatureCollection', features: plots.map(p => ({type: 'Feature', geometry: p.geoJson, properties: {}}))}}>
           <Layer 
              id="farm-plots-fill"
              type="fill"
              paint={{
                'fill-color': '#69B166',
                'fill-opacity': 0.5
              }}
            />
            <Layer 
              id="farm-plots-stroke"
              type="line"
              paint={{
                'line-color': '#69B166',
                'line-width': 2
              }}
            />
         </Source>
       )}
    </Map>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(MapWithDraw);
