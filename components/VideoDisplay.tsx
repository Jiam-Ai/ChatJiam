
import React from 'react';
import type { VideoContent } from '../types';

interface VideoDisplayProps {
  data: VideoContent;
}

const VideoDisplay: React.FC<VideoDisplayProps> = ({ data }) => {
    return (
        <div className="w-full max-w-sm">
            <div className="aspect-video rounded-lg overflow-hidden mb-2 border border-cyan-500/30">
                <video src={data.videoUrl} controls playsInline loop className="w-full h-full object-cover bg-black" />
            </div>
            {data.prompt && (
                <p className="text-sm italic text-gray-300 px-1">
                    "{data.prompt}"
                </p>
            )}
             <a 
                href={data.videoUrl}
                download={`jiam-video-${Date.now()}.mp4`}
                className="inline-block mt-3 bg-cyan-500/20 text-cyan-300 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors hover:bg-cyan-500 hover:text-black"
            >
                Download Video
            </a>
        </div>
    );
};

export default VideoDisplay;