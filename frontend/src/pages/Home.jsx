import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-5xl font-extrabold text-teal-700 mb-6">
        AI-Powered Diet Optimization
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl">
        Achieve your fitness goals with our advanced Machine Learning model (HCMLP). 
        Get personalized, high-adherence meal plans instantly.
      </p>
      <Link 
        to="/app" 
        className="bg-teal-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-teal-700 transition shadow-lg"
      >
        Get Your Diet Plan →
      </Link>
    </div>
  );
}