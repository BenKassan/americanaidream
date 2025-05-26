
import { Link } from "react-router-dom";

const Navigation = () => {
  return (
    <nav className="mb-8">
      <div className="flex items-center justify-center gap-6">
        <Link 
          to="/" 
          className="text-green-700 hover:text-green-800 font-medium transition-colors"
        >
          Home
        </Link>
        <Link 
          to="/history" 
          className="text-green-700 hover:text-green-800 font-medium transition-colors"
        >
          History
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;
