import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import acornLogo from "@/assets/acorn-icon-blue.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-2xl">
        <div className="flex justify-center mb-6">
          <img src={acornLogo} alt="Acorn Finance" className="w-24 h-24" />
        </div>
        
        <h1 className="text-5xl font-bold text-navy mb-4">
          Acorn Finance
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8">
          Comprehensive mortgage and finance deal management platform
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/auth')}
            size="lg"
            className="w-full max-w-xs bg-gradient-primary hover:opacity-90"
          >
            Sign In / Register
          </Button>
          
          <div className="text-sm text-muted-foreground">
            Multi-role platform for clients, brokers, and administrators
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
