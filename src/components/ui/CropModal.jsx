import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

export default function CropModal({ imageSrc, onConfirm, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);
  const [aspect, setAspect] = useState(0); // 0 = free

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedArea(croppedPixels);
  }, []);

  const aspects = [
    { label: 'Serbest', value: 0 },
    { label: '1:1', value: 1 },
    { label: '16:9', value: 16 / 9 },
    { label: '4:3', value: 4 / 3 },
    { label: '3:2', value: 3 / 2 },
    { label: '9:16', value: 9 / 16 },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Görseli Kırp</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="relative w-full h-[400px] bg-gray-950">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect || undefined}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="p-4 space-y-3 border-t border-gray-800">
          {/* Aspect ratio */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 shrink-0">Oran:</span>
            {aspects.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => setAspect(a.value)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  aspect === a.value
                    ? 'bg-cyan-500 text-gray-950 font-semibold'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 shrink-0">Zoom:</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-cyan-500"
            />
            <span className="text-xs text-gray-400 w-10 text-right">{zoom.toFixed(1)}x</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg"
            >
              Vazgeç
            </button>
            <button
              onClick={() => croppedArea && onConfirm(croppedArea)}
              className="px-4 py-2 text-sm text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium"
            >
              Kırp & Uygula
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
