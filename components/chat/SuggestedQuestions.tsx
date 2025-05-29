import React from 'react';

interface SuggestedQuestionsProps {
  questions: string[];
  onSelectQuestion: (question: string) => void;
}

const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  questions,
  onSelectQuestion
}) => {
  if (!questions.length) return null;
  
  return (
    <div className="mb-4 px-4">
      <h3 className="text-xs text-gray-500 mb-2">Suggested questions</h3>
      <div className="flex overflow-x-auto pb-2 space-x-2 hide-scrollbar">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onSelectQuestion(question)}
            className="whitespace-nowrap px-3 py-2 rounded-full text-sm bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors flex-shrink-0"
          >
            {question}
          </button>
        ))}
      </div>
      
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default SuggestedQuestions;
