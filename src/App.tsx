import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import wordList from './wordList';

function App() {
  const [letters, setLetters] = useState<string[]>(Array(6).fill(''));
  const [centerLetter, setCenterLetter] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Create refs for all input elements
  const centerRef = useRef<HTMLInputElement>(null);
  const outerRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  // Focus management
  useEffect(() => {
    // Initial focus on center hexagon
    if (centerRef.current && centerLetter === '') {
      centerRef.current.focus();
    }
  }, []);

  // Add global keyboard event listener for Enter key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isFormValid) {
        findWords();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [letters, centerLetter]); // Re-add listener when letters or centerLetter changes

  const focusNext = (currentIndex: number) => {
    if (currentIndex === -1) {
      // Moving from center to first outer hexagon
      outerRefs.current[0]?.focus();
      setActiveIndex(0);
    } else if (currentIndex < 5) {
      // Moving between outer hexagons
      outerRefs.current[currentIndex + 1]?.focus();
      setActiveIndex(currentIndex + 1);
    }
  };

  const focusPrevious = (currentIndex: number) => {
    if (currentIndex === 0) {
      // Moving from first outer hexagon to center
      centerRef.current?.focus();
      setActiveIndex(-1);
    } else if (currentIndex > 0) {
      // Moving between outer hexagons
      outerRefs.current[currentIndex - 1]?.focus();
      setActiveIndex(currentIndex - 1);
    }
  };

  const checkForDuplicates = (newLetter: string, currentIndex: number) => {
    if (!newLetter) return false;
    
    // Check against center letter
    if (newLetter === centerLetter) {
      return true;
    }
    
    // Check against other letters
    return letters.some((letter, idx) => 
      idx !== currentIndex && letter === newLetter
    );
  };

  const handleLetterChange = (index: number, value: string) => {
    const newValue = value.toLowerCase().replace(/[^a-z]/g, '');
    
    // Clear error when removing a letter
    if (newValue === '') {
      setError(null);
      const newLetters = [...letters];
      newLetters[index] = '';
      setLetters(newLetters);
      return;
    }
    
    if (newValue.length <= 1) {
      // Only check for duplicates when adding a new letter
      if (checkForDuplicates(newValue, index)) {
        setError(`The letter "${newValue}" has already been used`);
        return;
      }

      setError(null); // Clear error on successful letter addition
      const newLetters = [...letters];
      newLetters[index] = newValue;
      setLetters(newLetters);
      
      if (newValue !== '') {
        focusNext(index);
      }
    }
  };

  const handleCenterLetterChange = (value: string) => {
    const newValue = value.toLowerCase().replace(/[^a-z]/g, '');
    
    // Clear error when removing a letter
    if (newValue === '') {
      setError(null);
      setCenterLetter('');
      return;
    }
    
    if (newValue.length <= 1) {
      // Only check for duplicates when adding a new letter
      if (letters.includes(newValue)) {
        setError(`The letter "${newValue}" has already been used`);
        return;
      }

      setError(null); // Clear error on successful letter addition
      setCenterLetter(newValue);
      
      if (newValue !== '') {
        focusNext(-1);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      setError(null); // Clear error on backspace
      if (index === -1) {
        if (centerLetter === '') {
          // Stay on center when empty
          e.preventDefault();
        }
      } else {
        if (letters[index] === '') {
          e.preventDefault();
          focusPrevious(index);
        }
      }
    }
  };

  const findWords = () => {
    const allLetters = [...letters, centerLetter];
    const validLetters = new Set(allLetters.filter(l => l !== ''));
    
    const validWords = wordList.filter(word => {
      // Word must be at least 4 letters long
      if (word.length < 4) return false;
      
      // Word must contain the center letter
      if (!word.includes(centerLetter)) return false;
      
      // All letters in word must be in our letter set
      return word.split('').every(letter => validLetters.has(letter));
    });
    
    setWords(validWords);
    setHasSearched(true);
  };

  const resetGame = () => {
    setIsResetting(true);
    setTimeout(() => {
      setLetters(Array(6).fill(''));
      setCenterLetter('');
      setWords([]);
      setActiveIndex(-1);
      setError(null);
      setHasSearched(false);
      centerRef.current?.focus();
      setIsResetting(false);
    }, 300);
  };

  const isFormValid = letters.filter(l => l !== '').length === 6 && centerLetter !== '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-yellow-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-yellow-800 animate-fade-in">
          Spelling Bee Solver
        </h1>
        
        <div className={`relative w-[300px] h-[300px] mx-auto mb-8 transition-opacity duration-300 ${isResetting ? 'opacity-0' : 'opacity-100'}`}>
          {/* Error message */}
          {error && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-full">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md text-sm text-center animate-shake">
                {error}
              </div>
            </div>
          )}

          {/* Outer hexagons */}
          {letters.map((letter, index) => {
            const angle = (index * 60 - 30) * (Math.PI / 180);
            const x = 150 + Math.cos(angle) * 80;
            const y = 150 + Math.sin(angle) * 80;
            
            return (
              <div
                key={index}
                className="absolute w-16 h-16 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                  backgroundColor: letter ? '#E5E7EB' : '#F3F4F6',
                  transform: `translate(-50%, -50%) ${activeIndex === index ? 'scale(1.05)' : 'scale(1)'}`,
                }}
              >
                <input
                  ref={el => outerRefs.current[index] = el}
                  type="text"
                  value={letter}
                  onChange={(e) => handleLetterChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-full h-full bg-transparent text-center text-2xl font-bold uppercase focus:outline-none transition-all duration-300 ${
                    activeIndex === index ? 'animate-pulse' : ''
                  }`}
                  maxLength={1}
                />
              </div>
            );
          })}
          
          {/* Center hexagon */}
          <div
            className={`absolute left-1/2 top-1/2 w-16 h-16 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300`}
            style={{
              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
              backgroundColor: centerLetter ? '#EAB308' : '#FDE047',
              transform: `translate(-50%, -50%) ${activeIndex === -1 ? 'scale(1.05)' : 'scale(1)'}`,
            }}
          >
            <input
              ref={centerRef}
              type="text"
              value={centerLetter}
              onChange={(e) => handleCenterLetterChange(e.target.value)}
              onKeyDown={(e) => handleKeyDown(-1, e)}
              className={`w-full h-full bg-transparent text-center text-2xl font-bold uppercase focus:outline-none transition-all duration-300 ${
                activeIndex === -1 ? 'animate-pulse' : ''
              }`}
              maxLength={1}
            />
          </div>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={findWords}
            disabled={!isFormValid}
            className="px-6 py-2 bg-yellow-500 text-white rounded-full font-semibold hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Find Words
          </button>
          
          <button
            onClick={resetGame}
            className="px-6 py-2 bg-gray-200 rounded-full font-semibold hover:bg-gray-300 transition-all duration-300 flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 transition-transform duration-300 ${isResetting ? 'rotate-180' : ''}`} />
            Reset
          </button>
        </div>

        {hasSearched && (
          <div className="bg-white rounded-lg p-6 shadow-lg animate-fade-in">
            {words.length > 0 ? (
              <>
                <h2 className="text-xl font-bold mb-4">Found Words ({words.length})</h2>
                <div className="max-h-[400px] overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {words.map((word, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm transition-colors duration-200 hover:bg-gray-200"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <h2 className="text-xl font-bold text-gray-600">No Words Found</h2>
                <p className="text-gray-500 mt-2">Try different letter combinations</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;