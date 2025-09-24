
import React from 'react';
import type { User, Topic } from '../types';
import { TOPICS } from '../constants';
import BotIcon from './icons/BotIcon';

interface GreetingProps {
  user: User;
  onPromptWithTopic: (topic: Topic) => void;
}

const Greeting: React.FC<GreetingProps> = ({ user, onPromptWithTopic }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 text-center animate-fade-in">
      <div className="w-full max-w-2xl mx-auto">
        <BotIcon className="w-16 h-16 md:w-20 md:h-20 text-text-secondary mb-4 mx-auto" />
        <h2 className="text-2xl md:text-4xl font-bold mb-3 text-text-primary">
          Hello, {user.name.split(' ')[0]}!
        </h2>
        <p className="text-lg text-text-secondary mb-10">
          How can I help you innovate today?
        </p>

        {/* Topic Starters */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onPromptWithTopic(topic)}
              className="flex flex-col items-center text-center p-4 rounded-lg bg-bg-secondary hover:bg-bg-tertiary-hover border border-border-secondary transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <topic.icon className="w-8 h-8 mb-2 text-blue-500" />
              <h3 className="font-semibold text-sm text-text-primary">{topic.name}</h3>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Greeting);
