
'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface ImageTiltProps {
  imageUrl: string;
  ['data-ai-hint']?: string;
}

const ImageTilt: React.FC<ImageTiltProps> = ({ imageUrl }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;

    // Cena
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);

    // Geometria e Material
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(imageUrl);
    const geometry = new THREE.PlaneGeometry(8, 8, 32, 32); // Ajuste o tamanho do plano conforme necessário
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    camera.position.z = 5;
    
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (event: MouseEvent) => {
        const rect = currentMount.getBoundingClientRect();
        mouseX = ((event.clientX - rect.left) / currentMount.clientWidth) * 2 - 1;
        mouseY = -(((event.clientY - rect.top) / currentMount.clientHeight) * 2 - 1);
    };
    currentMount.addEventListener('mousemove', handleMouseMove);

    // Animação
    const animate = () => {
      requestAnimationFrame(animate);

      // Efeito de inclinação
      plane.rotation.y = mouseX * 0.2;
      plane.rotation.x = mouseY * 0.2;

      renderer.render(scene, camera);
    };

    animate();
    
    const handleResize = () => {
        if (!currentMount) return;
        camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    }
    window.addEventListener('resize', handleResize);

    // Limpeza
    return () => {
      window.removeEventListener('resize', handleResize);
      currentMount.removeEventListener('mousemove', handleMouseMove);
      if(renderer.domElement.parentElement) {
          renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, [imageUrl]);

  return <div ref={mountRef} className="w-full h-full max-w-[600px] max-h-[600px] aspect-square" />;
};

export default ImageTilt;
