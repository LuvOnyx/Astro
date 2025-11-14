import React from 'react';
import './ImagePromptCard.css';
import { StopIcon, XIcon } from './Icons';

interface ImagePromptCardProps {
  image: { data: string; mimeType: string };
  userInput: string;
  onUserInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  isLoading: boolean;
  onStopGeneration: () => void;
}

export const ImagePromptCard: React.FC<ImagePromptCardProps> = ({
  image,
  userInput,
  onUserInputChange,
  onKeyDown,
  onRemoveImage,
  isLoading,
  onStopGeneration,
}) => {
  return (
    <div className="card-container relative">
      <button
        type="button"
        onClick={onRemoveImage}
        className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors z-10"
        aria-label="Remove image"
      >
        <XIcon className="w-4 h-4" />
      </button>

      <div className="image-wrapper">
        <img
          src={`data:${image.mimeType};base64,${image.data}`}
          alt="User-provided prompt attachment"
          className="card-image"
        />
      </div>

      <div className="content-area">
        <div className="message-input-container">
          <input
            type="text"
            placeholder="Write a message"
            className="message-input"
            value={userInput}
            onChange={onUserInputChange}
            onKeyDown={onKeyDown}
            disabled={isLoading}
            autoFocus
          />
          {isLoading ? (
            <button
              type="button"
              onClick={onStopGeneration}
              className="send-button bg-red-600 hover:bg-red-500"
              title="Stop Generation"
            >
              <StopIcon className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              className="send-button"
              aria-label="Send message"
            >
              {/* Unicode character for the send icon from user's example */}
              &#10148;
            </button>
          )}
        </div>
      </div>
    </div>
  );
};