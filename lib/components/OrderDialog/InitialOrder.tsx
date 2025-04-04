import { Button } from "lib/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "lib/components/ui/select";
import { Skeleton } from "lib/components/ui/skeleton";
import { ArrowDown } from "lucide-react";
import { useEffect } from "react";
import { useState } from "react";
interface InitialOrderScreenProps {
  onCancel: () => void;
  onContinue: () => void;
}

export const InitialOrderScreen = ({
  onCancel,
  onContinue,
}: InitialOrderScreenProps) => {
  const productCategories = [
    { id: "prototype", name: "Prototype" },
    { id: "development", name: "Development board" }
  ];

  const [isLoading, setIsLoading] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("prototype"); // Set default to prototype

  useEffect(() => {
    handleGetEstimate();
  }, []);

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setEstimatedCost(null);
    setTimeout(() => {
      handleGetEstimate();
    }, 0);
  };
  
  const handleGetEstimate = () => {
    if (!selectedCategory) return;
    
    setIsLoading(true);
    setEstimatedCost(null);
    
    // TODO: Replace with fake API call
    setTimeout(() => {
      const cost = Math.floor(Math.random() * 150) + 50;
      setEstimatedCost(cost);
      setIsLoading(false);
      
    }, 1500);
  };

  return (
    <div className="rf-flex rf-flex-col rf-bg-white rf-rounded-xl rf-p-8 rf-max-w-md rf-w-full rf-mx-auto">
      <h2 className="rf-text-3xl rf-font-bold rf-text-center rf-mb-8">Order PCB</h2>
      
      <div className="rf-mb-8">
        <label htmlFor="category" className="rf-block rf-text-sm rf-font-medium rf-text-gray-700 rf-mb-2">
          Select Product Category
        </label>
        <Select 
          onValueChange={handleSelectCategory} 
          value={selectedCategory || undefined}
        >
          <SelectTrigger className="rf-w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {productCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="rf-flex rf-flex-col rf-items-center rf-mb-8">
          <div className="rf-animate-pulse rf-flex rf-space-x-2 rf-items-center rf-mb-3">
            <ArrowDown className="rf-h-5 rf-w-5 rf-text-gray-400" />
            <span className="rf-text-gray-500">Fetching estimate...</span>
          </div>
          <Skeleton className="rf-h-6 rf-w-3/4 rf-mb-2" />
          <Skeleton className="rf-h-6 rf-w-1/2" />
        </div>
      ) : estimatedCost !== null ? (
        <div className="rf-bg-gray-50 rf-p-4 rf-rounded-lg rf-mb-8">
          <p className="rf-text-sm rf-text-gray-600 rf-mb-2">Estimated Cost:</p>
          <p className="rf-text-2xl rf-font-bold rf-text-gray-900">${estimatedCost.toFixed(2)}</p>
          <p className="rf-text-xs rf-text-gray-500 rf-mt-1">Pricing may vary based on specifications</p>
        </div>
      ) : null}
      
      <div className="rf-flex rf-justify-between rf-mt-auto">
        <Button
          variant="outline"
          onClick={onCancel}
          className="rf-px-8 rf-border-red-500 rf-text-red-500 hover:rf-bg-red-50 hover:rf-text-red-600"
        >
          Cancel
        </Button>
        
        <Button
          onClick={estimatedCost !== null ? onContinue : handleGetEstimate}
          disabled={!selectedCategory || isLoading}
          className={estimatedCost !== null ? "rf-px-8 rf-bg-gray-700 hover:rf-bg-gray-800" : "rf-px-8 rf-bg-blue-600 hover:rf-bg-blue-700"}
        >
          {estimatedCost !== null ? "Continue" : "Get Estimate"}
        </Button>
      </div>
    </div>
  );
};