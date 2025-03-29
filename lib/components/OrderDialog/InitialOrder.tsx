import { Button } from "lib/components/ui/button";

interface InitialOrderScreenProps {
  onCancel: () => void;
  onContinue: () => void;
}

export const InitialOrderScreen = ({
  onCancel,
  onContinue,
}: InitialOrderScreenProps) => {
  return (
    <div className="rf-flex rf-flex-col rf-bg-white rf-rounded-xl rf-p-8 rf-max-w-md rf-w-full rf-mx-auto">
      <h2 className="rf-text-3xl rf-font-bold rf-text-center rf-mb-8">Order</h2>
      
      <p className="rf-text-lg rf-text-center rf-mb-12">Want to place an order?</p>
      
      <div className="rf-flex rf-justify-between rf-mt-auto">
        <Button
          variant="outline"
          onClick={onCancel}
          className="rf-px-8 rf-border-red-500 rf-text-red-500 rf-hover:bg-red-50 rf-hover:text-red-600"
        >
          Cancel
        </Button>
        
        <Button
          onClick={onContinue}
          className="rf-px-8 rf-bg-gray-700 rf-hover:bg-gray-800"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
