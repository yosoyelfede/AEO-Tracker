import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Store, Coffee, MessageSquare, TrendingUp, MapPin, Bot, Sparkles, Zap, Globe, CheckCircle, Loader2 } from 'lucide-react';

interface DemoExperienceProps {
  // Will accept preset data in the future
  [key: string]: unknown;
}

// Preset brand lists for the demo
const brandLists = [
  {
    id: 'restaurants',
    name: 'Santiago Restaurants',
    description: 'Fine dining and casual restaurants in Santiago',
    icon: Coffee,
    brands: ['Boragó', 'Ambrosia', 'La Mar', 'Osaka', 'Mestizo'],
    color: 'from-orange-500 to-red-500',
    queries: [
      {
        id: 'best-restaurants',
        text: 'What are the best restaurants in Santiago, Chile?',
        description: 'General restaurant recommendations',
        icon: TrendingUp
      },
      {
        id: 'fine-dining',
        text: 'Where can I find fine dining restaurants in Santiago?',
        description: 'Upscale dining options',
        icon: Coffee
      },
      {
        id: 'local-favorites',
        text: 'What are the most popular local restaurants in Santiago?',
        description: 'Local favorites and hidden gems',
        icon: MapPin
      }
    ]
  },
  {
    id: 'retail',
    name: 'Retail Stores',
    description: 'Major retail chains and boutiques',
    icon: Store,
    brands: ['Falabella', 'Ripley', 'Paris', 'H&M', 'Zara'],
    color: 'from-blue-500 to-purple-500',
    queries: [
      {
        id: 'best-shopping',
        text: 'Where is the best shopping in Santiago?',
        description: 'Shopping recommendations',
        icon: Store
      },
      {
        id: 'department-stores',
        text: 'What are the main department stores in Santiago?',
        description: 'Major retail chains',
        icon: Store
      },
      {
        id: 'fashion-stores',
        text: 'Where can I find fashion stores in Santiago?',
        description: 'Clothing and fashion retailers',
        icon: Store
      }
    ]
  },
  {
    id: 'services',
    name: 'Service Businesses',
    description: 'Local service providers and professionals',
    icon: Users,
    brands: ['Banco de Chile', 'Clínica Alemana', 'Movistar', 'Entel', 'Cruz Verde'],
    color: 'from-green-500 to-teal-500',
    queries: [
      {
        id: 'best-bank',
        text: 'What is the best bank in Santiago?',
        description: 'Banking recommendations',
        icon: Users
      },
      {
        id: 'healthcare',
        text: 'Where can I find the best healthcare in Santiago?',
        description: 'Medical and healthcare services',
        icon: Users
      },
      {
        id: 'mobile-providers',
        text: 'What are the best mobile phone providers in Santiago?',
        description: 'Telecommunications services',
        icon: Users
      }
    ]
  }
];

// AI Models for the demo
const aiModels = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    description: 'OpenAI\'s conversational AI',
    icon: Bot,
    color: 'from-green-500 to-emerald-600',
    searchTime: 2000 // 2 seconds
  },
  {
    id: 'claude',
    name: 'Claude',
    description: 'Anthropic\'s helpful assistant',
    icon: Sparkles,
    color: 'from-orange-500 to-amber-600',
    searchTime: 3500 // 3.5 seconds
  },
  {
    id: 'gemini',
    name: 'Gemini',
    description: 'Google\'s multimodal AI',
    icon: Zap,
    color: 'from-blue-500 to-indigo-600',
    searchTime: 2800 // 2.8 seconds
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'Real-time search AI',
    icon: Globe,
    color: 'from-purple-500 to-violet-600',
    searchTime: 1500 // 1.5 seconds
  }
];

export const DemoExperience: React.FC<DemoExperienceProps> = () => {
  // Step state: 0 = pick brand list, 1 = pick query, 2 = model selection, 3 = searching, 4 = results, 5 = analytics
  const [step, setStep] = useState(0);
  const [selectedBrandList, setSelectedBrandList] = useState<any>(null);
  const [selectedQuery, setSelectedQuery] = useState<any>(null);
  const [searchProgress, setSearchProgress] = useState<{[key: string]: number}>({});
  const [completedModels, setCompletedModels] = useState<string[]>([]);

  // Auto-advance from model selection to searching
  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => {
        setStep(3);
      }, 3000); // Auto-advance after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Handle search progress for each model
  useEffect(() => {
    if (step === 3) {
      const intervals: NodeJS.Timeout[] = [];
      
      aiModels.forEach((model) => {
        const interval = setInterval(() => {
          setSearchProgress(prev => {
            const current = prev[model.id] || 0;
            const increment = 100 / (model.searchTime / 100); // Progress increment per 100ms
            
            if (current >= 100) {
              clearInterval(interval);
              setCompletedModels(prev => [...prev, model.id]);
              return prev;
            }
            
            return {
              ...prev,
              [model.id]: Math.min(current + increment, 100)
            };
          });
        }, 100);
        
        intervals.push(interval);
      });

      // Auto-advance to results when all models complete
      const maxTime = Math.max(...aiModels.map(m => m.searchTime));
      const resultsTimer = setTimeout(() => {
        setStep(4);
      }, maxTime + 1000);

      return () => {
        intervals.forEach(clearInterval);
        clearTimeout(resultsTimer);
      };
    }
  }, [step]);

  const handleBrandListSelect = (brandList: any) => {
    setSelectedBrandList(brandList);
    setTimeout(() => setStep(1), 500); // Auto-advance after selection
  };

  const handleQuerySelect = (query: any) => {
    setSelectedQuery(query);
    setTimeout(() => setStep(2), 500); // Auto-advance after selection
  };

  const renderBrandListSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Brand List</h3>
        <p className="text-gray-600">Select a brand list to track in our demo</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {brandLists.map((brandList) => {
          const Icon = brandList.icon;
          return (
            <motion.div
              key={brandList.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-300"
                onClick={() => handleBrandListSelect(brandList)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${brandList.color} rounded-lg flex items-center justify-center mr-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">{brandList.name}</h4>
                      <p className="text-sm text-gray-600">{brandList.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Brands to track:</p>
                    <div className="flex flex-wrap gap-1">
                      {brandList.brands.map((brand, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {brand}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBrandListSelect(brandList);
                      }}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Select This List
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );

  const renderQuerySelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className={`w-8 h-8 bg-gradient-to-r ${selectedBrandList?.color} rounded-lg flex items-center justify-center mr-3`}>
            {selectedBrandList?.icon && React.createElement(selectedBrandList.icon, { className: "w-4 h-4 text-white" })}
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Choose Your Query</h3>
        </div>
        <p className="text-gray-600">Select a query to test with your brand list</p>
      </div>
      
      <div className="grid md:grid-cols-1 gap-4">
        {selectedBrandList?.queries.map((query: any) => {
          const Icon = query.icon;
          return (
            <motion.div
              key={query.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-300"
                onClick={() => handleQuerySelect(query)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 mt-1">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold mb-2">{query.text}</h4>
                      <p className="text-sm text-gray-600 mb-3">{query.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {selectedBrandList.brands.slice(0, 3).map((brand: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {brand}
                            </Badge>
                          ))}
                          {selectedBrandList.brands.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{selectedBrandList.brands.length - 3} more
                            </Badge>
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuerySelect(query);
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Run This Query
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );

  const renderModelSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Models Selected</h3>
        <p className="text-gray-600">All models will be queried simultaneously</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {aiModels.map((model, index) => {
          const Icon = model.icon;
          return (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 bg-gradient-to-r ${model.color} rounded-lg flex items-center justify-center mr-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold">{model.name}</h4>
                      <p className="text-sm text-gray-600">{model.description}</p>
                    </div>
                    <div className="flex items-center">
                      <Badge variant="default" className="bg-green-600 text-white">
                        Selected
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center mt-8"
      >
        <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
          <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
          <span className="text-sm font-medium">Preparing to search all models...</span>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderSearching = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Searching AI Models</h3>
        <p className="text-gray-600">Querying all models simultaneously for brand mentions</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {aiModels.map((model, index) => {
          const Icon = model.icon;
          const progress = searchProgress[model.id] || 0;
          const isCompleted = completedModels.includes(model.id);
          
          return (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`border-2 ${isCompleted ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${model.color} rounded-lg flex items-center justify-center mr-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold">{model.name}</h4>
                      <p className="text-sm text-gray-600">{model.description}</p>
                    </div>
                    <div className="flex items-center">
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {isCompleted ? 'Completed' : 'Searching...'}
                      </span>
                      <span className="font-medium">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className={`h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center mt-8"
      >
        <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          <span className="text-sm font-medium">
            {completedModels.length === aiModels.length 
              ? 'All searches completed! Preparing results...' 
              : `Searching ${completedModels.length}/${aiModels.length} models...`
            }
          </span>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[500px]">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="brand-list-selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            {renderBrandListSelection()}
          </motion.div>
        )}
        
        {step === 1 && (
          <motion.div
            key="query-selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            {renderQuerySelection()}
          </motion.div>
        )}
        
        {step === 2 && (
          <motion.div
            key="model-selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            {renderModelSelection()}
          </motion.div>
        )}
        
        {step === 3 && (
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            {renderSearching()}
          </motion.div>
        )}
        
        {step > 3 && (
          <motion.div
            key="other-steps"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full text-center"
          >
            <p className="text-lg text-gray-500 mb-4">
              Step {step}: {step === 4 ? 'Results' : 'Analytics'}
            </p>
            <div className="space-y-4">
              <Button 
                onClick={() => setStep((s) => (s + 1) % 6)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next Step (Debug)
              </Button>
              <Button 
                variant="outline"
                onClick={() => setStep(0)}
                className="ml-2"
              >
                Reset Demo
              </Button>
            </div>
            <div className="mt-4 text-sm text-gray-400">
              Brand List: {selectedBrandList?.name || 'None'} | 
              Query: {selectedQuery?.text || 'None'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DemoExperience; 