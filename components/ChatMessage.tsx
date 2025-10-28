import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  onOptionClick?: (value: string) => void;
}

const UserIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white flex-shrink-0">
        U
    </div>
);

const BotIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
    </div>
);


const ChatMessage: React.FC<ChatMessageProps> = ({ message, onOptionClick }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <BotIcon />}
      <div className={`max-w-md lg:max-w-2xl`}>
        <div className={`px-4 py-3 rounded-2xl shadow-md inline-block ${
            isUser
              ? 'bg-gradient-to-br from-purple-600 to-pink-500 text-white rounded-br-none'
              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
          }`}
        >
          <p className="text-base whitespace-pre-wrap">{message.text}</p>
        </div>
        {!isUser && message.options && onOptionClick && (
            <div className="flex flex-wrap gap-2 mt-3">
                {message.options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onOptionClick(option.value)}
                        className="px-5 py-2.5 bg-white border border-purple-300 text-purple-700 rounded-full hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 text-base font-semibold shadow-sm"
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        )}
      </div>
       {isUser && <UserIcon />}
    </div>
  );
};

export default ChatMessage;