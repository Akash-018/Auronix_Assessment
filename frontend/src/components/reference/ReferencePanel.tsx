import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Image as ImageIcon } from 'lucide-react';
import { Challenge } from '../../types';

interface ReferencePanelProps {
  challenge: Challenge | null;
}

export const ReferencePanel: React.FC<ReferencePanelProps> = ({ challenge }) => {
  const [zoom, setZoom] = useState<number>(100);

  if (!challenge || !challenge.reference_image_url) {
    return (
      <div className="h-full bg-[#0d131f] flex flex-col items-center justify-center p-6 text-center text-gray-500">
        <ImageIcon className="w-12 h-12 mb-3 text-gray-600" />
        <p className="text-sm font-medium text-gray-400">No Reference Image Uploaded</p>
        <p className="text-xs text-gray-600 mt-1">Upload a screenshot from the dashboard to set visual targets.</p>
      </div>
    );
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25));
  const handleResetZoom = () => setZoom(100);

  return (
    <div className="h-full bg-[#0d131f] flex flex-col overflow-hidden select-none">
      {/* Panel Header */}
      <div className="bg-[#111827] px-4 py-2 border-b border-[#273549] flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-2 font-medium text-gray-200">
          <ImageIcon className="w-4 h-4 text-blue-400" />
          <span>Reference Image</span>
        </div>
        <div className="flex items-center space-x-2">
          {challenge.reference_width && challenge.reference_height && (
            <span className="bg-[#161e2e] px-2 py-0.5 rounded border border-[#273549] text-[10px] text-gray-400 font-mono">
              {challenge.reference_width}×{challenge.reference_height} px ({challenge.reference_aspect_ratio})
            </span>
          )}
          <div className="flex items-center space-x-1 bg-[#161e2e] border border-[#273549] rounded p-0.5">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:text-white rounded hover:bg-[#273549] transition"

            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1 min-w-[32px] text-center">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:text-white rounded hover:bg-[#273549] transition"

            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 hover:text-white rounded hover:bg-[#273549] transition"

            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Image Viewing Area */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#090d16]">
        <div
          style={{ width: `${zoom}%`, transition: 'width 0.15s ease' }}
          className="max-w-none shadow-2xl rounded border border-[#273549]"
        >
          <img
            src={challenge.reference_image_url}
            alt="Target Design Reference"
            className="w-full h-auto object-contain block"
          />
        </div>
      </div>
    </div>
  );
};
